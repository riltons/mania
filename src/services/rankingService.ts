import { supabase } from '@/core/lib/supabase';
import { Database } from '@/types/database.types';
import { PostgrestError } from '@supabase/supabase-js';

type QueryResult<T> = {
  data: T | null;
  error: PostgrestError | null;
};

// Tipos do banco de dados
type Player = Database['public']['Tables']['players']['Row'];
type Game = Database['public']['Tables']['games']['Row'];
type CommunityMember = Database['public']['Tables']['community_members']['Row'];

// Tipos auxiliares para o ranking
type GameStatus = 'scheduled' | 'in_progress' | 'finished' | 'buchuda' | 'buchuda_de_re';

// Interface para o ranking de jogadores
export interface PlayerRanking {
    id: string;
    name: string;
    nickname?: string | null;
    games: number;
    wins: number;
    losses: number;
    goalsScored: number;
    goalsConceded: number;
    winRate: number;
    buchudas: number;
    buchudasTaken: number;
    buchudasDeRe: number;
    buchudasDeReTaken: number;
    pointsGained: number;
    pointsLost: number;
    totalGames: number;
}

// Interface para o ranking de duplas
export interface PairRanking {
    id: string;
    player1: {
        id: string;
        name: string;
        nickname?: string | null;
    };
    player2: {
        id: string;
        name: string;
        nickname?: string | null;
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

// Interface para estatísticas de jogador
interface PlayerStats {
    id: string;
    name: string;
    nickname: string | null;
    games: number;
    wins: number;
    losses: number;
    goalsScored: number;
    goalsConceded: number;
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
        
        try {
            const playerIds = new Set<string>();
            
            // Se um ID de comunidade foi fornecido, buscar apenas os jogadores daquela comunidade
            if (communityId) {
                console.log('RankingService: Buscando jogadores da comunidade', communityId);
                
                const { data: communityMembers, error: membersError } = await supabase
                    .from('community_members')
                    .select('player_id')
                    .eq('community_id', communityId);

                if (membersError) {
                    console.error('Erro ao buscar membros da comunidade:', membersError);
                    return [];
                }

                if (communityMembers) {
                    communityMembers.forEach((member) => {
                        if (member?.player_id) {
                            playerIds.add(member.player_id);
                        }
                    });
                }
            } else {
                console.log('RankingService: Buscando todos os jogadores...');
                // Se não foi fornecida uma comunidade, buscar todos os jogadores
                const { data: allPlayers, error: playersError } = await supabase
                    .from('players')
                    .select('*')
                    .not('id', 'is', null);
                
                if (playersError) {
                    console.error('Erro ao buscar jogadores:', playersError);
                    return [];
                }
                
                if (allPlayers) {
                    allPlayers.forEach((player) => {
                        if (player?.id) {
                            playerIds.add(player.id);
                        }
                    });
                }
            }
            
            if (playerIds.size === 0) {
                console.log('Nenhum jogador encontrado para buscar estatísticas');
                return [];
            }
            
            // Buscar todos os jogos relevantes
            const gameStatuses: GameStatus[] = ['finished', 'buchuda', 'buchuda_de_re'];
            const { data: gamesData, error: gamesError } = await supabase
                .from('games')
                .select('*')
                .in('status', gameStatuses);

            if (gamesError) {
                console.error('Erro ao buscar jogos:', gamesError);
                return [];
            }

            const safeGames = gamesData || [];
            console.log('Jogos encontrados:', safeGames.length);
            
            // Buscar informações dos jogadores em lotes
            const playerIdsArray = Array.from(playerIds);
            const batchSize = 100;
            let playersData: Player[] = [];
            
            for (let i = 0; i < playerIdsArray.length; i += batchSize) {
                const batch = playerIdsArray.slice(i, i + batchSize);
                const { data: batchData, error: batchError } = await supabase
                    .from('players')
                    .select('*')
                    .in('id', batch);
                    
                if (batchError) {
                    console.error('Erro ao buscar lote de jogadores:', batchError);
                    continue;
                }
                
                if (batchData) {
                    playersData = [...playersData, ...batchData];
                }
            }
            
            // Inicializar estatísticas dos jogadores
            const playerStats = new Map<string, PlayerStats>();
            
            playersData.forEach(player => {
                if (player?.id) {
                    playerStats.set(player.id, {
                        id: player.id,
                        name: player.name || 'Jogador sem nome',
                        nickname: player.nickname || null,
                        games: 0,
                        wins: 0,
                        losses: 0,
                        goalsScored: 0,
                        goalsConceded: 0,
                        pointsGained: 0,
                        pointsLost: 0,
                        buchudas: 0,
                        buchudasTaken: 0,
                        buchudasDeRe: 0,
                        buchudasDeReTaken: 0,
                        winRate: 0
                    });
                }
            });
            
            // Processar jogos para calcular estatísticas
            safeGames.forEach(game => {
                const team1 = Array.isArray(game.team1) ? game.team1 : [];
                const team2 = Array.isArray(game.team2) ? game.team2 : [];
                
                const team1Score = Number(game.team1_score) || 0;
                const team2Score = Number(game.team2_score) || 0;
                const isBuchuda = game.status === 'buchuda';
                const isBuchudaDeRe = game.status === 'buchuda_de_re';
                
                // Atualizar estatísticas para cada jogador no time 1
                team1.forEach((playerId: string) => {
                    const stats = playerStats.get(playerId);
                    if (stats) {
                        stats.games++;
                        stats.goalsScored += team1Score;
                        stats.goalsConceded += team2Score;
                        stats.pointsGained += team1Score;
                        stats.pointsLost += team2Score;
                        
                        if (team1Score > team2Score) {
                            stats.wins++;
                            if (isBuchuda && team2Score === 0) stats.buchudas++;
                            if (isBuchudaDeRe) stats.buchudasDeRe++;
                        } else {
                            stats.losses++;
                            if (isBuchuda && team1Score === 0) stats.buchudasTaken++;
                            if (isBuchudaDeRe) stats.buchudasDeReTaken++;
                        }
                        
                        stats.winRate = stats.games > 0 ? (stats.wins / stats.games) * 100 : 0;
                    }
                });
                
                // Atualizar estatísticas para cada jogador no time 2
                team2.forEach((playerId: string) => {
                    const stats = playerStats.get(playerId);
                    if (stats) {
                        stats.games++;
                        stats.goalsScored += team2Score;
                        stats.goalsConceded += team1Score;
                        stats.pointsGained += team2Score;
                        stats.pointsLost += team1Score;
                        
                        if (team2Score > team1Score) {
                            stats.wins++;
                            if (isBuchuda && team1Score === 0) stats.buchudas++;
                            if (isBuchudaDeRe) stats.buchudasDeRe++;
                        } else {
                            stats.losses++;
                            if (isBuchuda && team2Score === 0) stats.buchudasTaken++;
                            if (isBuchudaDeRe) stats.buchudasDeReTaken++;
                        }
                        
                        stats.winRate = stats.games > 0 ? (stats.wins / stats.games) * 100 : 0;
                    }
                });
            });
            
            // Converter para array, filtrar jogadores com pelo menos 1 jogo e ordenar por vitórias
            const rankings = Array.from(playerStats.values())
                .filter(stats => stats.games > 0) // Filtra apenas jogadores que jogaram pelo menos uma vez
                .map(stats => ({
                    id: stats.id,
                    name: stats.name,
                    nickname: stats.nickname,
                    games: stats.games,
                    wins: stats.wins,
                    losses: stats.losses,
                    goalsScored: stats.goalsScored,
                    goalsConceded: stats.goalsConceded,
                    winRate: stats.winRate,
                    buchudas: stats.buchudas,
                    buchudasTaken: stats.buchudasTaken,
                    buchudasDeRe: stats.buchudasDeRe,
                    buchudasDeReTaken: stats.buchudasDeReTaken,
                    pointsGained: stats.pointsGained,
                    pointsLost: stats.pointsLost,
                    totalGames: stats.games
                }));
            
            // Ordena por número de vitórias (do maior para o menor)
            return rankings.sort((a, b) => b.wins - a.wins);
            
        } catch (error) {
            console.error('Erro inesperado ao buscar ranking de jogadores:', error);
            return [];
        }
    },
    
    async getTopPairs(communityId?: string): Promise<PairRanking[]> {
        console.log('RankingService: Iniciando busca de duplas...');
        
        try {
            // Primeiro, obtemos todos os jogadores da comunidade (ou todos, se não houver comunidade)
            const playerIds = new Set<string>();
            
            if (communityId) {
                console.log('RankingService: Buscando jogadores da comunidade', communityId);
                
                const { data: communityMembers, error: membersError } = await supabase
                    .from('community_members')
                    .select('player_id')
                    .eq('community_id', communityId);

                if (membersError) {
                    console.error('Erro ao buscar membros da comunidade:', membersError);
                    return [];
                }

                if (communityMembers) {
                    communityMembers.forEach((member) => {
                        if (member?.player_id) {
                            playerIds.add(member.player_id);
                        }
                    });
                }
            } else {
                console.log('RankingService: Buscando todos os jogadores...');
                const { data: allPlayers, error: playersError } = await supabase
                    .from('players')
                    .select('*')
                    .not('id', 'is', null);
                
                if (playersError) {
                    console.error('Erro ao buscar jogadores:', playersError);
                    return [];
                }
                
                if (allPlayers) {
                    allPlayers.forEach((player) => {
                        if (player?.id) {
                            playerIds.add(player.id);
                        }
                    });
                }
            }
            
            if (playerIds.size === 0) {
                console.log('Nenhum jogador encontrado para buscar estatísticas de duplas');
                return [];
            }
            
            // Buscar todos os jogos relevantes
            const gameStatuses: GameStatus[] = ['finished', 'buchuda', 'buchuda_de_re'];
            const { data: gamesData, error: gamesError } = await supabase
                .from('games')
                .select('*')
                .in('status', gameStatuses);

            if (gamesError) {
                console.error('Erro ao buscar jogos:', gamesError);
                return [];
            }

            const safeGames = gamesData || [];
            console.log('Jogos encontrados para análise de duplas:', safeGames.length);
            
            // Buscar informações dos jogadores em lotes
            const playerIdsArray = Array.from(playerIds);
            const batchSize = 100;
            let playersData: Player[] = [];
            
            for (let i = 0; i < playerIdsArray.length; i += batchSize) {
                const batch = playerIdsArray.slice(i, i + batchSize);
                const { data: batchData, error: batchError } = await supabase
                    .from('players')
                    .select('*')
                    .in('id', batch);
                    
                if (batchError) {
                    console.error('Erro ao buscar lote de jogadores:', batchError);
                    continue;
                }
                
                if (batchData) {
                    playersData = [...playersData, ...batchData];
                }
            }
            
            // Criar um mapa de jogadores para acesso rápido
            const playersMap = new Map<string, { id: string; name: string; nickname: string | null }>();
            playersData.forEach(player => {
                if (player?.id) {
                    playersMap.set(player.id, {
                        id: player.id,
                        name: player.name || 'Jogador sem nome',
                        nickname: player.nickname || null
                    });
                }
            });
            
            // Mapa para armazenar as estatísticas das duplas
            // A chave é uma string única que representa a dupla (IDs ordenados)
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
                games: Set<string>; // IDs dos jogos para evitar duplicatas
            }>();
            
            // Função auxiliar para gerar chave única para a dupla
            const getPairKey = (id1: string, id2: string) => {
                return [id1, id2].sort().join('_');
            };
            
            // Processar cada jogo
            safeGames.forEach(game => {
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
                        const stats = pairStats.get(pairKey) || {
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
                            
                            pairStats.set(pairKey, stats);
                        }
                    }
                    
                    // Processar time 2
                    const [p3, p4] = team2;
                    if (p3 && p4 && playersMap.has(p3) && playersMap.has(p4)) {
                        const pairKey = getPairKey(p3, p4);
                        const stats = pairStats.get(pairKey) || {
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
                            
                            pairStats.set(pairKey, stats);
                        }
                    }
                }
            });
            
            // Converter para array e mapear para o formato de saída
            const rankings: PairRanking[] = [];
            
            pairStats.forEach((stats, pairKey) => {
                const player1 = playersMap.get(stats.player1Id);
                const player2 = playersMap.get(stats.player2Id);
                
                if (player1 && player2) {
                    const totalGames = stats.wins + stats.losses;
                    const winRate = totalGames > 0 ? (stats.wins / totalGames) * 100 : 0;
                    
                    rankings.push({
                        id: pairKey,
                        player1: {
                            id: player1.id,
                            name: player1.name,
                            nickname: player1.nickname
                        },
                        player2: {
                            id: player2.id,
                            name: player2.name,
                            nickname: player2.nickname
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
                        winRate: parseFloat(winRate.toFixed(2))
                    });
                }
            });
            
            // Ordenar por vitórias (e depois por menos derrotas em caso de empate)
            return rankings.sort((a, b) => {
                if (b.wins !== a.wins) {
                    return b.wins - a.wins;
                }
                return a.losses - b.losses;
            });
            
        } catch (error) {
            console.error('Erro inesperado ao buscar ranking de duplas:', error);
            return [];
        }
    }
};

export default rankingService;
