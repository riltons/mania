import { supabase } from '@/core/lib/supabase';

// Tipagem para os dados que vêm do Supabase
interface PlayerData {
    id: string;
    name: string;
    avatar_url: string | null;
}

interface GameData {
    id: string;
    team1: string[];
    team2: string[];
    team1_score: number;
    team2_score: number;
    status: 'finished' | 'buchuda' | 'buchuda_de_re';
    community_id: string;
}

// Interfaces para as estatísticas internas
interface PlayerStats {
    id: string;
    name: string;
    avatar_url: string | null;
    wins: number;
    losses: number;
    points: number;
    buchudas: number;
}

interface PairStats {
    player1Id: string;
    player2Id: string;
    wins: number;
    losses: number;
    buchudas: number;
    buchudasTaken: number;
    buchudasDeRe: number;
    buchudasDeReTaken: number;
    pointsGained: number;
    pointsLost: number;
}

// Interfaces para o retorno do serviço (exportadas)
export interface PlayerRanking {
    id: string;
    name: string;
    avatar_url: string | null;
    wins: number;
    losses: number;
    totalGames: number;
    winRate: number;
    points: number;
    buchudas: number;
}

export interface PairRanking {
    id: string;
    player1: { id: string; name: string; avatar_url: string | null; };
    player2: { id: string; name: string; avatar_url: string | null; };
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

// Função auxiliar para buscar Ids de comunidade
const getCommunityIds = async (userId: string, communityId?: string): Promise<string[]> => {
    if (communityId) {
        return [communityId];
    }

    const { data: memberCommunities, error: memberError } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', userId);
    if (memberError) throw memberError;

    const { data: ownedCommunities, error: ownedError } = await supabase
        .from('communities')
        .select('id')
        .eq('created_by', userId);
    if (ownedError) throw ownedError;

    const memberCommunityIds = memberCommunities?.map((m: { community_id: string }) => m.community_id) || [];
    const ownedCommunityIds = ownedCommunities?.map((c: { id: string }) => c.id) || [];
    
    return [...new Set([...memberCommunityIds, ...ownedCommunityIds])];
}

const rankingService = {
    async getTopPlayers(communityId?: string): Promise<PlayerRanking[]> {
        console.log('[RankingService] Iniciando getTopPlayers, communityId:', communityId);
        
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (!userId) {
            console.error('[RankingService] Usuário não autenticado');
            return [];
        }
        console.log('[RankingService] UserId encontrado:', userId);

        let communityIds: string[] = [];
        try {
            communityIds = await getCommunityIds(userId, communityId);
            console.log('[RankingService] CommunityIds encontrados:', communityIds);
        } catch (error) {
            console.error('[RankingService] Erro ao buscar comunidades do usuário', error);
            return [];
        }

        if (communityIds.length === 0) {
            console.log('[RankingService] Nenhuma comunidade encontrada para o usuário');
            return [];
        }

        const { data: games, error: gamesError } = await supabase
            .from('games')
            .select('id, team1, team2, team1_score, team2_score, status, community_id')
            .in('community_id', communityIds)
            .in('status', ['finished', 'buchuda', 'buchuda_de_re']);

        if (gamesError) {
            console.error('[RankingService] Erro ao buscar jogos:', gamesError);
            return [];
        }
        
        console.log('[RankingService] Jogos encontrados:', games?.length || 0);
        if (!games || games.length === 0) {
            console.log('[RankingService] Nenhum jogo finalizado encontrado');
            return [];
        }

        const { data: players, error: playersError } = await supabase
            .from('players')
            .select('id, name, avatar_url')
            .eq('is_active', true);

        if (playersError) {
            console.error('[RankingService] Erro ao buscar jogadores:', playersError);
            return [];
        }
        
        console.log('[RankingService] Jogadores encontrados:', players?.length || 0);
        if (!players || players.length === 0) {
            console.log('[RankingService] Nenhum jogador ativo encontrado');
            return [];
        }

        const playerStats = new Map<string, PlayerStats>();

        // Inicializar estatísticas para todos os jogadores
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
        let processedGames = 0;
        for (const game of games) {
            const team1 = Array.isArray(game.team1) ? game.team1 : [];
            const team2 = Array.isArray(game.team2) ? game.team2 : [];
            
            if (team1.length === 0 && team2.length === 0) {
                console.log('[RankingService] Jogo sem jogadores válidos:', game.id);
                continue;
            }
            
            const allPlayersInGame = [...team1, ...team2];
            let gameProcessed = false;

            for (const playerId of allPlayersInGame) {
                if (playerStats.has(playerId)) {
                    const stats = playerStats.get(playerId)!;
                    const isTeam1 = team1.includes(playerId);

                    if (game.team1_score > game.team2_score) {
                        if (isTeam1) {
                            stats.wins++;
                            stats.points += game.team1_score;
                            if (game.status === 'buchuda' && game.team2_score === 0) stats.buchudas++;
                        } else {
                            stats.losses++;
                            stats.points += game.team2_score;
                        }
                    } else if (game.team2_score > game.team1_score) {
                        if (!isTeam1) {
                            stats.wins++;
                            stats.points += game.team2_score;
                            if (game.status === 'buchuda' && game.team1_score === 0) stats.buchudas++;
                        } else {
                            stats.losses++;
                            stats.points += game.team1_score;
                        }
                    }
                    playerStats.set(playerId, stats);
                    gameProcessed = true;
                }
            }
            
            if (gameProcessed) {
                processedGames++;
            }
        }
        
        console.log('[RankingService] Jogos processados:', processedGames);

        const rankings: PlayerRanking[] = Array.from(playerStats.values())
            .map(stats => {
                const totalGames = stats.wins + stats.losses;
                return {
                    ...stats,
                    totalGames,
                    winRate: totalGames > 0 ? (stats.wins / totalGames) * 100 : 0,
                };
            })
            .filter(p => p.wins > 0)
            .sort((a, b) => {
                if (b.wins !== a.wins) return b.wins - a.wins;
                return b.winRate - a.winRate;
            });

        console.log('[RankingService] Rankings finais gerados:', rankings.length);
        console.log('[RankingService] Top 3 jogadores:', rankings.slice(0, 3).map(p => ({ name: p.name, wins: p.wins, winRate: p.winRate })));
        
        return rankings;
    },

    async getTopPairs(communityId?: string): Promise<PairRanking[]> {
        console.log('[RankingService] Iniciando getTopPairs, communityId:', communityId);
        
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (!userId) {
            console.error('[RankingService] Usuário não autenticado');
            return [];
        }
        console.log('[RankingService] UserId encontrado:', userId);

        let communityIds: string[] = [];
        try {
            communityIds = await getCommunityIds(userId, communityId);
            console.log('[RankingService] CommunityIds encontrados:', communityIds);
        } catch (error) {
            console.error('[RankingService] Erro ao buscar comunidades do usuário', error);
            return [];
        }

        if (communityIds.length === 0) {
            console.log('[RankingService] Nenhuma comunidade encontrada para o usuário');
            return [];
        }

        const { data: players, error: playersError } = await supabase
            .from('players')
            .select('id, name, avatar_url')
            .eq('is_active', true);

        if (playersError) {
            console.error('[RankingService] Erro ao buscar jogadores:', playersError);
            return [];
        }
        
        console.log('[RankingService] Jogadores encontrados:', players?.length || 0);
        if (!players || players.length === 0) {
            console.log('[RankingService] Nenhum jogador ativo encontrado');
            return [];
        }

        const playersMap = new Map<string, PlayerData>(players.map((p: PlayerData) => [p.id, p]));

        const { data: games, error: gamesError } = await supabase
            .from('games')
            .select('id, team1, team2, team1_score, team2_score, status, community_id')
            .in('community_id', communityIds)
            .in('status', ['finished', 'buchuda', 'buchuda_de_re']);

        if (gamesError) {
            console.error('[RankingService] Erro ao buscar jogos:', gamesError);
            return [];
        }
        
        console.log('[RankingService] Jogos encontrados:', games?.length || 0);
        if (!games || games.length === 0) {
            console.log('[RankingService] Nenhum jogo finalizado encontrado');
            return [];
        }

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
        
        console.log('[RankingService] Jogos de dupla processados:', processedPairGames);
        console.log('[RankingService] Duplas únicas encontradas:', pairStats.size);

        const rankings: PairRanking[] = [];
        for (const [key, stats] of pairStats.entries()) {
            const player1 = playersMap.get(stats.player1Id);
            const player2 = playersMap.get(stats.player2Id);

            if (!player1 || !player2) {
                console.log('[RankingService] Jogadores não encontrados para dupla:', key);
                continue;
            }
            
            if (stats.wins === 0) {
                continue; // Filtrar duplas sem vitórias
            }

            const totalGames = stats.wins + stats.losses;
            const winRate = totalGames > 0 ? (stats.wins / totalGames) * 100 : 0;

            rankings.push({
                id: key,
                player1: { id: player1.id, name: player1.name, avatar_url: player1.avatar_url },
                player2: { id: player2.id, name: player2.name, avatar_url: player2.avatar_url },
                wins: stats.wins,
                losses: stats.losses,
                totalGames: totalGames,
                winRate: winRate,
                buchudas: stats.buchudas,
                buchudasTaken: stats.buchudasTaken,
                buchudasDeRe: stats.buchudasDeRe,
                buchudasDeReTaken: stats.buchudasDeReTaken,
                pointsGained: stats.pointsGained,
                pointsLost: stats.pointsLost,
            });
        }
        
        const sortedRankings = rankings.sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.winRate - a.winRate;
        });
        
        console.log('[RankingService] Rankings de duplas finais gerados:', sortedRankings.length);
        console.log('[RankingService] Top 3 duplas:', sortedRankings.slice(0, 3).map(p => ({ 
            players: `${p.player1.name} & ${p.player2.name}`, 
            wins: p.wins, 
            winRate: p.winRate 
        })));
        
        return sortedRankings;
    },
};

export default rankingService;
