import { supabase } from '@/core/lib/supabase';

// Definir tipos de dados
type Player = {
    id: string;
    name: string;
};

type CommunityMember = {
    player_id: string;
    players: Player | null;
};

type CommunityMemberWithPlayer = CommunityMember & {
    players: Player;
};

type SupabaseGame = {
    id: string;
    team1: string[];
    team2: string[];
    team1_score: number | null;
    team2_score: number | null;
    status: string;
    is_buchuda: boolean | null;
    is_buchuda_de_re: boolean | null;
    created_at: string;
};

type Game = {
    id: string;
    team1: string[];
    team2: string[];
    team1_score: number;
    team2_score: number;
    status: string;
    is_buchuda: boolean;
    is_buchuda_de_re: boolean;
    created_at: string;
};

export interface PlayerRanking {
    id: string;
    name: string;
    avatar_url?: string | null;
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
        avatar_url?: string | null;
    };
    player2: {
        id: string;
        name: string;
        avatar_url?: string | null;
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
                communityIds = [communityId];
            } else {
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

            if (communityIds.length === 0) {
                console.log('RankingService: Usuário não pertence a nenhuma comunidade, buscando todos os jogos');
            }
        } catch (error) {
            console.error('Erro ao buscar comunidades:', error);
        }

        // Buscar jogadores das comunidades
        const communityMembers: CommunityMember[] = [];
        
        try {
            if (communityIds.length > 0) {
                const { data: members, error: membersError } = await supabase
                    .from('community_members')
                    .select('player_id, players!inner(id, name, avatar_url, is_active)')
                    .in('community_id', communityIds)
                    .eq('players.is_active', true);
                
                if (membersError) {
                    console.error('Erro ao buscar membros das comunidades:', membersError.message);
                } else if (members) {
                    communityMembers.push(...(members as CommunityMember[]));
                }
            }
            
            if (communityMembers.length === 0) {
                console.log('RankingService: Buscando todos os jogadores...');
                const { data: allPlayers, error: playersError } = await supabase
                    .from('players')
                    .select('id, name, avatar_url, is_active')
                    .eq('is_active', true);
                
                if (playersError) {
                    console.error('Erro ao buscar todos os jogadores:', playersError.message);
                } else if (allPlayers) {
                    allPlayers.forEach(player => {
                        communityMembers.push({
                            player_id: player.id,
                            players: player
                        });
                    });
                }
            }
        } catch (error) {
            console.error('Erro ao buscar jogadores:', error);
        }
        
        if (communityMembers.length === 0) {
            console.log('RankingService: Nenhum jogador encontrado');
            return [];
        }

        // Extrair IDs únicos dos jogadores
        const playerIds = [...new Set(
            communityMembers
                .filter((member): member is CommunityMemberWithPlayer => 
                    member.players !== null && member.players.id !== undefined
                )
                .map(member => member.players.id)
        )];

        // Buscar estatísticas dos jogadores
        console.log('PlayerIds para busca:', playerIds);
        
        // Buscar todos os jogos finalizados
        const { data: gamesData, error: gamesError } = await supabase
            .from('games')
            .select('*')
            .eq('status', 'finished');

        if (gamesError) {
            console.error('Erro ao buscar jogos:', gamesError);
            return [];
        }

        // Converter os dados para o tipo Game com validação
        const safeGames: Game[] = [];
        
        if (gamesData && Array.isArray(gamesData)) {
            for (const game of gamesData) {
                try {
                    // Garantir que os times sejam arrays de strings
                    const team1 = Array.isArray(game.team1) 
                        ? game.team1.map(id => String(id)).filter(Boolean)
                        : [];
                        
                    const team2 = Array.isArray(game.team2) 
                        ? game.team2.map(id => String(id)).filter(Boolean)
                        : [];
                    
                    // Garantir que as rodadas tenham o formato correto
                    const rounds: GameRound[] = Array.isArray(game.rounds) 
                        ? game.rounds.map((round: any) => ({
                            type: round.type || 'simple',
                            winner_team: round.winner_team || null,
                            has_bonus: Boolean(round.has_bonus)
                        }))
                        : [];
                    
                    // Criar objeto de jogo seguro
                    const safeGame: Game = {
                        id: String(game.id || ''),
                        competition_id: game.competition_id || '',
                        team1,
                        team2,
                        status: 'finished', // Já filtramos por jogos finalizados
                        team1_score: Number(game.team1_score) || 0,
                        team2_score: Number(game.team2_score) || 0,
                        created_at: game.created_at || new Date().toISOString(),
                        rounds,
                        last_round_was_tie: Boolean(game.last_round_was_tie),
                        team1_was_losing_5_0: Boolean(game.team1_was_losing_5_0),
                        team2_was_losing_5_0: Boolean(game.team2_was_losing_5_0),
                        is_buchuda: Boolean(game.is_buchuda),
                        is_buchuda_de_re: Boolean(game.is_buchuda_de_re)
                    };
                    
                    safeGames.push(safeGame);
                } catch (error) {
                    console.error('Erro ao processar jogo:', error, game);
                    continue;
                }
            }
        }

        // Calcular estatísticas para cada jogador
        const playerStats = playerIds.map(playerId => {
            const playerGames = safeGames.filter(game => 
                game.team1.includes(playerId) || game.team2.includes(playerId)
            );

            // Calcular vitórias, derrotas e pontos
            let wins = 0;
            let losses = 0;
            let pointsGained = 0;
            let pointsLost = 0;
            
            playerGames.forEach(game => {
                const isTeam1 = game.team1.includes(playerId);
                const isTeam2 = game.team2.includes(playerId);
                const isWinner = (isTeam1 && game.team1_score > game.team2_score) || 
                                (isTeam2 && game.team2_score > game.team1_score);
                
                // Calcular pontos ganhos e perdidos
                if (isTeam1) {
                    pointsGained += game.team1_score;
                    pointsLost += game.team2_score;
                } else if (isTeam2) {
                    pointsGained += game.team2_score;
                    pointsLost += game.team1_score;
                }
                
                // Contabilizar vitórias e derrotas
                if (isWinner) {
                    wins++;
                } else if (game.status === 'finished') {
                    losses++;
                }
            });
            
            const totalGames = playerGames.length;

            // Calcular buchudas dadas
            const buchudas = playerGames.filter(game => {
                const isTeam1 = game.team1.includes(playerId);
                const isTeam2 = game.team2.includes(playerId);
                const isWinner = (isTeam1 && game.team1_score > game.team2_score) || 
                                (isTeam2 && game.team2_score > game.team1_score);
                const isBuchuda = game.is_buchuda && 
                                ((isTeam1 && game.team2_score === 0) || 
                                 (isTeam2 && game.team1_score === 0));
                
                return isWinner && isBuchuda;
            }).length;
            
            // Calcular buchudas levadas
            const buchudasTaken = playerGames.filter(game => {
                const isTeam1 = game.team1.includes(playerId);
                const isTeam2 = game.team2.includes(playerId);
                const isLoser = (isTeam1 && game.team1_score < game.team2_score) || 
                               (isTeam2 && game.team2_score < game.team1_score);
                
                return isLoser && game.is_buchuda;
            }).length;
            
            // Calcular buchudas de ré dadas
            const buchudasDeRe = playerGames.filter(game => {
                const isTeam1 = game.team1.includes(playerId);
                const isTeam2 = game.team2.includes(playerId);
                const isWinner = (isTeam1 && game.team1_score > game.team2_score) || 
                                (isTeam2 && game.team2_score > game.team1_score);
                
                return isWinner && game.is_buchuda_de_re;
            }).length;
            
            // Calcular buchudas de ré levadas
            const buchudasDeReTaken = playerGames.filter(game => {
                const isTeam1 = game.team1.includes(playerId);
                const isTeam2 = game.team2.includes(playerId);
                const isLoser = (isTeam1 && game.team1_score < game.team2_score) || 
                               (isTeam2 && game.team2_score < game.team1_score);
                
                return isLoser && game.is_buchuda_de_re;
            }).length;

            const player = communityMembers.find(m => 
                m.players && m.players.id === playerId
            )?.players;

            return {
                id: playerId,
                name: player?.name || 'Jogador Desconhecido',
                avatar_url: (player as any)?.avatar_url || null,
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

        // Filtrar jogadores com pelo menos 1 vitória e ordenar de acordo com os critérios especificados
        return playerStats
            .filter(player => player.wins > 0)
            .sort((a, b) => {
                // 1. Maior Número de vitórias
                if (b.wins !== a.wins) return b.wins - a.wins;
                
                // 2. Menor número de derrotas
                if (a.losses !== b.losses) return a.losses - b.losses;
                
                // 3. Menor número de jogos
                if (a.totalGames !== b.totalGames) return a.totalGames - b.totalGames;
                
                // 4. Maior quantidade de pontos ganhos
                if (b.pointsGained !== a.pointsGained) return b.pointsGained - a.pointsGained;
                
                // 5. Menor quantidade de pontos perdidos
                if (a.pointsLost !== b.pointsLost) return a.pointsLost - b.pointsLost;
                
                // 6. Melhor taxa de vitória
                if (b.winRate !== a.winRate) return b.winRate - a.winRate;
                
                // 7. Maior número de buchudas dadas
                if (b.buchudas !== a.buchudas) return b.buchudas - a.buchudas;
                
                // 8. Menor número de buchudas levadas
                if (a.buchudasTaken !== b.buchudasTaken) return a.buchudasTaken - b.buchudasTaken;
                
                // 9. Maior número de buchudas de ré dadas
                if (b.buchudasDeRe !== a.buchudasDeRe) return b.buchudasDeRe - a.buchudasDeRe;
                
                // 10. Menor número de buchudas de ré levadas
                return a.buchudasDeReTaken - b.buchudasDeReTaken;
            });
    },

    async getTopPairs(communityId?: string): Promise<PairRanking[]> {
        console.log('RankingService: Iniciando busca de duplas...');
        const userId = (await supabase.auth.getUser()).data.user?.id;

        if (!userId) {
            console.error('RankingService: Usuário não autenticado');
            return [];
        }

        // Primeiro, obter todos os jogadores ativos
        const { data: players, error: playersError } = await supabase
            .from('players')
            .select('id, name, avatar_url, is_active')
            .eq('is_active', true);

        if (playersError || !players) {
            console.error('Erro ao buscar jogadores:', playersError?.message);
            return [];
        }

        // Obter todos os jogos finalizados
        const { data: games, error: gamesError } = await supabase
            .from('games')
            .select('*')
            .eq('status', 'finished');

        if (gamesError || !games) {
            console.error('Erro ao buscar jogos:', gamesError?.message);
            return [];
        }

        // Criar um mapa de jogadores para acesso rápido
        const playersMap = new Map(players.map(p => [p.id, p]));
        
        // Mapa para armazenar estatísticas das duplas
        const pairStats = new Map<string, {
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
            games: number;
        }>();

        // Função para obter a chave única de uma dupla (ordena os IDs para evitar duplicatas)
        const getPairKey = (id1: string, id2: string) => {
            return [id1, id2].sort().join('_');
        };

        // Processar cada jogo
        for (const game of games as Game[]) {
            const team1 = game.team1 || [];
            const team2 = game.team2 || [];
            
            // Ignorar jogos sem times válidos
            if (team1.length < 2 || team2.length < 2) continue;
            
            const team1Score = game.team1_score || 0;
            const team2Score = game.team2_score || 0;
            
            // Processar time 1
            const pair1Key = getPairKey(team1[0], team1[1]);
            let pair1Stats = pairStats.get(pair1Key);
            
            if (!pair1Stats) {
                pair1Stats = {
                    player1Id: team1[0],
                    player2Id: team1[1],
                    wins: 0,
                    losses: 0,
                    pointsGained: 0,
                    pointsLost: 0,
                    buchudas: 0,
                    buchudasTaken: 0,
                    buchudasDeRe: 0,
                    buchudasDeReTaken: 0,
                    games: 0
                };
                pairStats.set(pair1Key, pair1Stats);
            }
            
            pair1Stats.pointsGained += team1Score;
            pair1Stats.pointsLost += team2Score;
            pair1Stats.games++;
            
            if (team1Score > team2Score) {
                pair1Stats.wins++;
                if (team2Score === 0) pair1Stats.buchudas++;
                if (game.is_buchuda_de_re) pair1Stats.buchudasDeRe++;
            } else {
                pair1Stats.losses++;
                if (game.is_buchuda) pair1Stats.buchudasTaken++;
                if (game.is_buchuda_de_re) pair1Stats.buchudasDeReTaken++;
            }
            
            // Processar time 2
            const pair2Key = getPairKey(team2[0], team2[1]);
            let pair2Stats = pairStats.get(pair2Key);
            
            if (!pair2Stats) {
                pair2Stats = {
                    player1Id: team2[0],
                    player2Id: team2[1],
                    wins: 0,
                    losses: 0,
                    pointsGained: 0,
                    pointsLost: 0,
                    buchudas: 0,
                    buchudasTaken: 0,
                    buchudasDeRe: 0,
                    buchudasDeReTaken: 0,
                    games: 0
                };
                pairStats.set(pair2Key, pair2Stats);
            }
            
            pair2Stats.pointsGained += team2Score;
            pair2Stats.pointsLost += team1Score;
            pair2Stats.games++;
            
            if (team2Score > team1Score) {
                pair2Stats.wins++;
                if (team1Score === 0) pair2Stats.buchudas++;
                if (game.is_buchuda_de_re) pair2Stats.buchudasDeRe++;
            } else {
                pair2Stats.losses++;
                if (game.is_buchuda) pair2Stats.buchudasTaken++;
                if (game.is_buchuda_de_re) pair2Stats.buchudasDeReTaken++;
            }
        }
        
        // Converter para array e mapear para o formato de retorno
        const rankings: PairRanking[] = [];
        
        for (const [_, stats] of pairStats.entries()) {
            const player1 = playersMap.get(stats.player1Id);
            const player2 = playersMap.get(stats.player2Id);
            
            // Pular se algum jogador não for encontrado
            if (!player1 || !player2) continue;
            
            // Pular duplas sem vitórias
            if (stats.wins === 0) continue;
            
            const totalGames = stats.wins + stats.losses;
            
            rankings.push({
                id: `${stats.player1Id}_${stats.player2Id}`,
                player1: {
                    id: player1.id,
                    name: player1.name,
                    avatar_url: (player1 as any).avatar_url || null
                },
                player2: {
                    id: player2.id,
                    name: player2.name,
                    avatar_url: (player2 as any).avatar_url || null
                },
                wins: stats.wins,
                losses: stats.losses,
                totalGames,
                pointsGained: stats.pointsGained,
                pointsLost: stats.pointsLost,
                buchudas: stats.buchudas,
                buchudasTaken: stats.buchudasTaken,
                buchudasDeRe: stats.buchudasDeRe,
                buchudasDeReTaken: stats.buchudasDeReTaken,
                winRate: totalGames > 0 ? (stats.wins / totalGames) * 100 : 0
            });
        }
        
        // Ordenar de acordo com os critérios especificados
        return rankings.sort((a, b) => {
            // 1. Maior Número de vitórias
            if (b.wins !== a.wins) return b.wins - a.wins;
            
            // 2. Menor número de derrotas
            if (a.losses !== b.losses) return a.losses - b.losses;
            
            // 3. Menor número de jogos
            if (a.totalGames !== b.totalGames) return a.totalGames - b.totalGames;
            
            // 4. Maior quantidade de pontos ganhos
            if (b.pointsGained !== a.pointsGained) return b.pointsGained - a.pointsGained;
            
            // 5. Menor quantidade de pontos perdidos
            if (a.pointsLost !== b.pointsLost) return a.pointsLost - b.pointsLost;
            
            // 6. Melhor taxa de vitória
            if (b.winRate !== a.winRate) return b.winRate - a.winRate;
            
            // 7. Maior número de buchudas dadas
            if (b.buchudas !== a.buchudas) return b.buchudas - a.buchudas;
            
            // 8. Menor número de buchudas levadas
            if (a.buchudasTaken !== b.buchudasTaken) return a.buchudasTaken - b.buchudasTaken;
            
            // 9. Maior número de buchudas de ré dadas
            if (b.buchudasDeRe !== a.buchudasDeRe) return b.buchudasDeRe - a.buchudasDeRe;
            
            // 10. Menor número de buchudas de ré levadas
            return a.buchudasDeReTaken - b.buchudasDeReTaken;
        });
    }
};
