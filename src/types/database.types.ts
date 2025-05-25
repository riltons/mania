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
      community_members: {
        Row: {
          id: string;
          community_id: string;
          player_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          community_id: string;
          player_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          community_id?: string;
          player_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      players: {
        Row: {
          id: string;
          name: string;
          nickname: string | null;
          phone?: string | null;
          created_by?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          nickname?: string | null;
          phone?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          nickname?: string | null;
          phone?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      games: {
        Row: {
          id: string;
          team1: string[];
          team2: string[];
          team1_score: number;
          team2_score: number;
          status: 'scheduled' | 'in_progress' | 'finished' | 'buchuda' | 'buchuda_de_re';
          is_buchuda: boolean;
          is_buchuda_de_re: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team1: string[];
          team2: string[];
          team1_score: number;
          team2_score: number;
          status?: 'scheduled' | 'in_progress' | 'finished' | 'buchuda' | 'buchuda_de_re';
          is_buchuda?: boolean;
          is_buchuda_de_re?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team1?: string[];
          team2?: string[];
          team1_score?: number;
          team2_score?: number;
          status?: 'scheduled' | 'in_progress' | 'finished' | 'buchuda' | 'buchuda_de_re';
          is_buchuda?: boolean;
          is_buchuda_de_re?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Tipos úteis para o ranking
export type Player = Database['public']['Tables']['players']['Row'];
export type Game = Database['public']['Tables']['games']['Row'];
export type CommunityMember = Database['public']['Tables']['community_members']['Row'];