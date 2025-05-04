import { supabase } from '@/lib/supabase';

export interface FriendlyGame {
    id: string;
    competition_id: string;
    competition_name: string;
    community_id: string;
    community_name: string;
    team1_score: number;
    team2_score: number;
    status: 'pending' | 'in_progress' | 'finished';
    is_buchuda: boolean;
    is_buchuda_de_re: boolean;
    created_at: string;
    updated_at: string;
    team1_players: Array<{
        id: string;
        player_id: string;
        player_name: string;
        team: number;
    }>;
    team2_players: Array<{
        id: string;
        player_id: string;
        player_name: string;
        team: number;
    }>;
    game_details: {
        rounds_count: number;
        last_round_was_tie: boolean;
        team1_was_losing_5_0: boolean;
        team2_was_losing_5_0: boolean;
    };
}

class FriendlyGamesService {
    async getGames() {
        try {
            const { data, error } = await supabase
                .from('friendly_games_view')
                .select('*');

            if (error) {
                console.error('Erro ao buscar jogos:', error);
                throw error;
            }

            return { data: data as FriendlyGame[], error: null };
        } catch (error) {
            console.error('Erro ao buscar jogos:', error);
            return { data: null, error };
        }
    }

    async getGameById(id: string) {
        try {
            const { data, error } = await supabase
                .from('friendly_games_view')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error(`Erro ao buscar jogo com ID ${id}:`, error);
                throw error;
            }

            return { data: data as FriendlyGame, error: null };
        } catch (error) {
            console.error(`Erro ao buscar jogo com ID ${id}:`, error);
            return { data: null, error };
        }
    }

    async getGamesByCompetition(competitionId: string) {
        try {
            const { data, error } = await supabase
                .from('friendly_games_view')
                .select('*')
                .eq('competition_id', competitionId);

            if (error) {
                console.error(`Erro ao buscar jogos da competição ${competitionId}:`, error);
                throw error;
            }

            return { data: data as FriendlyGame[], error: null };
        } catch (error) {
            console.error(`Erro ao buscar jogos da competição ${competitionId}:`, error);
            return { data: null, error };
        }
    }

    async getGamesByCommunity(communityId: string) {
        try {
            const { data, error } = await supabase
                .from('friendly_games_view')
                .select('*')
                .eq('community_id', communityId);

            if (error) {
                console.error(`Erro ao buscar jogos da comunidade ${communityId}:`, error);
                throw error;
            }

            return { data: data as FriendlyGame[], error: null };
        } catch (error) {
            console.error(`Erro ao buscar jogos da comunidade ${communityId}:`, error);
            return { data: null, error };
        }
    }
}

export const friendlyGamesService = new FriendlyGamesService();