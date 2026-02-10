export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          details: string | null
          id: string
          module: string
          performed_at: string
          performed_by_name: string | null
          performed_by_user_id: string
          record_id: string | null
          record_title: string | null
        }
        Insert: {
          action: string
          details?: string | null
          id?: string
          module: string
          performed_at?: string
          performed_by_name?: string | null
          performed_by_user_id: string
          record_id?: string | null
          record_title?: string | null
        }
        Update: {
          action?: string
          details?: string | null
          id?: string
          module?: string
          performed_at?: string
          performed_by_name?: string | null
          performed_by_user_id?: string
          record_id?: string | null
          record_title?: string | null
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string
          account_type: string
          bank_name: string
          branch_name: string | null
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          routing_number: string | null
          swift_code: string | null
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number: string
          account_type?: string
          bank_name: string
          branch_name?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          routing_number?: string | null
          swift_code?: string | null
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          account_type?: string
          bank_name?: string
          branch_name?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          routing_number?: string | null
          swift_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      client_auth: {
        Row: {
          active: boolean
          client_code: string
          client_id: string
          created_at: string
          id: string
          password_hash: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          client_code: string
          client_id: string
          created_at?: string
          id?: string
          password_hash: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          client_code?: string
          client_id?: string
          created_at?: string
          id?: string
          password_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_auth_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_sessions: {
        Row: {
          client_id: string
          created_at: string
          expires_at: string
          id: string
          session_token: string
        }
        Insert: {
          client_id: string
          created_at?: string
          expires_at: string
          id?: string
          session_token: string
        }
        Update: {
          client_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          client_code: string | null
          company: string | null
          created_at: string
          created_by_name: string | null
          deleted_at: string | null
          email: string
          id: string
          is_deleted: boolean
          name: string
          phone: string
          social_links: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          client_code?: string | null
          company?: string | null
          created_at?: string
          created_by_name?: string | null
          deleted_at?: string | null
          email: string
          id?: string
          is_deleted?: boolean
          name: string
          phone: string
          social_links?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          client_code?: string | null
          company?: string | null
          created_at?: string
          created_by_name?: string | null
          deleted_at?: string | null
          email?: string
          id?: string
          is_deleted?: boolean
          name?: string
          phone?: string
          social_links?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address: string | null
          company_name_bn: string
          company_name_en: string | null
          created_at: string
          email: string | null
          id: string
          invoice_note_bn: string | null
          logo_url: string | null
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          company_name_bn?: string
          company_name_en?: string | null
          created_at?: string
          email?: string | null
          id?: string
          invoice_note_bn?: string | null
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          company_name_bn?: string
          company_name_en?: string | null
          created_at?: string
          email?: string | null
          id?: string
          invoice_note_bn?: string | null
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      custom_roles: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_deleted: boolean
          permissions: Json | null
          role_name_bn: string
          role_name_en: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean
          permissions?: Json | null
          role_name_bn: string
          role_name_en?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean
          permissions?: Json | null
          role_name_bn?: string
          role_name_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          client_id: string | null
          created_at: string
          deleted_at: string | null
          discount: number
          due_date: string | null
          from_quote_id: string | null
          id: string
          invoice_number: string
          is_deleted: boolean
          issue_date: string | null
          items: Json
          project_id: string | null
          status: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          deleted_at?: string | null
          discount?: number
          due_date?: string | null
          from_quote_id?: string | null
          id?: string
          invoice_number?: string
          is_deleted?: boolean
          issue_date?: string | null
          items?: Json
          project_id?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          deleted_at?: string | null
          discount?: number
          due_date?: string | null
          from_quote_id?: string | null
          id?: string
          invoice_number?: string
          is_deleted?: boolean
          issue_date?: string | null
          items?: Json
          project_id?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_from_quote_id_fkey"
            columns: ["from_quote_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          company: string | null
          created_at: string
          created_by_name: string | null
          deleted_at: string | null
          email: string | null
          id: string
          is_deleted: boolean
          name: string
          next_follow_up_at: string | null
          notes: Json | null
          phone: string
          service_id: string | null
          source: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          created_by_name?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_deleted?: boolean
          name: string
          next_follow_up_at?: string | null
          notes?: Json | null
          phone: string
          service_id?: string | null
          source: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          created_by_name?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_deleted?: boolean
          name?: string
          next_follow_up_at?: string | null
          notes?: Json | null
          phone?: string
          service_id?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          deleted_at: string | null
          id: string
          invoice_id: string
          is_deleted: boolean
          method: string
          note: string | null
          payment_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          invoice_id: string
          is_deleted?: boolean
          method: string
          note?: string | null
          payment_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          invoice_id?: string
          is_deleted?: boolean
          method?: string
          note?: string | null
          payment_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          custom_role_id: string | null
          deleted_at: string | null
          email: string
          id: string
          is_deleted: boolean
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          custom_role_id?: string | null
          deleted_at?: string | null
          email: string
          id?: string
          is_deleted?: boolean
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          custom_role_id?: string | null
          deleted_at?: string | null
          email?: string
          id?: string
          is_deleted?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_custom_role_id_fkey"
            columns: ["custom_role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_client_notes: {
        Row: {
          client_id: string
          created_at: string
          deleted_at: string | null
          id: string
          is_deleted: boolean
          note_date: string
          note_text: string
          project_id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          note_date?: string
          note_text: string
          project_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          note_date?: string
          note_text?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_client_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_client_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_notes: {
        Row: {
          created_at: string
          created_by: string
          created_by_name: string | null
          deleted_at: string | null
          id: string
          is_deleted: boolean
          note_date: string
          note_text: string
          note_time: string | null
          note_type: string | null
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          created_by_name?: string | null
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          note_date: string
          note_text: string
          note_time?: string | null
          note_type?: string | null
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          created_by_name?: string | null
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          note_date?: string
          note_text?: string
          note_time?: string | null
          note_type?: string | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          change_note: string | null
          change_type: string
          created_at: string
          id: string
          new_value: Json | null
          old_value: Json | null
          project_id: string
          updated_by: string
          updated_by_name: string | null
        }
        Insert: {
          change_note?: string | null
          change_type: string
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          project_id: string
          updated_by: string
          updated_by_name?: string | null
        }
        Update: {
          change_note?: string | null
          change_type?: string
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          project_id?: string
          updated_by?: string
          updated_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          assigned_team: string[] | null
          budget: number
          client_id: string | null
          created_at: string
          deadline: string | null
          deleted_at: string | null
          id: string
          is_deleted: boolean
          progress: number
          service_id: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_team?: string[] | null
          budget?: number
          client_id?: string | null
          created_at?: string
          deadline?: string | null
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          progress?: number
          service_id?: string | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_team?: string[] | null
          budget?: number
          client_id?: string | null
          created_at?: string
          deadline?: string | null
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          progress?: number
          service_id?: string | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          client_id: string | null
          client_name: string | null
          created_at: string
          created_by: string
          created_by_name: string | null
          deleted_at: string | null
          discount: number
          grand_total: number
          id: string
          is_deleted: boolean
          issue_date: string
          items: Json
          note: string | null
          quote_number: string
          status: string
          subtotal: number
          tax: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          created_by: string
          created_by_name?: string | null
          deleted_at?: string | null
          discount?: number
          grand_total?: number
          id?: string
          is_deleted?: boolean
          issue_date?: string
          items?: Json
          note?: string | null
          quote_number?: string
          status?: string
          subtotal?: number
          tax?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string
          created_by_name?: string | null
          deleted_at?: string | null
          discount?: number
          grand_total?: number
          id?: string
          is_deleted?: boolean
          issue_date?: string
          items?: Json
          note?: string | null
          quote_number?: string
          status?: string
          subtotal?: number
          tax?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          category: string
          created_at: string
          deleted_at: string | null
          delivery_time: string | null
          description: string | null
          id: string
          is_deleted: boolean
          name: string
          price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          deleted_at?: string | null
          delivery_time?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean
          name: string
          price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          deleted_at?: string | null
          delivery_time?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean
          name?: string
          price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          can_delete_records: boolean
          can_manage_clients: boolean
          can_manage_invoices: boolean
          can_manage_leads: boolean
          can_manage_payments: boolean
          can_manage_projects: boolean
          can_manage_roles: boolean
          can_manage_services: boolean
          can_manage_tasks: boolean
          can_manage_users: boolean
          can_view_dashboard: boolean
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_delete_records?: boolean
          can_manage_clients?: boolean
          can_manage_invoices?: boolean
          can_manage_leads?: boolean
          can_manage_payments?: boolean
          can_manage_projects?: boolean
          can_manage_roles?: boolean
          can_manage_services?: boolean
          can_manage_tasks?: boolean
          can_manage_users?: boolean
          can_view_dashboard?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_delete_records?: boolean
          can_manage_clients?: boolean
          can_manage_invoices?: boolean
          can_manage_leads?: boolean
          can_manage_payments?: boolean
          can_manage_projects?: boolean
          can_manage_roles?: boolean
          can_manage_services?: boolean
          can_manage_tasks?: boolean
          can_manage_users?: boolean
          can_view_dashboard?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invoice_number: { Args: never; Returns: string }
      generate_quote_number: { Args: never; Returns: string }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "sales" | "project_manager" | "staff" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "sales", "project_manager", "staff", "client"],
    },
  },
} as const
