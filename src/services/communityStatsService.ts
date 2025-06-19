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
            // Buscar jogadores da comunidade através da tabela community_members
            const { data: communityMembers, error: membersError } = await supabase
                .from('community_members')
                .select('player_id')
                .eq('community_id', communityId);

            if (membersError) {
                throw new Error(`Erro ao buscar membros da comunidade: ${membersError.message}`);
            }

            if (!communityMembers || communityMembers.length === 0) {
                return {
                    players: [],
                    pairs: []
                };
            }

            // Extrair IDs dos jogadores
            const playerIds = communityMembers.map(member => member.player_id);

            // Buscar dados dos jogadores
            const { data: communityPlayers, error: playersError } = await supabase
                .from('players')
                .select('id, name')
                .in('id', playerIds);

            if (playersError) {
                throw new Error(`Erro ao buscar dados dos jogadores: ${playersError.message}`);
            }

            const playerStats: PlayerStats[] = [];
            const playersMap = new Map<string, Player>();

            // Criar mapa de jogadores para facilitar consultas
            (communityPlayers || []).forEach(player => {
                playersMap.set(player.id, player);
            });

            // Para cada jogador, buscar suas estatísticas
            for (const player of communityPlayers || []) {
                // Primeiro, buscar todos os jogos das competições da comunidade
                const { data: communityGames, error: communityGamesError } = await supabase
                    .from('games')
                    .select(`
                        id,
                        competition_id,
                        competitions!inner(community_id)
                    `)
                    .eq('competitions.community_id', communityId);

                if (communityGamesError) {
                    console.error(`Erro ao buscar jogos da comunidade:`, communityGamesError);
                    continue;
                }

                if (!communityGames || communityGames.length === 0) {
                    // Jogador sem jogos na comunidade
                    playerStats.push({
                        id: player.id,
                        name: player.name,
                        score: 0,
                        wins: 0,
                        losses: 0,
                        buchudas_given: 0,
                        buchudas_taken: 0,
                        buchudas_de_re_given: 0,
                        buchudas_de_re_taken: 0
                    });
                    continue;
                }

                const gameIds = communityGames.map(game => game.id);

                // Buscar estatísticas do jogador nos jogos da comunidade
                const { data: gameStats, error: gameStatsError } = await supabase
                    .from('game_players')
                    .select('is_winner, is_buchuda, is_buchuda_de_re, score')
                    .eq('player_id', player.id)
                    .in('game_id', gameIds);

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
                // Para isso, precisamos buscar todos os game_players dos jogos onde este jogador participou
                const { data: allGamePlayers, error: allGamePlayersError } = await supabase
                    .from('game_players')
                    .select('is_buchuda, is_buchuda_de_re, game_id')
                    .in('game_id', gameIds)
                    .neq('player_id', player.id); // Excluir o próprio jogador

                let buchudas_taken = 0;
                let buchudas_de_re_taken = 0;

                if (!allGamePlayersError && allGamePlayers) {
                    // Agrupar por game_id para contar buchudas por jogo
                    const gamePlayersByGame = new Map<string, any[]>();
                    allGamePlayers.forEach(gp => {
                        if (!gamePlayersByGame.has(gp.game_id)) {
                            gamePlayersByGame.set(gp.game_id, []);
                        }
                        gamePlayersByGame.get(gp.game_id)!.push(gp);
                    });

                    // Para cada jogo onde o jogador participou, contar buchudas feitas por outros
                    for (const gameId of gameIds) {
                        const otherPlayersInGame = gamePlayersByGame.get(gameId) || [];
                        buchudas_taken += otherPlayersInGame.filter(gp => gp.is_buchuda).length;
                        buchudas_de_re_taken += otherPlayersInGame.filter(gp => gp.is_buchuda_de_re).length;
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

            // Buscar estatísticas de duplas
            const pairStats: PairStats[] = await this.calculatePairStats(communityId, playersMap);

            return {
                players: playerStats,
                pairs: pairStats
            };
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            throw error;
        }
    },

    async calculatePairStats(communityId: string, playersMap: Map<string, Player>): Promise<PairStats[]> {
        try {
            // Buscar jogos da comunidade que são 2x2
            const { data: gamesData, error: gamesError } = await supabase
                .from('games')
                .select(`
                    id,
                    team1,
                    team2,
                    team1_score,
                    team2_score,
                    status,
                    competitions!inner(community_id)
                `)
                .eq('competitions.community_id', communityId)
                .in('status', ['finished', 'buchuda', 'buchuda_de_re']);

            if (gamesError) {
                console.error('Erro ao buscar jogos para estatísticas de duplas:', gamesError);
                return [];
            }

            const pairStatsMap = new Map<string, {
                player1Id: string;
                player2Id: string;
                wins: number;
                losses: number;
                pointsGained: number;
                pointsLost: number;
                buchudas: number;
                buchudasTaken: number;
                buchudasDeRe: number;
                buchudasDeReTaken: number;
                games: Set<string>;
            }>();

            // Função auxiliar para gerar chave única para a dupla
            const getPairKey = (id1: string, id2: string) => {
                return [id1, id2].sort().join('_');
            };

            // Processar cada jogo
            (gamesData || []).forEach(game => {
                const team1 = Array.isArray(game.team1) ? game.team1 : [];
                const team2 = Array.isArray(game.team2) ? game.team2 : [];

                // Apenas jogos 2x2 são considerados para ranking de duplas
                if (team1.length === 2 && team2.length === 2) {
                    const team1Score = Number(game.team1_score) || 0;
                    const team2Score = Number(game.team2_score) || 0;
                    const isBuchuda = game.status === 'buchuda';
                    const isBuchudaDeRe = game.status === 'buchuda_de_re';

                    // Processar time 1
                    const [p1, p2] = team1;
                    if (p1 && p2 && playersMap.has(p1) && playersMap.has(p2)) {
                        const pairKey = getPairKey(p1, p2);
                        const stats = pairStatsMap.get(pairKey) || {
                            player1Id: p1,
                            player2Id: p2,
                            wins: 0,
                            losses: 0,
                            pointsGained: 0,
                            pointsLost: 0,
                            buchudas: 0,
                            buchudasTaken: 0,
                            buchudasDeRe: 0,
                            buchudasDeReTaken: 0,
                            games: new Set<string>()
                        };

                        // Evitar processar o mesmo jogo múltiplas vezes
                        if (!stats.games.has(game.id)) {
                            stats.games.add(game.id);

                            if (team1Score > team2Score) {
                                stats.wins++;
                                if (isBuchuda && team2Score === 0) stats.buchudas++;
                                if (isBuchudaDeRe) stats.buchudasDeRe++;
                            } else {
                                stats.losses++;
                                if (isBuchuda && team1Score === 0) stats.buchudasTaken++;
                                if (isBuchudaDeRe) stats.buchudasDeReTaken++;
                            }

                            stats.pointsGained += team1Score;
                            stats.pointsLost += team2Score;

                            pairStatsMap.set(pairKey, stats);
                        }
                    }

                    // Processar time 2
                    const [p3, p4] = team2;
                    if (p3 && p4 && playersMap.has(p3) && playersMap.has(p4)) {
                        const pairKey = getPairKey(p3, p4);
                        const stats = pairStatsMap.get(pairKey) || {
                            player1Id: p3,
                            player2Id: p4,
                            wins: 0,
                            losses: 0,
                            pointsGained: 0,
                            pointsLost: 0,
                            buchudas: 0,
                            buchudasTaken: 0,
                            buchudasDeRe: 0,
                            buchudasDeReTaken: 0,
                            games: new Set<string>()
                        };

                        // Evitar processar o mesmo jogo múltiplas vezes
                        if (!stats.games.has(game.id)) {
                            stats.games.add(game.id);

                            if (team2Score > team1Score) {
                                stats.wins++;
                                if (isBuchuda && team1Score === 0) stats.buchudas++;
                                if (isBuchudaDeRe) stats.buchudasDeRe++;
                            } else {
                                stats.losses++;
                                if (isBuchuda && team2Score === 0) stats.buchudasTaken++;
                                if (isBuchudaDeRe) stats.buchudasDeReTaken++;
                            }

                            stats.pointsGained += team2Score;
                            stats.pointsLost += team1Score;

                            pairStatsMap.set(pairKey, stats);
                        }
                    }
                }
            });

            // Converter para array de PairStats
            const pairStats: PairStats[] = [];
            pairStatsMap.forEach((stats) => {
                const player1 = playersMap.get(stats.player1Id);
                const player2 = playersMap.get(stats.player2Id);

                if (player1 && player2) {
                    pairStats.push({
                        players: [player1, player2],
                        score: stats.pointsGained,
                        wins: stats.wins,
                        losses: stats.losses,
                        buchudas_given: stats.buchudas,
                        buchudas_taken: stats.buchudasTaken,
                        buchudas_de_re_given: stats.buchudasDeRe,
                        buchudas_de_re_taken: stats.buchudasDeReTaken
                    });
                }
            });

            // Ordenar por vitórias (descendente) e depois por pontuação
            return pairStats.sort((a, b) => {
                if (b.wins !== a.wins) return b.wins - a.wins;
                return b.score - a.score;
            });

        } catch (error) {
            console.error('Erro ao calcular estatísticas de duplas:', error);
            return [];
        }
    }
};
