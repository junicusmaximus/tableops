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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      attendance_logs: {
        Row: {
          check_in_at: string | null
          check_out_at: string | null
          created_at: string
          date: string
          employee_profile_id: string
          id: string
          is_early_leave: boolean | null
          is_late: boolean | null
          notes: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          status: string
          store_id: string
          updated_at: string
          user_id: string
          work_hours: number | null
        }
        Insert: {
          check_in_at?: string | null
          check_out_at?: string | null
          created_at?: string
          date?: string
          employee_profile_id: string
          id?: string
          is_early_leave?: boolean | null
          is_late?: boolean | null
          notes?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: string
          store_id: string
          updated_at?: string
          user_id: string
          work_hours?: number | null
        }
        Update: {
          check_in_at?: string | null
          check_out_at?: string | null
          created_at?: string
          date?: string
          employee_profile_id?: string
          id?: string
          is_early_leave?: boolean | null
          is_late?: boolean | null
          notes?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: string
          store_id?: string
          updated_at?: string
          user_id?: string
          work_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_logs_employee_profile_id_fkey"
            columns: ["employee_profile_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      break_logs: {
        Row: {
          attendance_log_id: string
          created_at: string
          duration_minutes: number | null
          end_at: string | null
          id: string
          start_at: string
        }
        Insert: {
          attendance_log_id: string
          created_at?: string
          duration_minutes?: number | null
          end_at?: string | null
          id?: string
          start_at?: string
        }
        Update: {
          attendance_log_id?: string
          created_at?: string
          duration_minutes?: number | null
          end_at?: string | null
          id?: string
          start_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "break_logs_attendance_log_id_fkey"
            columns: ["attendance_log_id"]
            isOneToOne: false
            referencedRelation: "attendance_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          message_type: string
          room_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_type?: string
          room_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_type?: string
          room_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_read_receipts: {
        Row: {
          id: string
          last_read_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          last_read_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          last_read_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_read_receipts_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_room_members: {
        Row: {
          id: string
          joined_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          store_id: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          store_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          store_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_runs: {
        Row: {
          assigned_user_id: string | null
          business_date: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          note: string | null
          photo_url: string | null
          status: string
          store_id: string
          template_id: string
          updated_at: string
        }
        Insert: {
          assigned_user_id?: string | null
          business_date?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          photo_url?: string | null
          status?: string
          store_id: string
          template_id: string
          updated_at?: string
        }
        Update: {
          assigned_user_id?: string | null
          business_date?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          photo_url?: string | null
          status?: string
          store_id?: string
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_runs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_runs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          assigned_role: string | null
          checklist_type: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          requires_photo: boolean | null
          sort_order: number | null
          store_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_role?: string | null
          checklist_type: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          requires_photo?: boolean | null
          sort_order?: number | null
          store_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_role?: string | null
          checklist_type?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          requires_photo?: boolean | null
          sort_order?: number | null
          store_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_templates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_profiles: {
        Row: {
          brand_id: string
          created_at: string
          employment_type: string | null
          full_name: string
          hire_date: string | null
          id: string
          organization_id: string
          phone: string | null
          position: string | null
          store_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          employment_type?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          organization_id: string
          phone?: string | null
          position?: string | null
          store_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          employment_type?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          organization_id?: string
          phone?: string | null
          position?: string | null
          store_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_profiles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_profiles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          aliases: string[] | null
          category: string
          created_at: string
          created_by: string
          default_unit: string | null
          english_name: string | null
          id: string
          is_active: boolean
          item_name: string
          item_type: string
          short_code: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          aliases?: string[] | null
          category?: string
          created_at?: string
          created_by: string
          default_unit?: string | null
          english_name?: string | null
          id?: string
          is_active?: boolean
          item_name: string
          item_type?: string
          short_code?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          aliases?: string[] | null
          category?: string
          created_at?: string
          created_by?: string
          default_unit?: string | null
          english_name?: string | null
          id?: string
          is_active?: boolean
          item_name?: string
          item_type?: string
          short_code?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      item_usage_history: {
        Row: {
          id: string
          item_id: string
          query_text: string | null
          selected_at: string
          store_id: string
          user_id: string
        }
        Insert: {
          id?: string
          item_id: string
          query_text?: string | null
          selected_at?: string
          store_id: string
          user_id: string
        }
        Update: {
          id?: string
          item_id?: string
          query_text?: string | null
          selected_at?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_usage_history_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_usage_history_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          created_at: string
          created_by: string
          customer_name: string
          guest_count: number
          id: string
          memo: string | null
          phone_number: string | null
          reservation_date: string
          reservation_source: string | null
          reservation_time: string
          seating_area: string | null
          special_request: string | null
          status: string
          store_id: string
          updated_at: string
          vip_flag: boolean | null
        }
        Insert: {
          created_at?: string
          created_by: string
          customer_name: string
          guest_count?: number
          id?: string
          memo?: string | null
          phone_number?: string | null
          reservation_date: string
          reservation_source?: string | null
          reservation_time: string
          seating_area?: string | null
          special_request?: string | null
          status?: string
          store_id: string
          updated_at?: string
          vip_flag?: boolean | null
        }
        Update: {
          created_at?: string
          created_by?: string
          customer_name?: string
          guest_count?: number
          id?: string
          memo?: string | null
          phone_number?: string | null
          reservation_date?: string
          reservation_source?: string | null
          reservation_time?: string
          seating_area?: string | null
          special_request?: string | null
          status?: string
          store_id?: string
          updated_at?: string
          vip_flag?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_records: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          notes: string | null
          recorded_by: string
          store_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          recorded_by: string
          store_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          recorded_by?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_records_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_targets: {
        Row: {
          created_at: string
          created_by: string
          id: string
          store_id: string
          target_amount: number
          updated_at: string
          year_month: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          store_id: string
          target_amount?: number
          updated_at?: string
          year_month: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          store_id?: string
          target_amount?: number
          updated_at?: string
          year_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_targets_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          break_minutes: number | null
          created_at: string
          created_by: string
          end_time: string
          id: string
          notes: string | null
          role: string | null
          shift_date: string
          start_time: string
          store_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          break_minutes?: number | null
          created_at?: string
          created_by: string
          end_time: string
          id?: string
          notes?: string | null
          role?: string | null
          shift_date: string
          start_time: string
          store_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          break_minutes?: number | null
          created_at?: string
          created_by?: string
          end_time?: string
          id?: string
          notes?: string | null
          role?: string | null
          shift_date?: string
          start_time?: string
          store_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          brand_id: string
          created_at: string
          id: string
          name: string
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          brand_id: string
          created_at?: string
          id?: string
          name: string
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          brand_id?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_store_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_store_roles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_employee_profile_id: {
        Args: { _store_id: string; _user_id: string }
        Returns: string
      }
      get_user_brand_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_org_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_store_ids: { Args: { _user_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_or_higher: {
        Args: {
          _min_role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_store_member: {
        Args: { _store_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "manager" | "kitchen_staff" | "hall_staff"
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
      app_role: ["owner", "manager", "kitchen_staff", "hall_staff"],
    },
  },
} as const
