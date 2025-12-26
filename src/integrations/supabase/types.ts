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
      admin_2fa: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          id: string
          is_enabled: boolean
          totp_secret: string
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          totp_secret: string
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          totp_secret?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          user_agent: string | null
          user_email: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
          user_email?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          link_type: Database["public"]["Enums"]["link_type"]
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          link_type: Database["public"]["Enums"]["link_type"]
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          link_type?: Database["public"]["Enums"]["link_type"]
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      click_logs: {
        Row: {
          city: string | null
          clicked_at: string | null
          country: string | null
          fingerprint: string | null
          id: string
          ip_address: string | null
          link_id: string | null
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          city?: string | null
          clicked_at?: string | null
          country?: string | null
          fingerprint?: string | null
          id?: string
          ip_address?: string | null
          link_id?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          city?: string | null
          clicked_at?: string | null
          country?: string | null
          fingerprint?: string | null
          id?: string
          ip_address?: string | null
          link_id?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "click_logs_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          },
        ]
      }
      click_sessions: {
        Row: {
          ad_visited_at: string | null
          captcha_passed_at: string | null
          city: string | null
          countdown_completed_at: string | null
          countdown_started_at: string
          country: string | null
          created_at: string
          fingerprint: string | null
          id: string
          ip_address: string | null
          link_id: string | null
          redirect_token: string | null
          redirect_token_expires_at: string | null
          redirect_token_used_at: string | null
          referrer: string | null
          session_token: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          ad_visited_at?: string | null
          captcha_passed_at?: string | null
          city?: string | null
          countdown_completed_at?: string | null
          countdown_started_at?: string
          country?: string | null
          created_at?: string
          fingerprint?: string | null
          id?: string
          ip_address?: string | null
          link_id?: string | null
          redirect_token?: string | null
          redirect_token_expires_at?: string | null
          redirect_token_used_at?: string | null
          referrer?: string | null
          session_token: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          ad_visited_at?: string | null
          captcha_passed_at?: string | null
          city?: string | null
          countdown_completed_at?: string | null
          countdown_started_at?: string
          country?: string | null
          created_at?: string
          fingerprint?: string | null
          id?: string
          ip_address?: string | null
          link_id?: string | null
          redirect_token?: string | null
          redirect_token_expires_at?: string | null
          redirect_token_used_at?: string | null
          referrer?: string | null
          session_token?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "click_sessions_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          subject?: string | null
        }
        Relationships: []
      }
      links: {
        Row: {
          ad_url: string | null
          canva_url: string
          category_id: string | null
          countdown_seconds: number | null
          created_at: string | null
          current_slots: number | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_slots: number | null
          protection_type: Database["public"]["Enums"]["protection_type"] | null
          short_code: string
          title: string
          updated_at: string | null
        }
        Insert: {
          ad_url?: string | null
          canva_url: string
          category_id?: string | null
          countdown_seconds?: number | null
          created_at?: string | null
          current_slots?: number | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_slots?: number | null
          protection_type?:
            | Database["public"]["Enums"]["protection_type"]
            | null
          short_code: string
          title: string
          updated_at?: string | null
        }
        Update: {
          ad_url?: string | null
          canva_url?: string
          category_id?: string | null
          countdown_seconds?: number | null
          created_at?: string | null
          current_slots?: number | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_slots?: number | null
          protection_type?:
            | Database["public"]["Enums"]["protection_type"]
            | null
          short_code?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "links_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string | null
          id: string
          is_global: boolean | null
          link_id: string | null
          max_clicks_per_day: number | null
          rate_limit_type: Database["public"]["Enums"]["rate_limit_type"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_global?: boolean | null
          link_id?: string | null
          max_clicks_per_day?: number | null
          rate_limit_type?:
            | Database["public"]["Enums"]["rate_limit_type"]
            | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_global?: boolean | null
          link_id?: string | null
          max_clicks_per_day?: number | null
          rate_limit_type?:
            | Database["public"]["Enums"]["rate_limit_type"]
            | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rate_limits_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      check_2fa_enabled: { Args: { p_user_id: string }; Returns: boolean }
      check_rate_limit: {
        Args: { p_fingerprint: string; p_ip_address: string; p_link_id: string }
        Returns: {
          allowed: boolean
          clicks_today: number
          reason: string
        }[]
      }
      consume_redirect_token: {
        Args: { p_redirect_token: string }
        Returns: {
          error_message: string
          success: boolean
          target_url: string
        }[]
      }
      generate_secure_token: { Args: { length?: number }; Returns: string }
      generate_short_code: { Args: never; Returns: string }
      generate_short_code_v2: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_slot: { Args: { link_id_param: string }; Returns: undefined }
      issue_redirect_token: {
        Args: { p_link_id: string; p_session_token: string }
        Returns: {
          error_message: string
          redirect_token: string
          success: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin"
      link_type: "canva_pro" | "canva_edu"
      protection_type: "countdown" | "redirect" | "both"
      rate_limit_type: "none" | "ip" | "fingerprint"
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
      app_role: ["admin"],
      link_type: ["canva_pro", "canva_edu"],
      protection_type: ["countdown", "redirect", "both"],
      rate_limit_type: ["none", "ip", "fingerprint"],
    },
  },
} as const
