import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Simple password hashing using Web Crypto API (available in Edge Functions)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Combine salt and password
  const combined = new Uint8Array([...salt, ...data]);
  
  // Hash using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Return salt + hash for verification later
  return `${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(':');
  if (!saltHex || !hashHex) return false;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // Convert salt back to bytes
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  
  // Combine salt and password
  const combined = new Uint8Array([...salt, ...data]);
  
  // Hash using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return computedHash === hashHex;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action, ...data } = await req.json();

    switch (action) {
      case "login": {
        const { client_code, password } = data;
        
        if (!client_code || !password) {
          return new Response(
            JSON.stringify({ error: "ক্লায়েন্ট আইডি এবং পাসওয়ার্ড আবশ্যক" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Find client auth record
        const { data: authRecord, error: authError } = await supabase
          .from("client_auth")
          .select("*, clients(*)")
          .eq("client_code", client_code.toUpperCase())
          .single();

        if (authError || !authRecord) {
          return new Response(
            JSON.stringify({ error: "ক্লায়েন্ট আইডি খুঁজে পাওয়া যায়নি" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!authRecord.active) {
          return new Response(
            JSON.stringify({ error: "আপনার অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify password
        const passwordMatch = await verifyPassword(password, authRecord.password_hash);
        if (!passwordMatch) {
          return new Response(
            JSON.stringify({ error: "পাসওয়ার্ড সঠিক নয়" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Generate session token
        const sessionToken = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        // Create session
        const { error: sessionError } = await supabase
          .from("client_sessions")
          .insert({
            client_id: authRecord.client_id,
            session_token: sessionToken,
            expires_at: expiresAt.toISOString(),
          });

        if (sessionError) {
          console.error("Session creation error:", sessionError);
          return new Response(
            JSON.stringify({ error: "সেশন তৈরি করতে সমস্যা হয়েছে" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            session_token: sessionToken,
            client: {
              id: authRecord.client_id,
              client_code: authRecord.client_code,
              name: authRecord.clients?.name,
              email: authRecord.clients?.email,
              phone: authRecord.clients?.phone,
              company: authRecord.clients?.company,
            },
            expires_at: expiresAt.toISOString(),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "verify": {
        const sessionToken = req.headers.get("x-client-session");
        
        if (!sessionToken) {
          return new Response(
            JSON.stringify({ error: "সেশন টোকেন পাওয়া যায়নি", valid: false }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Find valid session
        const { data: session, error: sessionError } = await supabase
          .from("client_sessions")
          .select("*, clients(*)")
          .eq("session_token", sessionToken)
          .gt("expires_at", new Date().toISOString())
          .single();

        if (sessionError || !session) {
          return new Response(
            JSON.stringify({ error: "সেশন মেয়াদ শেষ বা অবৈধ", valid: false }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get client auth to check if still active
        const { data: authRecord } = await supabase
          .from("client_auth")
          .select("active")
          .eq("client_id", session.client_id)
          .single();

        if (!authRecord?.active) {
          return new Response(
            JSON.stringify({ error: "আপনার অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে", valid: false }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            valid: true,
            client: {
              id: session.client_id,
              name: session.clients?.name,
              email: session.clients?.email,
              phone: session.clients?.phone,
              company: session.clients?.company,
              client_code: session.clients?.client_code,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "logout": {
        const sessionToken = req.headers.get("x-client-session");
        
        if (sessionToken) {
          await supabase
            .from("client_sessions")
            .delete()
            .eq("session_token", sessionToken);
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "create_credentials": {
        // This should be called by admin only - verify admin auth
        const authHeader = req.headers.get("authorization");
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: "অনুমোদন প্রয়োজন" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser(
          authHeader.replace("Bearer ", "")
        );

        if (userError || !user) {
          return new Response(
            JSON.stringify({ error: "অবৈধ টোকেন" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if user is admin
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .single();

        if (!roleData) {
          return new Response(
            JSON.stringify({ error: "শুধুমাত্র অ্যাডমিন এই কাজ করতে পারেন" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { client_id, password } = data;

        if (!client_id || !password) {
          return new Response(
            JSON.stringify({ error: "ক্লায়েন্ট এবং পাসওয়ার্ড আবশ্যক" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (password.length < 6) {
          return new Response(
            JSON.stringify({ error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get client info
        const { data: client, error: clientError } = await supabase
          .from("clients")
          .select("id, client_code")
          .eq("id", client_id)
          .single();

        if (clientError || !client) {
          return new Response(
            JSON.stringify({ error: "ক্লায়েন্ট খুঁজে পাওয়া যায়নি" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Hash password using Web Crypto API
        const passwordHash = await hashPassword(password);

        // Check if credentials already exist
        const { data: existingAuth } = await supabase
          .from("client_auth")
          .select("id")
          .eq("client_id", client_id)
          .single();

        if (existingAuth) {
          // Update existing
          const { error: updateError } = await supabase
            .from("client_auth")
            .update({ password_hash: passwordHash, active: true })
            .eq("client_id", client_id);

          if (updateError) {
            console.error("Update error:", updateError);
            return new Response(
              JSON.stringify({ error: "পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে: " + updateError.message }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } else {
          // Create new
          const { error: insertError } = await supabase
            .from("client_auth")
            .insert({
              client_id: client.id,
              client_code: client.client_code,
              password_hash: passwordHash,
              active: true,
            });

          if (insertError) {
            console.error("Insert error:", insertError);
            return new Response(
              JSON.stringify({ error: "লগইন তৈরি করতে সমস্যা হয়েছে: " + insertError.message }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            client_code: client.client_code,
            message: "লগইন তৈরি হয়েছে",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "toggle_active": {
        // Admin only
        const authHeader = req.headers.get("authorization");
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: "অনুমোদন প্রয়োজন" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser(
          authHeader.replace("Bearer ", "")
        );

        if (userError || !user) {
          return new Response(
            JSON.stringify({ error: "অবৈধ টোকেন" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if user is admin
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .single();

        if (!roleData) {
          return new Response(
            JSON.stringify({ error: "শুধুমাত্র অ্যাডমিন এই কাজ করতে পারেন" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { client_id, active } = data;

        const { error: updateError } = await supabase
          .from("client_auth")
          .update({ active })
          .eq("client_id", client_id);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: "স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // If deactivating, also delete all sessions
        if (!active) {
          await supabase
            .from("client_sessions")
            .delete()
            .eq("client_id", client_id);
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
      JSON.stringify({ error: "সার্ভার এরর: " + (error instanceof Error ? error.message : String(error)) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
