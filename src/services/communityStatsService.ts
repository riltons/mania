import { supabase } from '@/core/lib/supabase';

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
            // Buscar jogadores da comunidade
            const { data: communityPlayers, error: playersError } = await supabase
                .from('players')
                .select('id, name')
                .eq('community_id', communityId);

            if (playersError) {
                throw new Error(`Erro ao buscar jogadores da comunidade: ${playersError.message}`);
            }

            const playerStats: PlayerStats[] = [];

            // Para cada jogador, buscar suas estatísticas
            for (const player of communityPlayers || []) {
                // Buscar jogos do jogador
                const { data: gameStats, error: gameStatsError } = await supabase
                    .from('game_players')
                    .select(`
                        is_winner,
                        is_buchuda,
                        is_buchuda_de_re,
                        score,
                        games!inner(
                            competition_id,
                            competitions!inner(community_id)
                        )
                    `)
                    .eq('player_id', player.id)
                    .eq('games.competitions.community_id', communityId);

                if (gameStatsError) {
                    console.error(`Erro ao buscar estatísticas do jogador ${player.name}:`, gameStatsError);
                    continue;
                }

                // Calcular estatísticas
                const stats = gameStats || [];
                const wins = stats.filter(s => s.is_winner).length;
                const losses = stats.length - wins;
                const buchudas_given = stats.filter(s => s.is_buchuda).length;
                const buchudas_de_re_given = stats.filter(s => s.is_buchuda_de_re).length;
                const totalScore = stats.reduce((sum, s) => sum + (s.score || 0), 0);

                // Buscar buchudas recebidas (quando outros jogadores fizeram buchuda contra este jogador)
                const { data: buchudasTaken, error: buchudasTakenError } = await supabase
                    .from('game_players')
                    .select(`
                        games!inner(
                            id,
                            game_players!inner(is_buchuda, is_buchuda_de_re),
                            competition_id,
                            competitions!inner(community_id)
                        )
                    `)
                    .eq('player_id', player.id)
                    .eq('games.competitions.community_id', communityId);

                let buchudas_taken = 0;
                let buchudas_de_re_taken = 0;

                if (!buchudasTakenError && buchudasTaken) {
                    for (const gameData of buchudasTaken) {
                        const game = gameData.games;
                        if (game && game.game_players) {
                            // Contar buchudas feitas por outros jogadores neste jogo
                            buchudas_taken += game.game_players.filter(gp => 
                                gp.is_buchuda && gp.player_id !== player.id
                            ).length;
                            buchudas_de_re_taken += game.game_players.filter(gp => 
                                gp.is_buchuda_de_re && gp.player_id !== player.id
                            ).length;
                        }
                    }
                }

                playerStats.push({
                    id: player.id,
                    name: player.name,
                    score: totalScore,
                    wins,
                    losses,
                    buchudas_given,
                    buchudas_taken,
                    buchudas_de_re_given,
                    buchudas_de_re_taken
                });
            }

            // Por enquanto, retornar array vazio para duplas até implementarmos a lógica
            const pairStats: PairStats[] = [];

            return {
                players: playerStats,
                pairs: pairStats
            };
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            throw error;
        }
    }
};
