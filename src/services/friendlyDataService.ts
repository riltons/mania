import { supabase } from '@/lib/supabase';

export interface FriendlyPlayer {
    id: string;
    name: string;
    phone: string;
    nickname?: string;
    created_at: string;
    created_by: string;
    created_by_name: string;
    primary_user_info?: {
        user_id: string;
        name: string;
        email: string;
    };
    stats: {
        total_games: number;
        wins: number;
        losses: number;
    };
}

export interface FriendlyCommunity {
    id: string;
    name: string;
    description: string;
    created_at: string;
    created_by: string;
    created_by_name: string;
    members_count: number;
    games_count: number;
    organizers: Array<{
        user_id: string;
        name: string;
    }>;
}

class FriendlyDataService {
    async getPlayers() {
        try {
            const { data, error } = await supabase
                .from('friendly_players_view')
                .select('*');

            if (error) {
                console.error('Erro ao buscar jogadores:', error);
                throw error;
            }

            return { data: data as FriendlyPlayer[], error: null };
        } catch (error) {
            console.error('Erro ao buscar jogadores:', error);
            return { data: null, error };
        }
    }

    async getPlayerById(id: string) {
        try {
            const { data, error } = await supabase
                .from('friendly_players_view')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error(`Erro ao buscar jogador com ID ${id}:`, error);
                throw error;
            }

            return { data: data as FriendlyPlayer, error: null };
        } catch (error) {
            console.error(`Erro ao buscar jogador com ID ${id}:`, error);
            return { data: null, error };
        }
    }

    async getCommunities() {
        try {
            const { data, error } = await supabase
                .from('friendly_communities_view')
                .select('*');

            if (error) {
                console.error('Erro ao buscar comunidades:', error);
                throw error;
            }

            return { data: data as FriendlyCommunity[], error: null };
        } catch (error) {
            console.error('Erro ao buscar comunidades:', error);
            return { data: null, error };
        }
    }

    async getCommunityById(id: string) {
        try {
            const { data, error } = await supabase
                .from('friendly_communities_view')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error(`Erro ao buscar comunidade com ID ${id}:`, error);
                throw error;
            }

            return { data: data as FriendlyCommunity, error: null };
        } catch (error) {
            console.error(`Erro ao buscar comunidade com ID ${id}:`, error);
            return { data: null, error };
        }
    }
}

export const friendlyDataService = new FriendlyDataService();