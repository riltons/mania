import { supabase } from '@/lib/supabase';

type Player = {
    id: string;
    name: string;
};

type PlayerStats = {
    id: string;
    name: string;
    score: number;
    wins: number;
    losses: number;
    buchudas_given: number;
    buchudas_taken: number;
    buchudas_de_re_given: number;
    buchudas_de_re_taken: number;
};

type PairStats = {
    players: Player[];
    score: number;
    wins: number;
    losses: number;
    buchudas_given: number;
    buchudas_taken: number;
    buchudas_de_re_given: number;
    buchudas_de_re_taken: number;
};

export type CommunityStats = {
    players: PlayerStats[];
    pairs: PairStats[];
};

export const communityStatsService = {
    async getCommunityStats(communityId: string): Promise<CommunityStats> {
        try {
            // Buscar estatísticas dos jogadores
            const { data: playerStats, error: playerError } = await supabase
                .rpc('get_community_player_stats', { community_id: communityId });

            if (playerError) {
                throw new Error(`Erro ao buscar estatísticas dos jogadores: ${playerError.message}`);
            }

            // Buscar estatísticas das duplas
            const { data: pairStats, error: pairError } = await supabase
                .rpc('get_community_pair_stats', { community_id: communityId });

            if (pairError) {
                throw new Error(`Erro ao buscar estatísticas das duplas: ${pairError.message}`);
            }

            return {
                players: playerStats || [],
                pairs: pairStats || []
            };
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            throw error;
        }
    }
};
