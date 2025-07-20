import { supabase } from '@/core/lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';
import {
  convertArrayToType,
  convertToType,
  safeArray,
  safeGet,
  toGames,
  toPlayers,
  SupabaseQueryResult,
  SupabaseArrayQueryResult
} from '@/core/types/supabase-helpers';

type QueryResult<T> = {
  data: T | null;
  error: PostgrestError | null;
};

// Tipos do banco de dados
type Player = {
    id: string;
    name: string;
    nickname: string | null;
    avatar_url?: string | null;
};

type Game = {
    id: string;
    team1: string[];
    team2: string[];
    team1_score: number;
    team2_score: number;
    status: string;
};

type CommunityMember = {
    community_id: string;
    player_id: string;
};

// Tipos auxiliares para o ranking
type GameStatus = 'scheduled' | 'in_progress' | 'finished' | 'buchuda' | 'buchuda_de_re';

// Interface para o ranking de jogadores
export interface PlayerRanking {
    id: string;
    name: string;
    nickname?: string | null;
    avatar_url?: string | null;
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
        avatar_url?: string | null;
    };
    player2: {
        id: string;
        name: string;
        nickname?: string | null;
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

// Interface para estatísticas de jogador
interface PlayerStats {
    id: string;
    name: string;
    nickname: string | null;
    avatar_url?: string | null;
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
        console.log('RankingService: Iniciando busca de ranking de jogadores...');
        
        try {
            // Primeiro, obtemos todos os jogadores da comunidade (ou todos, se não houver comunidade)
            let playerQuery = supabase.from('players').select('*' as any);
            
            // Se houver um ID de comunidade, filtrar jogadores dessa comunidade
            if (communityId) {
                // Buscar os IDs dos jogadores da comunidade
                console.log('Buscando jogadores da comunidade:', communityId);
                const { data: communityMembersData, error: membersError } = await supabase
                    .from('community_members')
                    .select('player_id')
                    .eq('community_id' as any, communityId as any);

                if (membersError) {
                    console.error('Erro ao buscar membros da comunidade:', membersError);
                    return [];
                }

                const communityMembers = safeArray(communityMembersData);
                if (communityMembers.length === 0) {
                    console.log('Nenhum jogador encontrado na comunidade');
                    return [];
                }

                // Extrair IDs dos jogadores de forma segura
                const playerIds: string[] = [];
                communityMembers.forEach((member: any) => {
                    if (member && typeof member === 'object' && 'player_id' in member) {
                        const playerId = member.player_id;
                        if (typeof playerId === 'string' && playerId) {
                            playerIds.push(playerId);
                        }
                    }
                });
                
                if (playerIds.length === 0) {
                    return [];
                }
                
                // Filtrar por esses IDs
                playerQuery = playerQuery.in('id' as any, playerIds as any);
            }
            
            // Se não foi fornecida uma comunidade, buscar todos os jogadores
            // Criar um Set para armazenar os IDs dos jogadores
            const playerIds = new Set<string>();
            
            const { data: allPlayers, error: playersError } = await playerQuery.not('id', 'is', null);
            
            if (playersError) {
                console.error('Erro ao buscar jogadores:', playersError);
                return [];
            }
            
            const safeAllPlayers = safeArray(allPlayers);
            safeAllPlayers.forEach((player: any) => {
                const id = safeGet(player, 'id');
                if (typeof id === 'string' && id) {
                    playerIds.add(id);
                }
            });
            
            if (playerIds.size === 0) {
                console.log('Nenhum jogador encontrado para buscar estatísticas');
                return [];
            }
            
            // Buscar todos os jogos relevantes com os campos necessários
            const { data: gamesData, error: gamesError } = await supabase
                .from('games')
                .select('*')
                .in('status', ['finished']); // Ajustado para usar apenas status válidos da interface

            if (gamesError) {
                console.error('Erro ao buscar jogos:', gamesError);
                return [];
            }

            // Usar a função auxiliar para converter os dados para o tipo Game
            const safeGames: Game[] = [];
            
            if (gamesData && Array.isArray(gamesData)) {
                for (const game of gamesData) {
                    try {
                        // Converter times para array de strings
                        const team1 = safeArray(game.team1).map(String).filter(Boolean);
                        const team2 = safeArray(game.team2).map(String).filter(Boolean);
                        
                        // Criar objeto de jogo seguro
                        const safeGame: Game = {
                            id: String(safeGet(game, 'id') || ''),
                            competition_id: safeGet(game, 'competition_id') || null,
                            team1,
                            team2,
                            team1_score: Number(safeGet(game, 'team1_score') || 0),
                            team2_score: Number(safeGet(game, 'team2_score') || 0),
                            status: 'finished', // Definido como 'finished' pois filtramos por este status
                            created_at: String(safeGet(game, 'created_at') || new Date().toISOString()),
                            rounds: safeArray(game.rounds).map(round => ({
                                type: safeGet(round, 'type', 'simple') as VictoryType,
                                winner_team: safeGet(round, 'winner_team', null) as 1 | 2 | null,
                                has_bonus: Boolean(safeGet(round, 'has_bonus', false))
                            })),
                            last_round_was_tie: Boolean(safeGet(game, 'last_round_was_tie', false)),
                            team1_was_losing_5_0: Boolean(safeGet(game, 'team1_was_losing_5_0', false)),
                            team2_was_losing_5_0: Boolean(safeGet(game, 'team2_was_losing_5_0', false))
                        };
                        
                        safeGames.push(safeGame);
                    } catch (error) {
                        console.error('Erro ao processar jogo:', error);
                        continue;
                    }
                }
            }
            console.log('Jogos encontrados:', safeGames.length);
            
            // Buscar informações dos jogadores em lotes
            const playerIdsArray = Array.from(playerIds);
            const batchSize = 100;
            let playersData: Player[] = [];
            
            // Buscar jogadores em lotes para evitar limites de consulta
            for (let i = 0; i < playerIdsArray.length; i += batchSize) {
                const batch = playerIdsArray.slice(i, i + batchSize);
                // Usamos as any para contornar os erros de tipagem do Supabase
                const { data: batchData, error: batchError } = await supabase
                    .from('players')
                    .select('*' as any)
                    .in('id' as any, batch as any);
                    
                if (batchError) {
                    console.error('Erro ao buscar lote de jogadores:', batchError);
                    continue;
                }
                
                // Processar os jogadores manualmente para garantir tipagem correta
                const rawBatch = safeArray(batchData);
                const typedBatch: Player[] = rawBatch.map((rawPlayer: any) => {
                    // Garantir que temos um objeto válido
                    if (!rawPlayer || typeof rawPlayer !== 'object') {
                        return null;
                    }
                    
                    return {
                        id: safeGet(rawPlayer, 'id'),
                        name: safeGet(rawPlayer, 'name') || '',
                        nickname: safeGet(rawPlayer, 'nickname'),
                        user_id: safeGet(rawPlayer, 'user_id'),
                        avatar_url: safeGet(rawPlayer, 'avatar_url'),
                        created_at: safeGet(rawPlayer, 'created_at'),
                        updated_at: safeGet(rawPlayer, 'updated_at')
                    } as Player;
                }).filter((player): player is Player => player !== null);
                
                playersData = [...playersData, ...typedBatch];
            }
            
            // Inicializar estatísticas dos jogadores
            const playerStats = new Map<string, PlayerStats>();
            
            playersData.forEach(player => {
                const playerId = safeGet(player, 'id');
                if (playerId) {
                    playerStats.set(playerId, {
                        id: playerId,
                        name: safeGet(player, 'name') || 'Jogador sem nome',
                        nickname: safeGet(player, 'nickname') || null,
                        avatar_url: safeGet(player, 'avatar_url') || null,
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
                // Garantir que temos arrays de strings para os times
                const team1 = Array.isArray(game.team1) 
                    ? game.team1.filter((id): id is string => typeof id === 'string' && id.trim() !== '')
                    : [];
                const team2 = Array.isArray(game.team2)
                    ? game.team2.filter((id): id is string => typeof id === 'string' && id.trim() !== '')
                    : [];
                
                // Verificar se temos times válidos
                if (team1.length === 0 || team2.length === 0) {
                    return; // pular esse jogo se não houver jogadores válidos
                }
                
                // Calcular pontuações com valores padrão seguros
                const team1Score = Number(game.team1_score) || 0;
                const team2Score = Number(game.team2_score) || 0;
                const gameStatus = game.status || 'finished';
                const isBuchuda = gameStatus === 'buchuda';
                const isBuchudaDeRe = gameStatus === 'buchuda_de_re';
                
                // Verificar se os IDs dos jogadores são strings válidas
                const validTeam1 = team1.filter(id => typeof id === 'string' && id.trim() !== '' && playerStats.has(id));
                const validTeam2 = team2.filter(id => typeof id === 'string' && id.trim() !== '' && playerStats.has(id));
                
                if (validTeam1.length === 0 || validTeam2.length === 0) {
                    return; // pular esse jogo se não tiver IDs válidos
                }
                
                // Acessar os stats do jogador de forma segura, evitando acesso direto ao objeto
                validTeam1.forEach(playerId => {
                    const stats = playerStats.get(playerId);
                    if (stats) {
                        stats.games++;
                        stats.goalsScored += team1Score;
                        stats.goalsConceded += team2Score;
                        stats.pointsGained += team1Score;
                        stats.pointsLost += team2Score;
                        
                        // Definir resultado
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
                validTeam2.forEach(playerId => {
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
                    avatar_url: stats.avatar_url,
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
            
            // Filtrar jogadores com pelo menos uma vitória e ordenar por número de vitórias (do maior para o menor)
            return rankings
                .filter(player => player.wins > 0)
                .sort((a, b) => b.wins - a.wins);
            
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
                
                // Tipo explícito para a tabela community_members
                // Usamos as any para contornar os erros de tipagem do Supabase
                const { data: communityMembersData, error: membersError } = await supabase
                    .from('community_members')
                    .select('player_id')
                    .eq('community_id' as any, communityId as any);

                if (membersError) {
                    console.error('Erro ao buscar membros da comunidade:', membersError);
                    return [];
                }

                // Processar membros da comunidade de forma segura
                // Assegurar que temos um array de objetos com a estrutura esperada
                const communityMembers = safeArray(communityMembersData);
                communityMembers.forEach((member: any) => {
                    if (member && typeof member === 'object' && 'player_id' in member) {
                        const playerId = member.player_id;
                        if (playerId) {
                            playerIds.add(playerId);
                        }
                    }
                });
            } else {
                console.log('RankingService: Buscando todos os jogadores...');
                // Usamos as any para contornar os erros de tipagem do Supabase
                const { data: allPlayersData, error: playersError } = await supabase
                    .from('players')
                    .select('*' as any);
                
                if (playersError) {
                    console.error('Erro ao buscar jogadores:', playersError);
                    return [];
                }
                
                // Processar jogadores de forma segura
                const allPlayers = toPlayers(safeArray(allPlayersData));
                allPlayers.forEach(player => {
                    if (player.id) {
                        playerIds.add(player.id);
                    }
                });
            }
            
            if (playerIds.size === 0) {
                console.log('Nenhum jogador encontrado para buscar estatísticas de duplas');
                return [];
            }
            
            // Buscar todos os jogos relevantes
            const gameStatuses: string[] = ['finished', 'buchuda', 'buchuda_de_re'];
            // Usamos as any para contornar os erros de tipagem do Supabase
            const { data: gamesData, error: gamesError } = await supabase
                .from('games')
                .select('*' as any)
                .in('status' as any, gameStatuses as any);

            if (gamesError) {
                console.error('Erro ao buscar jogos:', gamesError);
                return [];
            }

            // Converter dados dos jogos para tipo seguro usando a função helper
            const rawGames = safeArray(gamesData);
            const gamesList = rawGames.map(game => {
                // Fazer uma conversão manual segura para o tipo Game
                return {
                    id: safeGet(game, 'id'),
                    competition_id: safeGet(game, 'competition_id'),
                    user_id: safeGet(game, 'user_id'),
                    team1: safeArray(safeGet(game, 'team1')),
                    team2: safeArray(safeGet(game, 'team2')),
                    status: safeGet(game, 'status'),
                    points_team1: safeGet(game, 'points_team1') || 0,
                    points_team2: safeGet(game, 'points_team2') || 0,
                    created_at: safeGet(game, 'created_at'),
                    updated_at: safeGet(game, 'updated_at')
                } as Game;
            });
            console.log('Jogos encontrados para análise de duplas:', gamesList.length);
            
            // Buscar informações dos jogadores em lotes
            const playerIdsArray = Array.from(playerIds);
            const batchSize = 100;
            let playersData: Player[] = [];
            
            // Buscar jogadores em lotes para evitar limites de consulta
            for (let i = 0; i < playerIdsArray.length; i += batchSize) {
                const batch = playerIdsArray.slice(i, i + batchSize);
                // Usamos as any para contornar os erros de tipagem do Supabase
                const { data: batchData, error: batchError } = await supabase
                    .from('players')
                    .select('*' as any)
                    .in('id' as any, batch as any);
                    
                if (batchError) {
                    console.error('Erro ao buscar lote de jogadores:', batchError);
                    continue;
                }
                
                // Processar os jogadores manualmente para garantir tipagem correta
                const rawBatch = safeArray(batchData);
                const typedBatch: Player[] = rawBatch.map((rawPlayer: any) => {
                    // Garantir que temos um objeto válido
                    if (!rawPlayer || typeof rawPlayer !== 'object') {
                        return null;
                    }
                    
                    return {
                        id: safeGet(rawPlayer, 'id'),
                        name: safeGet(rawPlayer, 'name') || '',
                        nickname: safeGet(rawPlayer, 'nickname'),
                        user_id: safeGet(rawPlayer, 'user_id'),
                        avatar_url: safeGet(rawPlayer, 'avatar_url'),
                        created_at: safeGet(rawPlayer, 'created_at'),
                        updated_at: safeGet(rawPlayer, 'updated_at')
                    } as Player;
                }).filter((player): player is Player => player !== null);
                
                playersData = [...playersData, ...typedBatch];
            }
            
            // Criar um mapa de jogadores para acesso rápido
            const playersMap = new Map<string, { id: string; name: string; nickname: string | null; avatar_url?: string | null }>();
            playersData.forEach((player: Player) => {
                const playerId = safeGet(player, 'id');
                if (playerId) {
                    playersMap.set(playerId, {
                        id: playerId,
                        name: safeGet(player, 'name') || 'Jogador sem nome',
                        nickname: safeGet(player, 'nickname') || null,
                        avatar_url: safeGet(player, 'avatar_url') || null
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
            gamesList.forEach((game: Game) => {
                // Garantir que temos arrays válidos para as equipes
                const team1 = safeArray(safeGet(game, 'team1'));
                const team2 = safeArray(safeGet(game, 'team2'));
                
                // Verificar se temos times válidos (pelo menos 1 jogador em cada)
                if (team1.length < 1 || team2.length < 1) {
                    return; // pular esse jogo
                }
                
                // Verificar se os IDs dos jogadores são strings válidas
                const validTeam1 = team1.filter(id => typeof id === 'string' && id.trim() !== '');
                const validTeam2 = team2.filter(id => typeof id === 'string' && id.trim() !== '');
                
                if (validTeam1.length < 1 || validTeam2.length < 1) {
                    return; // pular esse jogo se não tiver IDs válidos
                }
                
                // Apenas jogos 2x2 são considerados para ranking de duplas
                if (validTeam1.length === 2 && validTeam2.length === 2) {
                    const team1Score = Number(game.team1_score) || 0;
                    const team2Score = Number(game.team2_score) || 0;
                    const isBuchuda = game.status === 'buchuda';
                    const isBuchudaDeRe = game.status === 'buchuda_de_re';
                    
                    // Processar time 1 - apenas com IDs válidos
                    const validTeam1Players = validTeam1.filter(id => playersMap.has(id));
                    if (validTeam1Players.length === 2) {
                        const [p1, p2] = validTeam1Players;
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
                    
                    // Processar time 2 - apenas com IDs válidos
                    const validTeam2Players = validTeam2.filter(id => playersMap.has(id));
                    if (validTeam2Players.length === 2) {
                        const [p3, p4] = validTeam2Players;
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
                            nickname: player1.nickname,
                            avatar_url: (player1 as any).avatar_url || null
                        },
                        player2: {
                            id: player2.id,
                            name: player2.name,
                            nickname: player2.nickname,
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
                        winRate: parseFloat(winRate.toFixed(2))
                    });
                }
            });
            
            // Filtrar duplas com pelo menos uma vitória e ordenar por vitórias (e depois por menos derrotas em caso de empate)
            return rankings
                .filter(pair => pair.wins > 0)
                .sort((a, b) => {
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
