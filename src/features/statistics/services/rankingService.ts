import { supabase } from '@/core/lib/supabase';

export interface PlayerRanking {
    id: string;
    name: string;
    wins: number;
    losses: number;
    totalGames: number;
    pointsGained: number;
    pointsLost: number;
    winRate: number;
    buchudas: number;
    buchudasTaken: number;
    buchudasDeRe: number;
    buchudasDeReTaken: number;
}

export interface PairRanking {
    id: string;
    player1: {
        id: string;
        name: string;
    };
    player2: {
        id: string;
        name: string;
    };
    wins: number;
    losses: number;
    totalGames: number;
    pointsGained: number;
    pointsLost: number;
    buchudas: number;
    buchudasTaken: number;
    buchudasDeRe: number;
    buchudasDeReTaken: number;
    winRate: number;
}

export const rankingService = {
    async getTopPlayers(communityId?: string): Promise<PlayerRanking[]> {
        console.log('RankingService: Iniciando busca de jogadores...');
        const userId = (await supabase.auth.getUser()).data.user?.id;

        if (!userId) {
            console.error('RankingService: Usuário não autenticado');
            return [];
        }

        let communityIds: string[] = [];
        
        try {
            if (communityId) {
                // Se um ID de comunidade específico foi fornecido, use apenas ele
                communityIds = [communityId];
            } else {
                // Caso contrário, busque todas as comunidades do usuário
                const { data: memberCommunities, error: memberError } = await supabase
                    .from('community_members')
                    .select('community_id')
                    .eq('player_id', userId);

                if (memberError) {
                    console.error('Erro ao buscar comunidades do membro:', memberError.message);
                }

                const { data: organizerCommunities, error: organizerError } = await supabase
                    .from('community_organizers')
                    .select('community_id')
                    .eq('user_id', userId);

                if (organizerError) {
                    console.error('Erro ao buscar comunidades do organizador:', organizerError.message);
                }

                communityIds = [
                    ...(memberCommunities?.map(c => c.community_id) || []),
                    ...(organizerCommunities?.map(c => c.community_id) || [])
                ];
            }

            // Se não encontrou comunidades, busque todos os jogos do usuário
            if (communityIds.length === 0) {
                console.log('RankingService: Usuário não pertence a nenhuma comunidade, buscando todos os jogos');
                // Continuar mesmo sem comunidades
            }
        } catch (error) {
            console.error('Erro ao buscar comunidades:', error);
            // Continuar mesmo com erro
        }

        // Buscar jogadores das comunidades
        let communityMembers = [];
        
        try {
            if (communityIds.length > 0) {
                const { data: members, error: membersError } = await supabase
                    .from('community_members')
                    .select(`
                        player_id,
                        players (id, name)
                    `)
                    .in('community_id', communityIds);
                
                if (membersError) {
                    console.error('Erro ao buscar membros das comunidades:', membersError.message);
                } else {
                    communityMembers = members || [];
                }
            }
            
            // Se não encontrou jogadores nas comunidades, busque todos os jogadores
            if (!communityMembers || communityMembers.length === 0) {
                console.log('RankingService: Buscando todos os jogadores...');
                const { data: allPlayers, error: playersError } = await supabase
                    .from('players')
                    .select('id, name');
                
                if (playersError) {
                    console.error('Erro ao buscar todos os jogadores:', playersError.message);
                } else if (allPlayers) {
                    // Adaptar o formato para corresponder ao esperado
                    communityMembers = allPlayers.map(player => ({
                        player_id: player.id,
                        players: player
                    }));
                }
            }
        } catch (error) {
            console.error('Erro ao buscar jogadores:', error);
        }
        
        if (!communityMembers || communityMembers.length === 0) {
            console.log('RankingService: Nenhum jogador encontrado');
            return [];
        }

        // Extrair IDs únicos dos jogadores
        const playerIds = [...new Set(communityMembers
            .filter(member => member.players)
            .map(member => member.players.id))];

        // Buscar estatísticas dos jogadores
        console.log('PlayerIds para busca:', playerIds);
        
        let games = [];
        try {
            // Buscar todos os jogos, independente dos jogadores
            const { data: allGames, error: gamesError } = await supabase
                .from('games')
                .select('*')
                .neq('status', 'pending')
                .order('created_at', { ascending: false });

            if (gamesError) {
                console.error('Erro ao buscar jogos:', gamesError);
            } else {
                games = allGames || [];
                console.log(`Encontrados ${games.length} jogos no total`);
            }
        } catch (error) {
            console.error('Erro ao buscar jogos:', error);
        }
        
        if (!games || games.length === 0) {
            console.log('RankingService: Nenhum jogo encontrado');
            return [];
        }

        console.log('Jogos encontrados:', games);

        console.log('Todos os jogos:', games?.map(g => ({
            id: g.id,
            team1: g.team1,
            team2: g.team2,
            winner_team: g.winner_team,
            winner_team_raw: JSON.stringify(g.winner_team),
            is_buchuda: g.is_buchuda,
            is_buchuda_raw: JSON.stringify(g.is_buchuda),
            is_buchuda_de_re: g.is_buchuda_de_re,
            is_buchuda_de_re_raw: JSON.stringify(g.is_buchuda_de_re)
        })));

        // Calcular estatísticas para cada jogador
        const playerStats = playerIds.map(playerId => {
            const playerGames = games?.filter(game => {
                const team1 = game.team1 || [];
                const team2 = game.team2 || [];
                return team1.includes(playerId) || team2.includes(playerId);
            }) || [];

            console.log(`Jogos do jogador ${playerId}:`, playerGames.map(g => ({
                id: g.id,
                team1: g.team1,
                team2: g.team2,
                winner_team: g.winner_team,
                winner_team_raw: JSON.stringify(g.winner_team),
                is_buchuda: g.is_buchuda,
                is_buchuda_raw: JSON.stringify(g.is_buchuda),
                is_buchuda_de_re: g.is_buchuda_de_re,
                is_buchuda_de_re_raw: JSON.stringify(g.is_buchuda_de_re)
            })));

            // Calcular vitórias, derrotas e pontos
            let wins = 0;
            let losses = 0;
            let pointsGained = 0;
            let pointsLost = 0;
            
            playerGames.forEach(game => {
                const team1 = game.team1 || [];
                const team2 = game.team2 || [];
                const isTeam1 = team1.includes(playerId);
                const isTeam2 = team2.includes(playerId);
                const isWinner = (isTeam1 && game.team1_score > game.team2_score) || 
                                (isTeam2 && game.team2_score > game.team1_score);
                
                // Calcular pontos ganhos e perdidos
                if (isTeam1) {
                    pointsGained += game.team1_score || 0;
                    pointsLost += game.team2_score || 0;
                } else if (isTeam2) {
                    pointsGained += game.team2_score || 0;
                    pointsLost += game.team1_score || 0;
                }
                
                // Contabilizar vitórias e derrotas
                if (isWinner) {
                    wins++;
                } else if (game.status === 'finished') {
                    losses++;
                }
                
                console.log(`Calculando estatísticas para jogo ${game.id}:`, {
                    playerId,
                    team1,
                    team2,
                    isTeam1,
                    isTeam2,
                    team1_score: game.team1_score,
                    team2_score: game.team2_score,
                    isWinner,
                    pointsGained,
                    pointsLost
                });
            });
            
            const totalGames = playerGames.length;

            // Calcular buchudas dadas
            const buchudas = playerGames.filter(game => {
                const team1 = game.team1 || [];
                const team2 = game.team2 || [];
                const isTeam1 = team1.includes(playerId);
                const isTeam2 = team2.includes(playerId);
                const isWinner = (isTeam1 && game.team1_score > game.team2_score) || 
                                (isTeam2 && game.team2_score > game.team1_score);
                const isBuchuda = game.is_buchuda === true && 
                                ((isTeam1 && game.team2_score === 0) || 
                                 (isTeam2 && game.team1_score === 0));
                
                return isWinner && isBuchuda;
            }).length;
            
            // Calcular buchudas levadas
            const buchudasTaken = playerGames.filter(game => {
                const team1 = game.team1 || [];
                const team2 = game.team2 || [];
                const isTeam1 = team1.includes(playerId);
                const isTeam2 = team2.includes(playerId);
                const isLoser = (isTeam1 && game.team1_score < game.team2_score) || 
                               (isTeam2 && game.team2_score < game.team1_score);
                const isBuchuda = game.is_buchuda === true;
                
                return isLoser && isBuchuda;
            }).length;
            
            // Calcular buchudas de ré dadas
            const buchudasDeRe = playerGames.filter(game => {
                const team1 = game.team1 || [];
                const team2 = game.team2 || [];
                const isTeam1 = team1.includes(playerId);
                const isTeam2 = team2.includes(playerId);
                const isWinner = (isTeam1 && game.team1_score > game.team2_score) || 
                                (isTeam2 && game.team2_score > game.team1_score);
                const isBuchudaRe = game.is_buchuda_de_re === true;
                
                return isWinner && isBuchudaRe;
            }).length;
            
            // Calcular buchudas de ré levadas
            const buchudasDeReTaken = playerGames.filter(game => {
                const team1 = game.team1 || [];
                const team2 = game.team2 || [];
                const isTeam1 = team1.includes(playerId);
                const isTeam2 = team2.includes(playerId);
                const isLoser = (isTeam1 && game.team1_score < game.team2_score) || 
                               (isTeam2 && game.team2_score < game.team1_score);
                const isBuchudaRe = game.is_buchuda_de_re === true;
                
                return isLoser && isBuchudaRe;
            }).length;

            console.log(`Estatísticas finais para jogador ${playerId}:`, {
                totalGames,
                wins,
                losses,
                pointsGained,
                pointsLost,
                buchudas,
                buchudasTaken,
                buchudasDeRe,
                buchudasDeReTaken,
                winRate: totalGames > 0 ? (wins / totalGames) * 100 : 0
            });

            const player = communityMembers.find(member => 
                member.players && member.players.id === playerId
            )?.players;

            return {
                id: playerId,
                name: player?.name || 'Jogador Desconhecido',
                wins,
                losses,
                totalGames,
                pointsGained,
                pointsLost,
                buchudas,
                buchudasTaken,
                buchudasDeRe,
                buchudasDeReTaken,
                winRate: totalGames > 0 ? (wins / totalGames) * 100 : 0
            };
        });

        console.log('Estatísticas finais:', playerStats);

        // Ordenar por vitórias e taxa de vitória
        return playerStats.sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.winRate - a.winRate;
        });
    },

    async getTopPairs(communityId?: string): Promise<PairRanking[]> {
        try {
            console.log('RankingService: Iniciando busca de duplas...');
            const userId = (await supabase.auth.getUser()).data.user?.id;

            if (!userId) {
                console.error('RankingService: Usuário não autenticado');
                return [];
            }

            let communityIds: string[] = [];
            
            try {
                if (communityId) {
                    // Se um ID de comunidade específico foi fornecido, use apenas ele
                    communityIds = [communityId];
                } else {
                    // Caso contrário, busque todas as comunidades do usuário
                    const { data: memberCommunities, error: memberError } = await supabase
                        .from('community_members')
                        .select('community_id')
                        .eq('player_id', userId);

                    if (memberError) {
                        console.error('Erro ao buscar comunidades do membro:', memberError.message);
                    }

                    const { data: organizerCommunities, error: organizerError } = await supabase
                        .from('community_organizers')
                        .select('community_id')
                        .eq('user_id', userId);

                    if (organizerError) {
                        console.error('Erro ao buscar comunidades do organizador:', organizerError.message);
                    }

                    communityIds = [
                        ...(memberCommunities?.map(c => c.community_id) || []),
                        ...(organizerCommunities?.map(c => c.community_id) || [])
                    ];
                }

                // Se não encontrou comunidades, busque todos os jogos do usuário
                if (communityIds.length === 0) {
                    console.log('RankingService: Usuário não pertence a nenhuma comunidade, buscando todos os jogos');
                    // Continuar mesmo sem comunidades
                }
            } catch (error) {
                console.error('Erro ao buscar comunidades:', error);
                // Continuar mesmo com erro
            }

            // Buscar jogadores das comunidades
            let communityMembers = [];
            
            try {
                if (communityIds.length > 0) {
                    const { data: members, error: membersError } = await supabase
                        .from('community_members')
                        .select(`
                            player_id,
                            players (id, name)
                        `)
                        .in('community_id', communityIds);
                    
                    if (membersError) {
                        console.error('Erro ao buscar membros das comunidades:', membersError.message);
                    } else {
                        communityMembers = members || [];
                    }
                }
            } catch (error) {
                console.error('Erro ao buscar jogadores:', error);
            }
            
            if (!communityMembers || communityMembers.length === 0) {
                console.log('RankingService: Nenhum jogador encontrado');
                return [];
            }

            // Extrair IDs únicos dos jogadores
            const playerIds = [...new Set(communityMembers
                .filter(member => member.players)
                .map(member => member.players.id))];

            // Buscar todos os jogos
            let games = [];
            try {
                // Buscar todos os jogos, independente dos jogadores
                const { data: allGames, error: gamesError } = await supabase
                    .from('games')
                    .select('*')
                    .neq('status', 'pending')
                    .order('created_at', { ascending: false });

                if (gamesError) {
                    console.error('RankingService: Erro ao buscar jogos:', gamesError.message);
                } else {
                    games = allGames || [];
                    console.log(`Encontrados ${games.length} jogos no total`);
                }
            } catch (error) {
                console.error('Erro ao buscar jogos:', error);
            }
            
            if (!games || games.length === 0) {
                console.log('RankingService: Nenhum jogo encontrado');
                return [];
            }

            // Processar estatísticas por dupla
            const pairStats = new Map<string, {
                id: string;
                player1: { id: string; name: string; };
                player2: { id: string; name: string; };
                wins: number;
                losses: number;
                totalGames: number;
                pointsGained: number;
                pointsLost: number;
                buchudas: number;
                buchudasTaken: number;
                buchudasDeRe: number;
                buchudasDeReTaken: number;
            }>();

            // Processar jogos
            games.forEach(game => {
                const team1Players = game.team1 || [];
                const team2Players = game.team2 || [];

                // Verificar se os jogadores pertencem às comunidades do usuário
                const processTeam = (teamPlayers: string[]) => {
                    if (teamPlayers.length === 2 && 
                        teamPlayers.every(playerId => playerIds.includes(playerId))) {
                        const [player1Id, player2Id] = teamPlayers;
                        const player1 = communityMembers.find(m => m.players?.id === player1Id)?.players;
                        const player2 = communityMembers.find(m => m.players?.id === player2Id)?.players;

                        if (player1 && player2) {
                            const pairId = [player1Id, player2Id].sort().join('-');
                            const stats = pairStats.get(pairId) || {
                                id: pairId,
                                player1: { id: player1.id, name: player1.name },
                                player2: { id: player2.id, name: player2.name },
                                wins: 0,
                                losses: 0,
                                totalGames: 0,
                                pointsGained: 0,
                                pointsLost: 0,
                                buchudas: 0,
                                buchudasTaken: 0,
                                buchudasDeRe: 0,
                                buchudasDeReTaken: 0
                            };
                            return { pairId, stats };
                        }
                    }
                    return null;
                };

                // Processar time 1
                const team1Result = processTeam(team1Players);
                if (team1Result) {
                    const { pairId, stats } = team1Result;
                    stats.totalGames++;
                    // Calcular pontos ganhos e perdidos
                    stats.pointsGained += game.team1_score || 0;
                    stats.pointsLost += game.team2_score || 0;
                    
                    if (game.team1_score > game.team2_score) {
                        stats.wins++;
                        if (game.is_buchuda && game.team2_score === 0) {
                            stats.buchudas++;
                        }
                        if (game.is_buchuda_de_re) {
                            stats.buchudasDeRe++;
                        }
                    } else if (game.status === 'finished') {
                        stats.losses++;
                        if (game.is_buchuda && game.team1_score === 0) {
                            stats.buchudasTaken++;
                        }
                        if (game.is_buchuda_de_re) {
                            stats.buchudasDeReTaken++;
                        }
                    }
                    pairStats.set(pairId, stats);
                }

                // Processar time 2
                const team2Result = processTeam(team2Players);
                if (team2Result) {
                    const { pairId, stats } = team2Result;
                    stats.totalGames++;
                    // Calcular pontos ganhos e perdidos
                    stats.pointsGained += game.team2_score || 0;
                    stats.pointsLost += game.team1_score || 0;
                    
                    if (game.team2_score > game.team1_score) {
                        stats.wins++;
                        if (game.is_buchuda && game.team1_score === 0) {
                            stats.buchudas++;
                        }
                        if (game.is_buchuda_de_re) {
                            stats.buchudasDeRe++;
                        }
                    } else if (game.status === 'finished') {
                        stats.losses++;
                        if (game.is_buchuda && game.team2_score === 0) {
                            stats.buchudasTaken++;
                        }
                        if (game.is_buchuda_de_re) {
                            stats.buchudasDeReTaken++;
                        }
                    }
                    pairStats.set(pairId, stats);
                }
            });

            // Calcular ranking final
            const rankings = Array.from(pairStats.values())
                .filter(stats => stats.totalGames > 0)
                .map(stats => ({
                    ...stats,
                    winRate: (stats.wins / stats.totalGames) * 100
                }))
                .sort((a, b) => {
                    if (b.wins !== a.wins) return b.wins - a.wins;
                    return b.winRate - a.winRate;
                });

            console.log('RankingService: Rankings de duplas calculados:', rankings.length);
            return rankings;
        } catch (error) {
            console.error('RankingService: Erro ao buscar ranking de duplas:', error);
            throw error;
        }
    }
};

