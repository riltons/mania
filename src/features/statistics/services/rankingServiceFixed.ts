// Versão corrigida do rankingService para identificar o problema

// Interfaces exportadas
export interface PlayerRanking {
    id: string;
    name: string;
    avatar_url: string | null;
    wins: number;
    losses: number;
    totalGames: number;
    winRate: number;
    buchudas: number;
    points: number;
}

export interface PairRanking {
    id: string;
    player1: {
        id: string;
        name: string;
        avatar_url: string | null;
    };
    player2: {
        id: string;
        name: string;
        avatar_url: string | null;
    };
    wins: number;
    losses: number;
    totalGames: number;
    winRate: number;
    buchudas: number;
    buchudasTaken: number;
    buchudasDeRe: number;
    buchudasDeReTaken: number;
    pointsGained: number;
    pointsLost: number;
}

const rankingServiceFixed = {
    async getTopPlayers(communityId?: string): Promise<PlayerRanking[]> {
        console.log('[RankingServiceFixed] Iniciando getTopPlayers...');
        
        try {
            // Importar supabase dinamicamente para evitar problemas de import
            const { supabase } = await import('@/core/lib/supabase');
            console.log('[RankingServiceFixed] Supabase importado com sucesso');
            
            const userId = (await supabase.auth.getUser()).data.user?.id;
            if (!userId) {
                console.error('[RankingServiceFixed] Usuário não autenticado');
                return [];
            }
            console.log('[RankingServiceFixed] UserId encontrado:', userId);

            // Buscar comunidades onde o usuário é organizador ou criador
            const { data: ownedCommunities, error: ownedError } = await supabase
                .from('communities')
                .select('id')
                .eq('created_by', userId);
                
            const { data: organizedCommunities, error: organizedError } = await supabase
                .from('community_organizers')
                .select('community_id')
                .eq('user_id', userId);
                
            console.log('[RankingServiceFixed] Comunidades encontradas:', { ownedCommunities, organizedCommunities });
            
            if (ownedError || organizedError) {
                console.error('[RankingServiceFixed] Erro ao buscar comunidades:', { ownedError, organizedError });
                return [];
            }
            
            // Combinar IDs das comunidades
            const ownedIds = ownedCommunities?.map((c: any) => c.id) || [];
            const organizedIds = organizedCommunities?.map((c: any) => c.community_id) || [];
            const allCommunityIds = [...new Set([...ownedIds, ...organizedIds])];
            
            console.log('[RankingServiceFixed] IDs das comunidades encontradas:', allCommunityIds);
            
            if (allCommunityIds.length === 0) {
                console.log('[RankingServiceFixed] Nenhuma comunidade encontrada');
                return [];
            }

            // Buscar jogos através das competições
            const { data: games, error: gamesError } = await supabase
                .from('games')
                .select(`
                    id, team1, team2, team1_score, team2_score, status,
                    competitions!inner(community_id)
                `)
                .in('competitions.community_id', allCommunityIds)
                .in('status', ['finished', 'buchuda', 'buchuda_de_re']);

            if (gamesError) {
                console.error('[RankingServiceFixed] Erro ao buscar jogos:', gamesError);
                return [];
            }
            
            console.log('[RankingServiceFixed] Jogos encontrados:', games?.length || 0);

            // Buscar jogadores
            const { data: players, error: playersError } = await supabase
                .from('players')
                .select('id, name, avatar_url')
                .eq('is_active', true);

            if (playersError) {
                console.error('[RankingServiceFixed] Erro ao buscar jogadores:', playersError);
                return [];
            }
            
            console.log('[RankingServiceFixed] Jogadores encontrados:', players?.length || 0);

            if (!games || !players || games.length === 0 || players.length === 0) {
                console.log('[RankingServiceFixed] Dados insuficientes para gerar ranking');
                return [];
            }

            // Processar dados (versão simplificada)
            const playerStats = new Map();
            
            // Inicializar stats
            for (const player of players) {
                playerStats.set(player.id, {
                    id: player.id,
                    name: player.name,
                    avatar_url: player.avatar_url,
                    wins: 0,
                    losses: 0,
                    points: 0,
                    buchudas: 0,
                });
            }

            // Processar jogos
            for (const game of games) {
                const team1 = Array.isArray(game.team1) ? game.team1 : [];
                const team2 = Array.isArray(game.team2) ? game.team2 : [];
                
                for (const playerId of [...team1, ...team2]) {
                    if (playerStats.has(playerId)) {
                        const stats = playerStats.get(playerId);
                        const isTeam1 = team1.includes(playerId);
                        
                        if (game.team1_score > game.team2_score) {
                            if (isTeam1) {
                                stats.wins++;
                                stats.points += game.team1_score;
                            } else {
                                stats.losses++;
                                stats.points += game.team2_score;
                            }
                        } else if (game.team2_score > game.team1_score) {
                            if (!isTeam1) {
                                stats.wins++;
                                stats.points += game.team2_score;
                            } else {
                                stats.losses++;
                                stats.points += game.team1_score;
                            }
                        }
                        
                        playerStats.set(playerId, stats);
                    }
                }
            }

            // Gerar ranking
            const rankings: PlayerRanking[] = Array.from(playerStats.values())
                .map((stats: any) => {
                    const totalGames = stats.wins + stats.losses;
                    return {
                        ...stats,
                        totalGames,
                        winRate: totalGames > 0 ? (stats.wins / totalGames) * 100 : 0,
                    };
                })
                .filter((p: any) => p.wins > 0)
                .sort((a: any, b: any) => {
                    if (b.wins !== a.wins) return b.wins - a.wins;
                    return b.winRate - a.winRate;
                });

            console.log('[RankingServiceFixed] Rankings gerados:', rankings.length);
            return rankings;

        } catch (error) {
            console.error('[RankingServiceFixed] Erro geral:', error);
            console.error('[RankingServiceFixed] Stack:', (error as any)?.stack);
            throw error;
        }
    },

    async getTopPairs(communityId?: string): Promise<PairRanking[]> {
        console.log('[RankingServiceFixed] Iniciando getTopPairs, communityId:', communityId);
        
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.EXPO_PUBLIC_SUPABASE_URL!,
            process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (!userId) {
            console.error('[RankingServiceFixed] Usuário não autenticado');
            return [];
        }
        console.log('[RankingServiceFixed] UserId encontrado:', userId);

        // Buscar comunidades onde o usuário é organizador ou criador
        const { data: ownedCommunities, error: ownedError } = await supabase
            .from('communities')
            .select('id')
            .eq('created_by', userId);
            
        const { data: organizedCommunities, error: organizedError } = await supabase
            .from('community_organizers')
            .select('community_id')
            .eq('user_id', userId);
            
        console.log('[RankingServiceFixed] Comunidades encontradas:', { ownedCommunities, organizedCommunities });
        
        if (ownedError || organizedError) {
            console.error('[RankingServiceFixed] Erro ao buscar comunidades:', { ownedError, organizedError });
            return [];
        }
        
        // Combinar IDs das comunidades
        const ownedIds = ownedCommunities?.map((c: any) => c.id) || [];
        const organizedIds = organizedCommunities?.map((c: any) => c.community_id) || [];
        let allCommunityIds = [...new Set([...ownedIds, ...organizedIds])];
        
        console.log('[RankingServiceFixed] IDs das comunidades encontradas:', allCommunityIds);
        
        if (communityId) {
            allCommunityIds = allCommunityIds.filter((id: string) => id === communityId);
        }
        

        
        if (allCommunityIds.length === 0) {
            console.log('[RankingServiceFixed] Nenhuma comunidade encontrada para o usuário');
            return [];
        }

        // Buscar jogos via relação com competitions
        const { data: games, error: gamesError } = await supabase
            .from('games')
            .select(`
                id, team1, team2, team1_score, team2_score, status,
                competitions!inner(community_id)
            `)
            .in('competitions.community_id', allCommunityIds)
            .in('status', ['finished', 'buchuda', 'buchuda_de_re']);

        if (gamesError) {
            console.error('[RankingServiceFixed] Erro ao buscar jogos:', gamesError);
            return [];
        }
        
        console.log('[RankingServiceFixed] Jogos encontrados:', games?.length || 0);
        if (!games || games.length === 0) {
            console.log('[RankingServiceFixed] Nenhum jogo finalizado encontrado');
            return [];
        }

        const { data: players, error: playersError } = await supabase
            .from('players')
            .select('id, name, avatar_url')
            .eq('is_active', true);

        if (playersError) {
            console.error('[RankingServiceFixed] Erro ao buscar jogadores:', playersError);
            return [];
        }
        
        console.log('[RankingServiceFixed] Jogadores encontrados:', players?.length || 0);
        if (!players || players.length === 0) {
            console.log('[RankingServiceFixed] Nenhum jogador ativo encontrado');
            return [];
        }

        const playersMap = new Map<string, PlayerData>(players.map((p: PlayerData) => [p.id, p]));
        const pairStats = new Map<string, PairStats>();
        const getPairKey = (id1: string, id2: string) => [id1, id2].sort().join('_');
        let processedPairGames = 0;

        for (const game of games as GameData[]) {
            const team1 = Array.isArray(game.team1) ? game.team1.filter((id: string) => playersMap.has(id)) : [];
            const team2 = Array.isArray(game.team2) ? game.team2.filter((id: string) => playersMap.has(id)) : [];

            // Só processar jogos de dupla (2v2)
            if (team1.length !== 2 || team2.length !== 2) {
                continue;
            }

            const pair1Key = getPairKey(team1[0], team1[1]);
            const pair2Key = getPairKey(team2[0], team2[1]);

            const pair1Stats = pairStats.get(pair1Key) || { 
                player1Id: team1[0], 
                player2Id: team1[1], 
                wins: 0, 
                losses: 0, 
                buchudas: 0, 
                buchudasTaken: 0, 
                buchudasDeRe: 0, 
                buchudasDeReTaken: 0, 
                pointsGained: 0, 
                pointsLost: 0 
            };
            
            const pair2Stats = pairStats.get(pair2Key) || { 
                player1Id: team2[0], 
                player2Id: team2[1], 
                wins: 0, 
                losses: 0, 
                buchudas: 0, 
                buchudasTaken: 0, 
                buchudasDeRe: 0, 
                buchudasDeReTaken: 0, 
                pointsGained: 0, 
                pointsLost: 0 
            };

            if (game.team1_score > game.team2_score) {
                pair1Stats.wins++;
                pair2Stats.losses++;
                if (game.status === 'buchuda' && game.team2_score === 0) pair1Stats.buchudas++;
                if (game.status === 'buchuda_de_re') pair1Stats.buchudasDeRe++;
            } else if (game.team2_score > game.team1_score) {
                pair2Stats.wins++;
                pair1Stats.losses++;
                if (game.status === 'buchuda' && game.team1_score === 0) pair2Stats.buchudas++;
                if (game.status === 'buchuda_de_re') pair2Stats.buchudasDeRe++;
            }
            
            pair1Stats.pointsGained += game.team1_score;
            pair1Stats.pointsLost += game.team2_score;
            pair2Stats.pointsGained += game.team2_score;
            pair2Stats.pointsLost += game.team1_score;

            pairStats.set(pair1Key, pair1Stats);
            pairStats.set(pair2Key, pair2Stats);
            processedPairGames++;
        }
        
        console.log('[RankingServiceFixed] Jogos de dupla processados:', processedPairGames);
        console.log('[RankingServiceFixed] Duplas únicas encontradas:', pairStats.size);

        const rankings: PairRanking[] = [];
        for (const [key, stats] of pairStats.entries()) {
            const player1 = playersMap.get(stats.player1Id);
            const player2 = playersMap.get(stats.player2Id);

            if (!player1 || !player2) {
                console.log('[RankingServiceFixed] Jogadores não encontrados para dupla:', key);
                continue;
            }

            const totalGames = stats.wins + stats.losses;
            if (totalGames === 0) continue;

            const winRate = (stats.wins / totalGames) * 100;
            const avgPointsGained = stats.pointsGained / totalGames;
            const avgPointsLost = stats.pointsLost / totalGames;

            rankings.push({
                id: `${stats.player1Id}_${stats.player2Id}`,
                player1: {
                    id: stats.player1Id,
                    name: player1.name,
                    avatar_url: player1.avatar_url
                },
                player2: {
                    id: stats.player2Id,
                    name: player2.name,
                    avatar_url: player2.avatar_url
                },
                wins: stats.wins,
                losses: stats.losses,
                totalGames,
                winRate,
                buchudas: stats.buchudas,
                buchudasTaken: stats.buchudasTaken,
                buchudasDeRe: stats.buchudasDeRe,
                buchudasDeReTaken: stats.buchudasDeReTaken,
                pointsGained: stats.pointsGained,
                pointsLost: stats.pointsLost,
            });
        }

        // Filtrar duplas com pelo menos 1 vitória e ordenar
        const filteredRankings = rankings
            .filter(pair => pair.wins > 0)
            .sort((a, b) => {
                if (b.wins !== a.wins) return b.wins - a.wins;
                return b.winRate - a.winRate;
            });

        console.log('[RankingServiceFixed] Rankings de duplas finais gerados:', filteredRankings.length);
        console.log('[RankingServiceFixed] Top 3 duplas:', filteredRankings.slice(0, 3).map(p => ({ 
            pair: `${p.player1.name} & ${p.player2.name}`, 
            wins: p.wins, 
            winRate: p.winRate.toFixed(1) 
        })));

        return filteredRankings;
    }
};

export default rankingServiceFixed;
