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
      admin_actions_log: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          tenant_id: string
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          tenant_id: string
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      anomalies: {
        Row: {
          code: string
          created_at: string
          details: Json
          id: string
          import_run_id: string
          severity: Database["public"]["Enums"]["alert_severity"]
          tenant_id: string
          title: string
        }
        Insert: {
          code: string
          created_at?: string
          details: Json
          id?: string
          import_run_id: string
          severity: Database["public"]["Enums"]["alert_severity"]
          tenant_id: string
          title: string
        }
        Update: {
          code?: string
          created_at?: string
          details?: Json
          id?: string
          import_run_id?: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "anomalies_import_run_id_fkey"
            columns: ["import_run_id"]
            isOneToOne: false
            referencedRelation: "import_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anomalies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at: string
          details: Json | null
          error_message: string | null
          id: string
          ip_address: unknown
          severity: string
          success: boolean | null
          tenant_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          severity?: string
          success?: boolean | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          severity?: string
          success?: boolean | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_settings: {
        Row: {
          ai_name: string
          ai_personality: string
          created_at: string
          custom_instructions: string | null
          greeting_message: string | null
          quick_suggestions: Json | null
          tenant_id: string
          tone: string
          updated_at: string
          use_emojis: boolean
          use_icons: boolean
          use_markdown_headers: boolean
        }
        Insert: {
          ai_name?: string
          ai_personality?: string
          created_at?: string
          custom_instructions?: string | null
          greeting_message?: string | null
          quick_suggestions?: Json | null
          tenant_id: string
          tone?: string
          updated_at?: string
          use_emojis?: boolean
          use_icons?: boolean
          use_markdown_headers?: boolean
        }
        Update: {
          ai_name?: string
          ai_personality?: string
          created_at?: string
          custom_instructions?: string | null
          greeting_message?: string | null
          quick_suggestions?: Json | null
          tenant_id?: string
          tone?: string
          updated_at?: string
          use_emojis?: boolean
          use_icons?: boolean
          use_markdown_headers?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "chat_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_usage: {
        Row: {
          completion_tokens: number
          created_at: string
          id: string
          model: string
          prompt_tokens: number
          tenant_id: string
          total_tokens: number
          user_id: string | null
        }
        Insert: {
          completion_tokens?: number
          created_at?: string
          id?: string
          model: string
          prompt_tokens?: number
          tenant_id: string
          total_tokens?: number
          user_id?: string | null
        }
        Update: {
          completion_tokens?: number
          created_at?: string
          id?: string
          model?: string
          prompt_tokens?: number
          tenant_id?: string
          total_tokens?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_usage_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      import_profiles: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          kind: string
          mapping: Json
          name: string
          signature: string | null
          tenant_id: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          kind?: string
          mapping: Json
          name: string
          signature?: string | null
          tenant_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          kind?: string
          mapping?: Json
          name?: string
          signature?: string | null
          tenant_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      import_runs: {
        Row: {
          created_at: string
          created_by: string
          detected_end_date: string | null
          detected_start_date: string | null
          error_message: string | null
          file_hash: string | null
          file_path: string | null
          granularity: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          original_filename: string | null
          processed_at: string | null
          profile_id: string | null
          status: Database["public"]["Enums"]["import_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          detected_end_date?: string | null
          detected_start_date?: string | null
          error_message?: string | null
          file_hash?: string | null
          file_path?: string | null
          granularity?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          original_filename?: string | null
          processed_at?: string | null
          profile_id?: string | null
          status?: Database["public"]["Enums"]["import_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          detected_end_date?: string | null
          detected_start_date?: string | null
          error_message?: string | null
          file_hash?: string | null
          file_path?: string | null
          granularity?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          original_filename?: string | null
          processed_at?: string | null
          profile_id?: string | null
          status?: Database["public"]["Enums"]["import_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_runs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "import_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          attempts: number
          available_at: string
          created_at: string
          id: string
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          payload: Json
          status: Database["public"]["Enums"]["job_status"]
          tenant_id: string
          type: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          available_at?: string
          created_at?: string
          id?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          payload: Json
          status?: Database["public"]["Enums"]["job_status"]
          tenant_id: string
          type: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          available_at?: string
          created_at?: string
          id?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          payload?: Json
          status?: Database["public"]["Enums"]["job_status"]
          tenant_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_plans: {
        Row: {
          created_at: string | null
          cta_text: string | null
          description: string | null
          display_order: number | null
          features: Json | null
          highlight: boolean | null
          highlight_text: string | null
          id: string
          is_active: boolean | null
          name: string
          price_monthly: number | null
          price_yearly: number | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cta_text?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          highlight?: boolean | null
          highlight_text?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price_monthly?: number | null
          price_yearly?: number | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cta_text?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          highlight?: boolean | null
          highlight_text?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_monthly?: number | null
          price_yearly?: number | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      plan_limits: {
        Row: {
          created_at: string
          id: string
          max_imports_per_month: number | null
          max_messages_per_month: number | null
          max_users: number | null
          max_whatsapp_numbers: number | null
          plan_name: string
          trial_days: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_imports_per_month?: number | null
          max_messages_per_month?: number | null
          max_users?: number | null
          max_whatsapp_numbers?: number | null
          plan_name: string
          trial_days?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_imports_per_month?: number | null
          max_messages_per_month?: number | null
          max_users?: number | null
          max_whatsapp_numbers?: number | null
          plan_name?: string
          trial_days?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string
          id: string
          last_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_name?: string
          id: string
          last_name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      run_facts: {
        Row: {
          created_at: string
          facts: Json
          import_run_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          facts: Json
          import_run_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          facts?: Json
          import_run_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "run_facts_import_run_id_fkey"
            columns: ["import_run_id"]
            isOneToOne: true
            referencedRelation: "import_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "run_facts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_lines: {
        Row: {
          category: string | null
          channel: string | null
          city: string | null
          cost_value: number | null
          created_at: string
          customer_name: string | null
          discount_value: number | null
          gross_value: number | null
          id: string
          import_run_id: string
          net_value: number | null
          order_id: string | null
          payment_method: string | null
          product_name: string | null
          quantity: number | null
          row_signature: string | null
          sale_date: string
          seller_name: string | null
          sku: string | null
          state: string | null
          status: string | null
          tax_value: number | null
          tenant_id: string
          unit_price: number | null
        }
        Insert: {
          category?: string | null
          channel?: string | null
          city?: string | null
          cost_value?: number | null
          created_at?: string
          customer_name?: string | null
          discount_value?: number | null
          gross_value?: number | null
          id?: string
          import_run_id: string
          net_value?: number | null
          order_id?: string | null
          payment_method?: string | null
          product_name?: string | null
          quantity?: number | null
          row_signature?: string | null
          sale_date: string
          seller_name?: string | null
          sku?: string | null
          state?: string | null
          status?: string | null
          tax_value?: number | null
          tenant_id: string
          unit_price?: number | null
        }
        Update: {
          category?: string | null
          channel?: string | null
          city?: string | null
          cost_value?: number | null
          created_at?: string
          customer_name?: string | null
          discount_value?: number | null
          gross_value?: number | null
          id?: string
          import_run_id?: string
          net_value?: number | null
          order_id?: string | null
          payment_method?: string | null
          product_name?: string | null
          quantity?: number | null
          row_signature?: string | null
          sale_date?: string
          seller_name?: string | null
          sku?: string | null
          state?: string | null
          status?: string | null
          tax_value?: number | null
          tenant_id?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_lines_import_run_id_fkey"
            columns: ["import_run_id"]
            isOneToOne: false
            referencedRelation: "import_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_lines_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sectors: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      tenant_memberships: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_memberships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          status: string
          tenant_id: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: string
          tenant_id: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: string
          tenant_id?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          sector: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          sector?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          sector?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_accounts: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          phone_number: string
          tenant_id: string
          updated_at: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          phone_number: string
          tenant_id: string
          updated_at?: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          phone_number?: string
          tenant_id?: string
          updated_at?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_commands: {
        Row: {
          ai_prompt: string | null
          command_aliases: string[] | null
          command_key: string
          created_at: string | null
          data_source: string | null
          description: string | null
          display_name: string
          icon: string | null
          id: string
          is_active: boolean | null
          limit_items: number | null
          response_template: string | null
          response_type: string
          sort_order: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          ai_prompt?: string | null
          command_aliases?: string[] | null
          command_key: string
          created_at?: string | null
          data_source?: string | null
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          limit_items?: number | null
          response_template?: string | null
          response_type?: string
          sort_order?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          ai_prompt?: string | null
          command_aliases?: string[] | null
          command_key?: string
          created_at?: string | null
          data_source?: string | null
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          limit_items?: number | null
          response_template?: string | null
          response_type?: string
          sort_order?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_commands_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_commands_global: {
        Row: {
          ai_prompt: string | null
          command_aliases: string[] | null
          command_key: string
          created_at: string | null
          data_source: string | null
          description: string | null
          display_name: string
          icon: string | null
          id: string
          is_active: boolean | null
          limit_items: number | null
          response_template: string | null
          response_type: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          ai_prompt?: string | null
          command_aliases?: string[] | null
          command_key: string
          created_at?: string | null
          data_source?: string | null
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          limit_items?: number | null
          response_template?: string | null
          response_type?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_prompt?: string | null
          command_aliases?: string[] | null
          command_key?: string
          created_at?: string | null
          data_source?: string | null
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          limit_items?: number | null
          response_template?: string | null
          response_type?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_sessions: {
        Row: {
          created_at: string
          id: string
          last_activity: string
          messages: Json
          phone_number: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_activity?: string
          messages?: Json
          phone_number: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_activity?: string
          messages?: Json
          phone_number?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_tenant_limits: {
        Args: { _limit_type: string; _tenant_id: string }
        Returns: Json
      }
      get_sales_counts_by_tenant: {
        Args: never
        Returns: {
          count: number
          tenant_id: string
        }[]
      }
      is_admin: { Args: { _tenant_id: string }; Returns: boolean }
      is_member: { Args: { _tenant_id: string }; Returns: boolean }
      is_owner: { Args: { _tenant_id: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      log_audit_event: {
        Args: {
          _action: Database["public"]["Enums"]["audit_action"]
          _details?: Json
          _error_message?: string
          _ip_address?: unknown
          _severity?: string
          _success?: boolean
          _tenant_id?: string
          _user_agent?: string
          _user_email?: string
          _user_id?: string
        }
        Returns: string
      }
    }
    Enums: {
      alert_severity: "low" | "medium" | "high"
      audit_action:
        | "login_success"
        | "login_failed"
        | "logout"
        | "signup"
        | "access_denied"
        | "file_upload"
        | "file_delete"
        | "chat_request"
        | "tenant_created"
        | "tenant_updated"
        | "membership_changed"
        | "import_created"
        | "import_deleted"
        | "settings_updated"
      import_status: "queued" | "processing" | "done" | "failed" | "canceled"
      job_status: "queued" | "processing" | "done" | "failed"
      tenant_role: "owner" | "admin" | "member" | "viewer"
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
      alert_severity: ["low", "medium", "high"],
      audit_action: [
        "login_success",
        "login_failed",
        "logout",
        "signup",
        "access_denied",
        "file_upload",
        "file_delete",
        "chat_request",
        "tenant_created",
        "tenant_updated",
        "membership_changed",
        "import_created",
        "import_deleted",
        "settings_updated",
      ],
      import_status: ["queued", "processing", "done", "failed", "canceled"],
      job_status: ["queued", "processing", "done", "failed"],
      tenant_role: ["owner", "admin", "member", "viewer"],
    },
  },
} as const
