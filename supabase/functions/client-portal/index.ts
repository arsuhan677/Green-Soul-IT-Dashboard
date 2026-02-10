import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function verifyClientSession(supabase: any, sessionToken: string) {
  const { data: session, error } = await supabase
    .from("client_sessions")
    .select("client_id, expires_at")
    .eq("session_token", sessionToken)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !session) {
    return null;
  }

  // Check if client is still active
  const { data: authRecord } = await supabase
    .from("client_auth")
    .select("active")
    .eq("client_id", session.client_id)
    .single();

  if (!authRecord?.active) {
    return null;
  }

  return session.client_id;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const sessionToken = req.headers.get("x-client-session");

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: "সেশন টোকেন প্রয়োজন" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clientId = await verifyClientSession(supabase, sessionToken);
    if (!clientId) {
      return new Response(
        JSON.stringify({ error: "অবৈধ বা মেয়াদ শেষ সেশন" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, ...data } = await req.json();

    switch (action) {
      case "get_projects": {
        const { data: projects, error } = await supabase
          .from("projects")
          .select(`
            id,
            title,
            status,
            progress,
            deadline,
            start_date,
            created_at,
            services (
              id,
              name,
              category
            )
          `)
          .eq("client_id", clientId)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching projects:", error);
          return new Response(
            JSON.stringify({ error: "প্রজেক্ট লোড করতে সমস্যা হয়েছে" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ projects }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_project_detail": {
        const { project_id } = data;

        // Verify project belongs to client
        const { data: project, error } = await supabase
          .from("projects")
          .select(`
            id,
            title,
            status,
            progress,
            deadline,
            start_date,
            created_at,
            services (
              id,
              name,
              category,
              description
            )
          `)
          .eq("id", project_id)
          .eq("client_id", clientId)
          .eq("is_deleted", false)
          .single();

        if (error || !project) {
          return new Response(
            JSON.stringify({ error: "প্রজেক্ট খুঁজে পাওয়া যায়নি" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get client notes for this project
        const { data: notes } = await supabase
          .from("project_client_notes")
          .select("*")
          .eq("project_id", project_id)
          .eq("client_id", clientId)
          .eq("is_deleted", false)
          .order("note_date", { ascending: false });

        return new Response(
          JSON.stringify({ project, notes: notes || [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "add_note": {
        const { project_id, note_text, note_date } = data;

        if (!note_text?.trim()) {
          return new Response(
            JSON.stringify({ error: "নোট টেক্সট আবশ্যক" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify project belongs to client
        const { data: project } = await supabase
          .from("projects")
          .select("id")
          .eq("id", project_id)
          .eq("client_id", clientId)
          .eq("is_deleted", false)
          .single();

        if (!project) {
          return new Response(
            JSON.stringify({ error: "প্রজেক্ট খুঁজে পাওয়া যায়নি" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: note, error } = await supabase
          .from("project_client_notes")
          .insert({
            project_id,
            client_id: clientId,
            note_text: note_text.trim(),
            note_date: note_date || new Date().toISOString().split("T")[0],
          })
          .select()
          .single();

        if (error) {
          console.error("Error adding note:", error);
          return new Response(
            JSON.stringify({ error: "নোট যোগ করতে সমস্যা হয়েছে" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, note }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete_note": {
        const { note_id } = data;

        // Verify note belongs to client
        const { error } = await supabase
          .from("project_client_notes")
          .update({ is_deleted: true, deleted_at: new Date().toISOString() })
          .eq("id", note_id)
          .eq("client_id", clientId);

        if (error) {
          return new Response(
            JSON.stringify({ error: "নোট মুছতে সমস্যা হয়েছে" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "অজানা অ্যাকশন" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "সার্ভার এরর" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
