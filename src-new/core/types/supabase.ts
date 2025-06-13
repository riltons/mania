export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      communities: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
        }
      }
      competitions: {
        Row: {
          community_id: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          prize_pool: number | null
          start_date: string
          status: string
        }
        Insert: {
          community_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          prize_pool?: number | null
          start_date: string
          status?: string
        }
        Update: {
          community_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          prize_pool?: number | null
          start_date?: string
          status?: string
        }
      }
      players: {
        Row: {
          created_at: string
          id: string
          name: string
          nickname: string | null
          user_id: string
          avatar_url?: string | null
          phone?: string
          created_by?: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          nickname?: string | null
          user_id: string
          avatar_url?: string | null
          phone?: string
          created_by?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          nickname?: string | null
          user_id?: string
          avatar_url?: string | null
          phone?: string
          created_by?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
