export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_feed: {
        Row: {
          created_at: string | null
          event_description: string
          event_type: Database["public"]["Enums"]["activity_event_type"]
          id: number
          related_url: string | null
          related_user_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_description: string
          event_type: Database["public"]["Enums"]["activity_event_type"]
          id?: number
          related_url?: string | null
          related_user_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_description?: string
          event_type?: Database["public"]["Enums"]["activity_event_type"]
          id?: number
          related_url?: string | null
          related_user_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_feed_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_feed_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          criteria: Json | null
          description: string
          icon_url: string | null
          id: number
          name: string
        }
        Insert: {
          criteria?: Json | null
          description: string
          icon_url?: string | null
          id?: number
          name: string
        }
        Update: {
          criteria?: Json | null
          description?: string
          icon_url?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      connections: {
        Row: {
          addressee_id: string
          created_at: string | null
          id: number
          requester_id: string
          status: Database["public"]["Enums"]["connection_status"]
          updated_at: string | null
        }
        Insert: {
          addressee_id: string
          created_at?: string | null
          id?: number
          requester_id: string
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string | null
        }
        Update: {
          addressee_id?: string
          created_at?: string | null
          id?: number
          requester_id?: string
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connections_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          completion_date: string | null
          course_code: string | null
          course_name: string
          created_at: string | null
          grade: string | null
          id: number
          institution: string | null
          user_id: string
        }
        Insert: {
          completion_date?: string | null
          course_code?: string | null
          course_name: string
          created_at?: string | null
          grade?: string | null
          id?: number
          institution?: string | null
          user_id: string
        }
        Update: {
          completion_date?: string | null
          course_code?: string | null
          course_name?: string
          created_at?: string | null
          grade?: string | null
          id?: number
          institution?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: number
          is_current: boolean | null
          location: string | null
          organization: string | null
          start_date: string
          title: string
          type: Database["public"]["Enums"]["experience_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: number
          is_current?: boolean | null
          location?: string | null
          organization?: string | null
          start_date: string
          title: string
          type: Database["public"]["Enums"]["experience_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: number
          is_current?: boolean | null
          location?: string | null
          organization?: string | null
          start_date?: string
          title?: string
          type?: Database["public"]["Enums"]["experience_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interests: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          created_at: string | null
          file_url: string | null
          id: number
          is_read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: number
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: number
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          application_url: string | null
          company_name: string | null
          created_at: string | null
          created_by: string
          description: string
          id: number
          is_active: boolean | null
          location: string | null
          start_date: string | null
          title: string
          type: Database["public"]["Enums"]["opportunity_type"]
        }
        Insert: {
          application_url?: string | null
          company_name?: string | null
          created_at?: string | null
          created_by: string
          description: string
          id?: number
          is_active?: boolean | null
          location?: string | null
          start_date?: string | null
          title: string
          type: Database["public"]["Enums"]["opportunity_type"]
        }
        Update: {
          application_url?: string | null
          company_name?: string | null
          created_at?: string | null
          created_by?: string
          description?: string
          id?: number
          is_active?: boolean | null
          location?: string | null
          start_date?: string | null
          title?: string
          type?: Database["public"]["Enums"]["opportunity_type"]
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          created_at: string | null
          description: string | null
          file_url: string | null
          id: number
          link_url: string | null
          thumbnail_url: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: number
          link_url?: string | null
          thumbnail_url?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: number
          link_url?: string | null
          thumbnail_url?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          headline: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          signal_score: number
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          headline?: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          signal_score?: number
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          signal_score?: number
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: number
          earned_at: string | null
          user_id: string
        }
        Insert: {
          badge_id: number
          earned_at?: string | null
          user_id: string
        }
        Update: {
          badge_id?: number
          earned_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          interest_id: number
          user_id: string
        }
        Insert: {
          interest_id: number
          user_id: string
        }
        Update: {
          interest_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      activity_event_type:
        | "profile_updated"
        | "experience_added"
        | "portfolio_item_added"
        | "badge_earned"
        | "connection_accepted"
        | "opportunity_posted"
      connection_status: "pending" | "accepted" | "declined" | "blocked"
      experience_type:
        | "academic"
        | "extracurricular"
        | "internship"
        | "work"
        | "project"
        | "volunteer"
      opportunity_type:
        | "internship"
        | "full-time"
        | "part-time"
        | "scholarship"
        | "program"
      user_role:
        | "high_school_student"
        | "college_student"
        | "job_seeker"
        | "college_recruiter"
        | "corporate_recruiter"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_event_type: [
        "profile_updated",
        "experience_added",
        "portfolio_item_added",
        "badge_earned",
        "connection_accepted",
        "opportunity_posted",
      ],
      connection_status: ["pending", "accepted", "declined", "blocked"],
      experience_type: [
        "academic",
        "extracurricular",
        "internship",
        "work",
        "project",
        "volunteer",
      ],
      opportunity_type: [
        "internship",
        "full-time",
        "part-time",
        "scholarship",
        "program",
      ],
      user_role: [
        "high_school_student",
        "college_student",
        "job_seeker",
        "college_recruiter",
        "corporate_recruiter",
      ],
    },
  },
} as const
