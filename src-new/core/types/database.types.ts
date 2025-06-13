/**
 * Tipos centralizados para o banco de dados Supabase
 * Estes tipos representam as entidades principais da aplicação
 */

// Tipo para Competição
export interface Competition {
  id: string;
  name: string;
  description: string;
  community_id: string;
  start_date: string;
  created_at: string;
  status: 'pending' | 'in_progress' | 'finished' | 'cancelled';
  has_finished_games?: boolean;
  has_only_pending_or_in_progress?: boolean;
}

// Tipo para Jogos
export type VictoryType = 
    | 'simple' // 1 ponto
    | 'carroca' // 2 pontos
    | 'la_e_lo' // 3 pontos
    | 'cruzada' // 4 pontos
    | 'contagem' // 1 ponto
    | 'empate'; // 0 ponto + 1 na próxima

export interface GameRound {
  type: VictoryType;
  winner_team: 1 | 2 | null;
  has_bonus: boolean;
}

export interface Game {
  id: string;
  competition_id: string;
  team1: string[];
  team2: string[];
  team1_score: number;
  team2_score: number;
  status: 'pending' | 'in_progress' | 'finished';
  created_at: string;
  rounds: GameRound[];
  last_round_was_tie: boolean;
  team1_was_losing_5_0: boolean;
  team2_was_losing_5_0: boolean;
}

// Tipo para Comunidade
export interface Community {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
}

// Tipo para Jogador
export interface Player {
  id: string;
  name: string;
  user_id?: string;
  created_at: string;
  avatar_url?: string;
  phone?: string;
}

// Tipo para usuário autenticado
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  avatar_url?: string;
}

// Tipo para Assinatura
export interface Subscription {
  id: string;
  user_id: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  plan: 'free' | 'pro' | 'premium';
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

// Tipo para Atividade
export interface Activity {
  id: string;
  user_id: string;
  type: 'game_created' | 'competition_created' | 'community_created' | 'player_created' | 'competition_finished';
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}