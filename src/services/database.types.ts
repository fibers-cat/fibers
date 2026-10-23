// Generated from Supabase project tytvxtdaafbqakskwkdu. Do not edit by hand.
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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      contribution_files: {
        Row: {
          contribution_id: string
          created_at: string
          id: string
          mime_type: string
          original_name: string
          size_bytes: number
          storage_path: string
        }
        Insert: {
          contribution_id: string
          created_at?: string
          id?: string
          mime_type: string
          original_name: string
          size_bytes: number
          storage_path: string
        }
        Update: {
          contribution_id?: string
          created_at?: string
          id?: string
          mime_type?: string
          original_name?: string
          size_bytes?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "contribution_files_contribution_id_fkey"
            columns: ["contribution_id"]
            isOneToOne: false
            referencedRelation: "contributions"
            referencedColumns: ["id"]
          },
        ]
      }
      contributions: {
        Row: {
          author_id: string
          created_at: string
          description: string
          id: string
          review_note: string | null
          reviewed_at: string | null
          status: string
          subject_id: string
          title: string
        }
        Insert: {
          author_id: string
          created_at?: string
          description: string
          id?: string
          review_note?: string | null
          reviewed_at?: string | null
          status?: string
          subject_id: string
          title: string
        }
        Update: {
          author_id?: string
          created_at?: string
          description?: string
          id?: string
          review_note?: string | null
          reviewed_at?: string | null
          status?: string
          subject_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_material_subjects: {
        Row: {
          legacy_material_id: string
          subject_id: string
        }
        Insert: {
          legacy_material_id: string
          subject_id: string
        }
        Update: {
          legacy_material_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legacy_material_subjects_legacy_material_id_fkey"
            columns: ["legacy_material_id"]
            isOneToOne: false
            referencedRelation: "legacy_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legacy_material_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_materials: {
        Row: {
          author_id: string
          content_text: string | null
          contributed_at: string
          created_at: string
          external_url: string | null
          id: string
          path: string | null
          title: string
        }
        Insert: {
          author_id: string
          content_text?: string | null
          contributed_at: string
          created_at?: string
          external_url?: string | null
          id?: string
          path?: string | null
          title: string
        }
        Update: {
          author_id?: string
          content_text?: string | null
          contributed_at?: string
          created_at?: string
          external_url?: string | null
          id?: string
          path?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "legacy_materials_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          alias: string
          auth_user_id: string | null
          avatar_url: string | null
          created_at: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          alias: string
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          alias?: string
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          acronym: string
          category: string
          code: string | null
          created_at: string
          description: string
          id: string
          is_current: boolean
          languages: string[]
          name: string
          slug: string
          specialty: string | null
        }
        Insert: {
          acronym: string
          category: string
          code?: string | null
          created_at?: string
          description?: string
          id?: string
          is_current?: boolean
          languages?: string[]
          name: string
          slug: string
          specialty?: string | null
        }
        Update: {
          acronym?: string
          category?: string
          code?: string | null
          created_at?: string
          description?: string
          id?: string
          is_current?: boolean
          languages?: string[]
          name?: string
          slug?: string
          specialty?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      approved_material_counts: {
        Row: {
          file_count: number | null
          subject_id: string | null
        }
        Relationships: []
      }
      contributor_ranking: {
        Row: {
          alias: string | null
          latest_material_at: string | null
          material_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_list_users: {
        Args: never
        Returns: {
          alias: string
          created_at: string
          email: string
          last_sign_in_at: string
          role: string
          user_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
