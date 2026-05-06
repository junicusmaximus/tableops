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
      access_import_batches: {
        Row: {
          file_name: string | null
          id: string
          imported_at: string
          matched_count: number
          notes: string | null
          provider: string
          row_count: number
          status: string
          store_id: string
          unmatched_count: number
          uploaded_by: string
        }
        Insert: {
          file_name?: string | null
          id?: string
          imported_at?: string
          matched_count?: number
          notes?: string | null
          provider: string
          row_count?: number
          status?: string
          store_id: string
          unmatched_count?: number
          uploaded_by: string
        }
        Update: {
          file_name?: string | null
          id?: string
          imported_at?: string
          matched_count?: number
          notes?: string | null
          provider?: string
          row_count?: number
          status?: string
          store_id?: string
          unmatched_count?: number
          uploaded_by?: string
        }
        Relationships: []
      }
      access_integrations: {
        Row: {
          api_base_url: string | null
          api_key: string | null
          created_at: string
          created_by: string
          id: string
          integration_mode: string
          is_active: boolean
          last_sync_at: string | null
          last_sync_status: string | null
          local_export_path: string | null
          provider: string
          provider_label: string | null
          secret_key: string | null
          store_id: string
          sync_frequency: string | null
          updated_at: string
        }
        Insert: {
          api_base_url?: string | null
          api_key?: string | null
          created_at?: string
          created_by: string
          id?: string
          integration_mode?: string
          is_active?: boolean
          last_sync_at?: string | null
          last_sync_status?: string | null
          local_export_path?: string | null
          provider: string
          provider_label?: string | null
          secret_key?: string | null
          store_id: string
          sync_frequency?: string | null
          updated_at?: string
        }
        Update: {
          api_base_url?: string | null
          api_key?: string | null
          created_at?: string
          created_by?: string
          id?: string
          integration_mode?: string
          is_active?: boolean
          last_sync_at?: string | null
          last_sync_status?: string | null
          local_export_path?: string | null
          provider?: string
          provider_label?: string | null
          secret_key?: string | null
          store_id?: string
          sync_frequency?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      access_logs: {
        Row: {
          access_card_number: string | null
          access_date: string
          access_datetime: string
          access_type: string | null
          created_at: string
          device_name: string | null
          door_name: string | null
          employee_number: string | null
          employee_profile_id: string | null
          id: string
          import_batch_id: string | null
          provider: string
          provider_user_id: string | null
          raw_employee_name: string | null
          raw_payload: Json | null
          store_id: string
        }
        Insert: {
          access_card_number?: string | null
          access_date: string
          access_datetime: string
          access_type?: string | null
          created_at?: string
          device_name?: string | null
          door_name?: string | null
          employee_number?: string | null
          employee_profile_id?: string | null
          id?: string
          import_batch_id?: string | null
          provider: string
          provider_user_id?: string | null
          raw_employee_name?: string | null
          raw_payload?: Json | null
          store_id: string
        }
        Update: {
          access_card_number?: string | null
          access_date?: string
          access_datetime?: string
          access_type?: string | null
          created_at?: string
          device_name?: string | null
          door_name?: string | null
          employee_number?: string | null
          employee_profile_id?: string | null
          id?: string
          import_batch_id?: string | null
          provider?: string
          provider_user_id?: string | null
          raw_employee_name?: string | null
          raw_payload?: Json | null
          store_id?: string
        }
        Relationships: []
      }
      ai_reports: {
        Row: {
          created_at: string
          generated_by: string
          id: string
          period_end: string
          period_start: string
          period_type: string
          report_json: Json
          store_id: string
        }
        Insert: {
          created_at?: string
          generated_by: string
          id?: string
          period_end: string
          period_start: string
          period_type?: string
          report_json?: Json
          store_id: string
        }
        Update: {
          created_at?: string
          generated_by?: string
          id?: string
          period_end?: string
          period_start?: string
          period_type?: string
          report_json?: Json
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_reports_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_logs: {
        Row: {
          access_check_in_at: string | null
          access_check_out_at: string | null
          check_in_at: string | null
          check_out_at: string | null
          checkin_latitude: number | null
          checkin_longitude: number | null
          confidence_score: number | null
          created_at: string
          date: string
          employee_profile_id: string
          id: string
          is_early_leave: boolean | null
          is_late: boolean | null
          is_outside_radius: boolean | null
          notes: string | null
          reconciled_at: string | null
          reconciled_by: string | null
          reconciliation_note: string | null
          reconciliation_status: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          source_access_log_id: string | null
          source_provider: string | null
          source_type: string | null
          status: string
          store_id: string
          synced_at: string | null
          updated_at: string
          user_id: string
          work_hours: number | null
        }
        Insert: {
          access_check_in_at?: string | null
          access_check_out_at?: string | null
          check_in_at?: string | null
          check_out_at?: string | null
          checkin_latitude?: number | null
          checkin_longitude?: number | null
          confidence_score?: number | null
          created_at?: string
          date?: string
          employee_profile_id: string
          id?: string
          is_early_leave?: boolean | null
          is_late?: boolean | null
          is_outside_radius?: boolean | null
          notes?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_note?: string | null
          reconciliation_status?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          source_access_log_id?: string | null
          source_provider?: string | null
          source_type?: string | null
          status?: string
          store_id: string
          synced_at?: string | null
          updated_at?: string
          user_id: string
          work_hours?: number | null
        }
        Update: {
          access_check_in_at?: string | null
          access_check_out_at?: string | null
          check_in_at?: string | null
          check_out_at?: string | null
          checkin_latitude?: number | null
          checkin_longitude?: number | null
          confidence_score?: number | null
          created_at?: string
          date?: string
          employee_profile_id?: string
          id?: string
          is_early_leave?: boolean | null
          is_late?: boolean | null
          is_outside_radius?: boolean | null
          notes?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_note?: string | null
          reconciliation_status?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          source_access_log_id?: string | null
          source_provider?: string | null
          source_type?: string | null
          status?: string
          store_id?: string
          synced_at?: string | null
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
      chat_mentions: {
        Row: {
          created_at: string
          id: string
          mentioned_user_id: string
          message_id: string
          room_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mentioned_user_id: string
          message_id: string
          room_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mentioned_user_id?: string
          message_id?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_mentions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_mentions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          message_type: string
          room_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          message_type?: string
          room_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
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
          pinned_at: string | null
          pinned_by: string | null
          pinned_message_id: string | null
          store_id: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          pinned_at?: string | null
          pinned_by?: string | null
          pinned_message_id?: string | null
          store_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          pinned_at?: string | null
          pinned_by?: string | null
          pinned_message_id?: string | null
          store_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_pinned_message_id_fkey"
            columns: ["pinned_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
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
      consent_terms: {
        Row: {
          consent_type: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          is_required: boolean
          role_scope: string[]
          sort_order: number
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          consent_type: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          role_scope?: string[]
          sort_order?: number
          title: string
          updated_at?: string
          version?: string
        }
        Update: {
          consent_type?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          role_scope?: string[]
          sort_order?: number
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      document_audit_logs: {
        Row: {
          actor_name: string | null
          actor_role: string | null
          actor_user_id: string | null
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          request_id: string
          user_agent: string | null
        }
        Insert: {
          actor_name?: string | null
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          request_id: string
          user_agent?: string | null
        }
        Update: {
          actor_name?: string | null
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          request_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_audit_logs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "document_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      document_field_values: {
        Row: {
          field_id: string
          filled_at: string
          filled_by: string
          id: string
          request_id: string
          value: Json | null
        }
        Insert: {
          field_id: string
          filled_at?: string
          filled_by: string
          id?: string
          request_id: string
          value?: Json | null
        }
        Update: {
          field_id?: string
          filled_at?: string
          filled_by?: string
          id?: string
          request_id?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "document_field_values_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "document_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      document_requests: {
        Row: {
          cancelled_at: string | null
          category: string | null
          completed_at: string | null
          created_at: string
          document_schema: Json
          document_schema_snapshot: Json | null
          due_date: string | null
          id: string
          recipient_name: string
          recipient_user_id: string
          rejection_reason: string | null
          sender_user_id: string
          sent_at: string | null
          status: string
          store_id: string
          template_id: string | null
          template_version_id: string | null
          title: string
          updated_at: string
          variable_values_snapshot: Json | null
          viewed_at: string | null
        }
        Insert: {
          cancelled_at?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          document_schema?: Json
          document_schema_snapshot?: Json | null
          due_date?: string | null
          id?: string
          recipient_name: string
          recipient_user_id: string
          rejection_reason?: string | null
          sender_user_id: string
          sent_at?: string | null
          status?: string
          store_id: string
          template_id?: string | null
          template_version_id?: string | null
          title: string
          updated_at?: string
          variable_values_snapshot?: Json | null
          viewed_at?: string | null
        }
        Update: {
          cancelled_at?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          document_schema?: Json
          document_schema_snapshot?: Json | null
          due_date?: string | null
          id?: string
          recipient_name?: string
          recipient_user_id?: string
          rejection_reason?: string | null
          sender_user_id?: string
          sent_at?: string | null
          status?: string
          store_id?: string
          template_id?: string | null
          template_version_id?: string | null
          title?: string
          updated_at?: string
          variable_values_snapshot?: Json | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_requests_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      document_signatures: {
        Row: {
          consent_accepted: boolean
          consent_accepted_at: string
          consent_text: string
          consent_text_version: string
          created_at: string
          document_version_hash: string
          id: string
          ip_address: string | null
          request_id: string
          signature_image_url: string | null
          signature_method: string
          signed_at: string
          signer_name: string
          signer_user_id: string
          typed_name: string | null
          user_agent: string | null
        }
        Insert: {
          consent_accepted?: boolean
          consent_accepted_at?: string
          consent_text: string
          consent_text_version?: string
          created_at?: string
          document_version_hash: string
          id?: string
          ip_address?: string | null
          request_id: string
          signature_image_url?: string | null
          signature_method: string
          signed_at?: string
          signer_name: string
          signer_user_id: string
          typed_name?: string | null
          user_agent?: string | null
        }
        Update: {
          consent_accepted?: boolean
          consent_accepted_at?: string
          consent_text?: string
          consent_text_version?: string
          created_at?: string
          document_version_hash?: string
          id?: string
          ip_address?: string | null
          request_id?: string
          signature_image_url?: string | null
          signature_method?: string
          signed_at?: string
          signer_name?: string
          signer_user_id?: string
          typed_name?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_signatures_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "document_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      document_smart_variables: {
        Row: {
          allow_manual_override: boolean
          category: string | null
          created_at: string
          default_value: string | null
          description: string | null
          display_name: string
          editable_by: string
          id: string
          input_type: string
          is_custom: boolean
          required: boolean
          source_column: string | null
          source_table: string | null
          source_type: string
          template_version_id: string
          updated_at: string
          validation_rule: Json | null
          variable_key: string
        }
        Insert: {
          allow_manual_override?: boolean
          category?: string | null
          created_at?: string
          default_value?: string | null
          description?: string | null
          display_name: string
          editable_by?: string
          id?: string
          input_type?: string
          is_custom?: boolean
          required?: boolean
          source_column?: string | null
          source_table?: string | null
          source_type?: string
          template_version_id: string
          updated_at?: string
          validation_rule?: Json | null
          variable_key: string
        }
        Update: {
          allow_manual_override?: boolean
          category?: string | null
          created_at?: string
          default_value?: string | null
          description?: string | null
          display_name?: string
          editable_by?: string
          id?: string
          input_type?: string
          is_custom?: boolean
          required?: boolean
          source_column?: string | null
          source_table?: string | null
          source_type?: string
          template_version_id?: string
          updated_at?: string
          validation_rule?: Json | null
          variable_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_smart_variables_template_version_id_fkey"
            columns: ["template_version_id"]
            isOneToOne: false
            referencedRelation: "document_template_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      document_template_versions: {
        Row: {
          created_at: string
          created_by: string
          id: string
          smart_variable_schema: Json
          status: string
          template_id: string
          template_schema: Json
          updated_at: string
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          smart_variable_schema?: Json
          status?: string
          template_id: string
          template_schema?: Json
          updated_at?: string
          version_number?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          smart_variable_schema?: Json
          status?: string
          template_id?: string
          template_schema?: Json
          updated_at?: string
          version_number?: number
        }
        Relationships: []
      }
      document_templates: {
        Row: {
          active_version_id: string | null
          category: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_system: boolean
          status: string
          store_id: string
          template_schema: Json
          title: string
          updated_at: string
        }
        Insert: {
          active_version_id?: string | null
          category?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_system?: boolean
          status?: string
          store_id: string
          template_schema?: Json
          title: string
          updated_at?: string
        }
        Update: {
          active_version_id?: string | null
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_system?: boolean
          status?: string
          store_id?: string
          template_schema?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_profiles: {
        Row: {
          access_card_number: string | null
          access_consent_accepted: boolean | null
          access_consent_accepted_at: string | null
          access_provider: string | null
          access_provider_user_id: string | null
          bio: string | null
          brand_id: string
          created_at: string
          employee_number: string | null
          employment_type: string | null
          full_name: string
          hire_date: string | null
          id: string
          invite_status: string
          invited_at: string | null
          invited_by: string | null
          linked_at: string | null
          organization_id: string
          phone: string | null
          position: string | null
          profile_image_url: string | null
          status: string
          store_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_card_number?: string | null
          access_consent_accepted?: boolean | null
          access_consent_accepted_at?: string | null
          access_provider?: string | null
          access_provider_user_id?: string | null
          bio?: string | null
          brand_id: string
          created_at?: string
          employee_number?: string | null
          employment_type?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          invite_status?: string
          invited_at?: string | null
          invited_by?: string | null
          linked_at?: string | null
          organization_id: string
          phone?: string | null
          position?: string | null
          profile_image_url?: string | null
          status?: string
          store_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_card_number?: string | null
          access_consent_accepted?: boolean | null
          access_consent_accepted_at?: string | null
          access_provider?: string | null
          access_provider_user_id?: string | null
          bio?: string | null
          brand_id?: string
          created_at?: string
          employee_number?: string | null
          employment_type?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          invite_status?: string
          invited_at?: string | null
          invited_by?: string | null
          linked_at?: string | null
          organization_id?: string
          phone?: string | null
          position?: string | null
          profile_image_url?: string | null
          status?: string
          store_id?: string
          updated_at?: string
          user_id?: string | null
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
      final_documents: {
        Row: {
          created_at: string
          document_hash: string
          final_html: string
          final_pdf_url: string | null
          id: string
          request_id: string
        }
        Insert: {
          created_at?: string
          document_hash: string
          final_html: string
          final_pdf_url?: string | null
          id?: string
          request_id: string
        }
        Update: {
          created_at?: string
          document_hash?: string
          final_html?: string
          final_pdf_url?: string | null
          id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "final_documents_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "document_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_resolved: boolean
          item_id: string
          message: string
          resolved_at: string | null
          resolved_by: string | null
          store_id: string
        }
        Insert: {
          alert_type?: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          item_id: string
          message: string
          resolved_at?: string | null
          resolved_by?: string | null
          store_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          item_id?: string
          message?: string
          resolved_at?: string | null
          resolved_by?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_alerts_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_alerts_store_id_fkey"
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
          current_stock: number | null
          default_unit: string | null
          english_name: string | null
          expiry_date: string | null
          id: string
          is_active: boolean
          item_name: string
          item_type: string
          minimum_stock: number | null
          short_code: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          aliases?: string[] | null
          category?: string
          created_at?: string
          created_by: string
          current_stock?: number | null
          default_unit?: string | null
          english_name?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          item_name: string
          item_type?: string
          minimum_stock?: number | null
          short_code?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          aliases?: string[] | null
          category?: string
          created_at?: string
          created_by?: string
          current_stock?: number | null
          default_unit?: string | null
          english_name?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          item_name?: string
          item_type?: string
          minimum_stock?: number | null
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
      leave_requests: {
        Row: {
          applicant_user_id: string
          approver_user_id: string | null
          created_at: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          rejection_reason: string | null
          start_date: string
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          applicant_user_id: string
          approver_user_id?: string | null
          created_at?: string
          end_date: string
          id?: string
          leave_type?: string
          reason?: string | null
          rejection_reason?: string | null
          start_date: string
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          applicant_user_id?: string
          approver_user_id?: string | null
          created_at?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          rejection_reason?: string | null
          start_date?: string
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          enable_access_integration: boolean
          enable_all: boolean
          enable_announcement: boolean
          enable_attendance_mismatch: boolean
          enable_checklist: boolean
          enable_document_sign: boolean
          enable_inventory: boolean
          enable_leave_request: boolean
          enable_leave_result: boolean
          enable_schedule_change: boolean
          enable_schedule_new: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          enable_access_integration?: boolean
          enable_all?: boolean
          enable_announcement?: boolean
          enable_attendance_mismatch?: boolean
          enable_checklist?: boolean
          enable_document_sign?: boolean
          enable_inventory?: boolean
          enable_leave_request?: boolean
          enable_leave_result?: boolean
          enable_schedule_change?: boolean
          enable_schedule_new?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          enable_access_integration?: boolean
          enable_all?: boolean
          enable_announcement?: boolean
          enable_attendance_mismatch?: boolean
          enable_checklist?: boolean
          enable_document_sign?: boolean
          enable_inventory?: boolean
          enable_leave_request?: boolean
          enable_leave_result?: boolean
          enable_schedule_change?: boolean
          enable_schedule_new?: boolean
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_read: boolean
          message: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
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
      purchase_requests: {
        Row: {
          approved_by: string | null
          created_at: string
          id: string
          item_id: string | null
          item_name: string
          notes: string | null
          quantity: number
          requested_by: string
          status: string
          store_id: string
          supplier: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          id?: string
          item_id?: string | null
          item_name: string
          notes?: string | null
          quantity?: number
          requested_by: string
          status?: string
          store_id: string
          supplier?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          id?: string
          item_id?: string | null
          item_name?: string
          notes?: string | null
          quantity?: number
          requested_by?: string
          status?: string
          store_id?: string
          supplier?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requests_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
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
      shift_swaps: {
        Row: {
          accepter_id: string | null
          approved_by: string | null
          chat_message_id: string | null
          created_at: string
          id: string
          requester_id: string
          shift_id: string
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          accepter_id?: string | null
          approved_by?: string | null
          chat_message_id?: string | null
          created_at?: string
          id?: string
          requester_id: string
          shift_id: string
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          accepter_id?: string | null
          approved_by?: string | null
          chat_message_id?: string | null
          created_at?: string
          id?: string
          requester_id?: string
          shift_id?: string
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_swaps_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swaps_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_templates: {
        Row: {
          break_minutes: number
          created_at: string
          created_by: string
          end_time: string
          id: string
          name: string
          role: string | null
          start_time: string
          store_id: string
          updated_at: string
        }
        Insert: {
          break_minutes?: number
          created_at?: string
          created_by: string
          end_time: string
          id?: string
          name: string
          role?: string | null
          start_time: string
          store_id: string
          updated_at?: string
        }
        Update: {
          break_minutes?: number
          created_at?: string
          created_by?: string
          end_time?: string
          id?: string
          name?: string
          role?: string | null
          start_time?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_templates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          assignee_type: string
          break_minutes: number | null
          created_at: string
          created_by: string
          end_time: string
          id: string
          manual_name: string | null
          manual_phone: string | null
          manual_role_label: string | null
          notes: string | null
          role: string | null
          shift_date: string
          start_time: string
          store_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assignee_type?: string
          break_minutes?: number | null
          created_at?: string
          created_by: string
          end_time: string
          id?: string
          manual_name?: string | null
          manual_phone?: string | null
          manual_role_label?: string | null
          notes?: string | null
          role?: string | null
          shift_date: string
          start_time: string
          store_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assignee_type?: string
          break_minutes?: number | null
          created_at?: string
          created_by?: string
          end_time?: string
          id?: string
          manual_name?: string | null
          manual_phone?: string | null
          manual_role_label?: string | null
          notes?: string | null
          role?: string | null
          shift_date?: string
          start_time?: string
          store_id?: string
          updated_at?: string
          user_id?: string | null
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
          checkin_radius_meters: number | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          brand_id: string
          checkin_radius_meters?: number | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          brand_id?: string
          checkin_radius_meters?: number | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
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
      user_consents: {
        Row: {
          accepted: boolean
          accepted_at: string | null
          consent_type: string
          consent_version: string
          created_at: string
          id: string
          ip_address: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
          withdrawn_at: string | null
        }
        Insert: {
          accepted: boolean
          accepted_at?: string | null
          consent_type: string
          consent_version: string
          created_at?: string
          id?: string
          ip_address?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
          withdrawn_at?: string | null
        }
        Update: {
          accepted?: boolean
          accepted_at?: string | null
          consent_type?: string
          consent_version?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
          withdrawn_at?: string | null
        }
        Relationships: []
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
      link_pending_employee: {
        Args: { _full_name: string; _phone: string; _user_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role:
        | "owner"
        | "manager"
        | "kitchen_staff"
        | "hall_staff"
        | "ceo"
        | "boss"
        | "full_time"
        | "part_time"
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
      app_role: [
        "owner",
        "manager",
        "kitchen_staff",
        "hall_staff",
        "ceo",
        "boss",
        "full_time",
        "part_time",
      ],
    },
  },
} as const
