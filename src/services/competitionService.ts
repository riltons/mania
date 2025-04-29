// @ts-nocheck
import { supabase } from '@/lib/supabase';
import { activityService } from './activityService';
import { subscriptionService } from './subscriptionService';

export interface Competition {
    id: string;
    name: string;
    description: string;
    community_id: string;
    start_date: string;
    created_at: string;
    status: 'pending' | 'in_progress' | 'finished';
}

export interface CreateCompetitionDTO {
    name: string;
    description: string;
    community_id: string;
    start_date?: string;
}

export interface SimpleCreateCompetitionDTO {
    name: string;
    description: string;
    communityId: string;
}

export interface CompetitionResult {
    players: {
        id: string;
        name: string;
        score: number;
        wins: number;
        losses: number;
        buchudas: number;
        buchudasDeRe: number;
    }[];
    pairs: {
        players: string[];
        score: number;
        wins: number;
        losses: number;
        buchudas: number;
        buchudasDeRe: number;
    }[];
}

export const competitionService = {
    async create(data: CreateCompetitionDTO | SimpleCreateCompetitionDTO) {
        // Converter formato simplificado para o formato completo
        const formattedData: CreateCompetitionDTO = {
            name: data.name,
            description: data.description,
            community_id: 'communityId' in data ? data.communityId : data.community_id,
            start_date: 'start_date' in data ? data.start_date : new Date().toISOString()
        };
        try {
            console.log('[competitionService] Criando competição:', data);
            const { data: user } = await supabase.auth.getUser();
            if (!user?.user?.id) {
                throw new Error('Usuário não autenticado');
            }

            // Limitar competições ativas: free plan só 2 por comunidade
            const subscription = await subscriptionService.getUserSubscription(user.user.id);
            if (subscription?.plans.slug === 'free') {
                const { count, error: countError } = await supabase
                    .from('competitions')
                    .select('id', { count: 'exact', head: true })
                    .eq('community_id', formattedData.community_id)
                    .in('status', ['pending', 'in_progress']);
                if (countError) throw countError;
                if ((count || 0) >= 2) {
                    // Retornar um objeto de erro em vez de lançar uma exceção
                    console.log('[DEBUG] Limite de plano atingido, retornando erro');
                    return { 
                        error: true, 
                        planLimit: true, 
                        message: 'Plano gratuito permite no máximo 2 competições ativas por comunidade',
                        success: false // Garantir que success seja false
                    };
                }
            }

            // Verifica se o usuário tem permissão para criar competição nesta comunidade
            const { data: community } = await supabase
                .from('communities')
                .select('id')
                .eq('id', formattedData.community_id)
                .eq('created_by', user.user.id)
                .maybeSingle();

            if (!community) {
                const { data: organizer } = await supabase
                    .from('community_organizers')
                    .select('id')
                    .eq('community_id', formattedData.community_id)
                    .eq('user_id', user.user.id)
                    .maybeSingle();

                if (!organizer) {
                    throw new Error('Usuário não tem permissão para criar competições nesta comunidade');
                }
            }

            // Cria a competição
            const { data: newCompetition, error } = await supabase.rpc(
                'create_competition',
                {
                    p_name: formattedData.name,
                    p_description: formattedData.description,
                    p_community_id: formattedData.community_id,
                    p_created_by: user.user.id,
                    p_start_date: formattedData.start_date
                }
            );

            if (error) {
                throw error;
            }

            if (newCompetition) {
                const maxRetries = 3;
                const baseDelay = 1000;

                const createActivityWithRetry = async (attempt: number) => {
                    try {
                        console.log(`[competitionService] Tentativa ${attempt} de criar atividade...`);
                        await activityService.createActivity({
                            type: 'competition',
                            description: `Nova competição "${formattedData.name}" criada!`,
                            metadata: {
                                competition_id: newCompetition.id
                            }
                        });
                        console.log('[competitionService] Atividade criada com sucesso!');
                        return true;
                    } catch (activityError) {
                        // Removido log para evitar saída desnecessária
                        if (attempt < maxRetries) {
                            const delay = baseDelay * Math.pow(2, attempt - 1);
                            // Aguardando sem log
                            await new Promise(resolve => setTimeout(resolve, delay));
                            return createActivityWithRetry(attempt + 1);
                        }
                        // Todas as tentativas falharam, sem log
                        return false;
                    }
                };

                createActivityWithRetry(1).catch(error => {
                    // Removido log para evitar saída desnecessária
                });
            }
            
            console.log('[competitionService] Competição criada:', newCompetition);
            return { success: true, data: newCompetition };
        } catch (error: any) {
            throw error;
        }
    },

    async refreshCompetitions(communityId: string) {
        try {
            console.log('[competitionService] Iniciando busca de competições para comunidade:', communityId);
            
            const { data: user } = await supabase.auth.getUser();
            if (!user?.user?.id) {
                throw new Error('Usuário não autenticado');
            }

            // Busca as competições usando uma função RPC
            const { data, error } = await supabase.rpc(
                'get_community_competitions',
                {
                    p_community_id: communityId,
                    p_user_id: user.user.id
                }
            );

            if (error) {
                console.error('[competitionService] Erro ao buscar competições:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('[competitionService] Erro ao buscar competições:', error);
            return [];
        }
    },

    async listByCommunity(communityId: string) {
        return this.refreshCompetitions(communityId);
    },

    async getById(id: string) {
        try {
            console.log('[competitionService] Iniciando busca da competição:', id);
            
            const { data: user } = await supabase.auth.getUser();
            if (!user?.user?.id) {
                throw new Error('Usuário não autenticado');
            }

            // Busca a competição usando uma função RPC
            const { data, error } = await supabase.rpc(
                'get_competition_by_id',
                {
                    p_competition_id: id.trim(),
                    p_user_id: user.user.id
                }
            );

            if (error) {
                console.error('[competitionService] Erro ao buscar competição:', error);
                throw error;
            }

            // Se não houver dados ou array vazio, retorna null
            if (!data || (Array.isArray(data) && data.length === 0)) {
                console.log('[competitionService] Competição não encontrada ou usuário sem acesso');
                return null;
            }
            // Se data for array, pega o primeiro elemento
            const competition = Array.isArray(data) ? data[0] : data;
            return competition;
        } catch (error) {
            console.error('[competitionService] Erro ao buscar competição:', error);
            throw error;
        }
    },

    async listMembers(competitionId: string) {
        try {
            // Busca os membros
            const { data: members, error: membersError } = await supabase
                .from('competition_members')
                .select(`
                    competition_id,
                    player_id,
                    id
                `)
                .eq('competition_id', competitionId);

            if (membersError) {
                console.error('Erro ao buscar membros:', membersError);
                throw membersError;
            }

            if (!members || members.length === 0) {
                return [];
            }

            // Busca os jogadores
            const { data: players, error: playersError } = await supabase
                .from('players')
                .select('id, name, phone')
                .in('id', members.map(m => m.player_id));

            if (playersError) {
                console.error('Erro ao buscar jogadores:', playersError);
                throw playersError;
            }

            // Retorna apenas os membros que têm jogadores correspondentes
            const result = members
                .filter(member => players?.some(p => p.id === member.player_id))
                .map(member => ({
                    ...member,
                    players: players?.find(p => p.id === member.player_id)!
                }));

            console.log('Membros encontrados:', result);
            return result;
        } catch (error) {
            console.error('Erro ao listar membros da competição:', error);
            throw error;
        }
    },

    async addMember(competitionId: string, playerId: string) {
        try {
            console.log('Adicionando membro:', { competitionId, playerId });
            const { data, error } = await supabase
                .from('competition_members')
                .insert([{
                    competition_id: competitionId,
                    player_id: playerId
                }])
                .select();

            console.log('Resposta:', { data, error });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao adicionar membro à competição:', error);
            throw error;
        }
    },

    async removeMember(competitionId: string, playerId: string) {
        try {
            const { error } = await supabase
                .from('competition_members')
                .delete()
                .eq('competition_id', competitionId)
                .eq('player_id', playerId);

            if (error) throw error;
        } catch (error) {
            console.error('Erro ao remover membro da competição:', error);
            throw error;
        }
    },

    async startCompetition(id: string) {
        try {
            const { data, error } = await supabase
                .from('competitions')
                .update({ status: 'in_progress' })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao iniciar competição:', error);
            throw error;
        }
    },

    async getPlayerById(playerId: string) {
        try {
            const { data, error } = await supabase
                .from('players')
                .select('*')
                .eq('id', playerId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao buscar jogador:', error);
            throw error;
        }
    },

    async canFinishCompetition(id: string): Promise<boolean> {
        try {
            const { data: games, error } = await supabase
                .from('games')
                .select('status')
                .eq('competition_id', id);

            if (error) throw error;
            if (!games || games.length === 0) return false;

            // Verifica se há pelo menos um jogo finalizado
            const hasFinishedGames = games.some(game => game.status === 'finished');
            
            // Verifica se não há jogos pendentes ou em andamento
            const hasUnfinishedGames = games.some(game => 
                game.status === 'pending' || game.status === 'in_progress'
            );

            // Só pode encerrar se tiver jogos finalizados E não tiver jogos não finalizados
            return hasFinishedGames && !hasUnfinishedGames;
        } catch (error) {
            console.error('Erro ao verificar status da competição:', error);
            throw error;
        }
    },

    async finishCompetition(id: string): Promise<CompetitionResult> {
        try {
            // Busca todos os jogos da competição
            const { data: games, error: gamesError } = await supabase
                .from('games')
                .select('*')
                .eq('competition_id', id);

            if (gamesError) throw gamesError;

            // Inicializa os resultados
            const playerStats: Record<string, {
                score: number;
                wins: number;
                losses: number;
                buchudas: number;
                buchudasDeRe: number;
                pairs: Set<string>;
            }> = {};

            const pairStats: Record<string, {
                score: number;
                wins: number;
                losses: number;
                buchudas: number;
                buchudasDeRe: number;
            }> = {};

            // Processa cada jogo
            for (const game of games) {
                if (game.status !== 'finished') continue;

                // Inicializa estatísticas dos jogadores se necessário
                [...game.team1, ...game.team2].forEach(playerId => {
                    if (!playerStats[playerId]) {
                        playerStats[playerId] = {
                            score: 0,
                            wins: 0,
                            losses: 0,
                            buchudas: 0,
                            buchudasDeRe: 0,
                            pairs: new Set()
                        };
                    }
                });

                // Cria chaves para as duplas
                const team1Key = game.team1.sort().join('_');
                const team2Key = game.team2.sort().join('_');

                // Inicializa estatísticas das duplas se necessário
                if (!pairStats[team1Key]) {
                    pairStats[team1Key] = {
                        score: 0,
                        wins: 0,
                        losses: 0,
                        buchudas: 0,
                        buchudasDeRe: 0
                    };
                }
                if (!pairStats[team2Key]) {
                    pairStats[team2Key] = {
                        score: 0,
                        wins: 0,
                        losses: 0,
                        buchudas: 0,
                        buchudasDeRe: 0
                    };
                }

                // Registra as duplas para cada jogador
                game.team1.forEach(playerId => {
                    playerStats[playerId].pairs.add(team1Key);
                });
                game.team2.forEach(playerId => {
                    playerStats[playerId].pairs.add(team2Key);
                });

                // Atualiza estatísticas baseado no resultado
                if (game.team1_score > game.team2_score) {
                    // Time 1 venceu
                    game.team1.forEach(playerId => {
                        playerStats[playerId].wins++;
                        playerStats[playerId].score += game.team1_score;
                    });
                    game.team2.forEach(playerId => {
                        playerStats[playerId].losses++;
                        playerStats[playerId].score += game.team2_score;
                    });
                    pairStats[team1Key].wins++;
                    pairStats[team1Key].score += game.team1_score;
                    pairStats[team2Key].losses++;
                    pairStats[team2Key].score += game.team2_score;

                    // Buchuda normal (6x0)
                    if (game.team1_score === 6 && game.team2_score === 0) {
                        game.team1.forEach(playerId => playerStats[playerId].buchudas++);
                        pairStats[team1Key].buchudas++;
                    }
                    // Buchuda de Ré (time 1 estava perdendo de 5x0 e virou)
                    if (game.team1_was_losing_5_0) {
                        game.team1.forEach(playerId => playerStats[playerId].buchudasDeRe++);
                        pairStats[team1Key].buchudasDeRe++;
                    }
                } else {
                    // Time 2 venceu
                    game.team2.forEach(playerId => {
                        playerStats[playerId].wins++;
                        playerStats[playerId].score += game.team2_score;
                    });
                    game.team1.forEach(playerId => {
                        playerStats[playerId].losses++;
                        playerStats[playerId].score += game.team1_score;
                    });
                    pairStats[team2Key].wins++;
                    pairStats[team2Key].score += game.team2_score;
                    pairStats[team1Key].losses++;
                    pairStats[team1Key].score += game.team1_score;

                    // Buchuda normal (6x0)
                    if (game.team2_score === 6 && game.team1_score === 0) {
                        game.team2.forEach(playerId => playerStats[playerId].buchudas++);
                        pairStats[team2Key].buchudas++;
                    }
                    // Buchuda de Ré (time 2 estava perdendo de 5x0 e virou)
                    if (game.team2_was_losing_5_0) {
                        game.team2.forEach(playerId => playerStats[playerId].buchudasDeRe++);
                        pairStats[team2Key].buchudasDeRe++;
                    }
                }
            }

            // Busca os nomes dos jogadores
            const playerIds = Object.keys(playerStats);
            const players = await Promise.all(
                playerIds.map(async (id) => {
                    const player = await this.getPlayerById(id);
                    return {
                        id,
                        name: player.name,
                        score: playerStats[id].score,
                        wins: playerStats[id].wins,
                        losses: playerStats[id].losses,
                        buchudas: playerStats[id].buchudas,
                        buchudasDeRe: playerStats[id].buchudasDeRe
                    };
                })
            );

            // Formata as estatísticas das duplas
            const pairs = Object.entries(pairStats).map(([key, stats]) => ({
                players: key.split('_'),
                ...stats
            }));

            // Atualiza o status da competição para finished
            const { error: updateError } = await supabase
                .from('competitions')
                .update({ status: 'finished' })
                .eq('id', id);

            if (updateError) throw updateError;

            // Buscar informações da competição
            const { data: competition } = await supabase
                .from('competitions')
                .select('*')
                .eq('id', id)
                .single();

            // Buscar informações da comunidade
            let communityName = 'Desconhecida';
            if (competition?.community_id) {
                const { data: community } = await supabase
                    .from('communities')
                    .select('name')
                    .eq('id', competition.community_id)
                    .single();
                
                if (community) {
                    communityName = community.name;
                }
            }

            // Ordena os jogadores por pontuação
            const sortedPlayers = players.sort((a, b) => {
                // 1. Mais vitórias
                if (a.wins !== b.wins) return b.wins - a.wins;
                // 2. Menos derrotas
                if (a.losses !== b.losses) return a.losses - b.losses;
                // 3. Mais pontos
                if (a.score !== b.score) return b.score - a.score;
                return 0;
            });

            // Ordena as duplas por pontuação
            const sortedPairs = pairs.sort((a, b) => {
                // 1. Mais vitórias
                if (a.wins !== b.wins) return b.wins - a.wins;
                // 2. Menos derrotas
                if (a.losses !== b.losses) return a.losses - b.losses;
                // 3. Mais pontos
                if (a.score !== b.score) return b.score - a.score;
                return 0;
            });

            // Pega os dois melhores jogadores e a melhor dupla
            const topPlayers = sortedPlayers.slice(0, 2);
            const topPair = sortedPairs[0];

            // Busca os nomes dos jogadores da melhor dupla
            const topPairPlayers = await Promise.all(
                topPair.players.map(async (id) => {
                    const player = await this.getPlayerById(id);
                    return player.name;
                })
            );

            // Formata a descrição dos resultados
            const resultDescription = `
                Competição finalizada! 
                1º Lugar Individual: ${topPlayers[0].name} (${topPlayers[0].wins} vitórias, ${topPlayers[0].score} pontos)
                2º Lugar Individual: ${topPlayers[1].name} (${topPlayers[1].wins} vitórias, ${topPlayers[1].score} pontos)
                Melhor Dupla: ${topPairPlayers.join(' e ')} (${topPair.wins} vitórias, ${topPair.score} pontos)
            `.trim().replace(/\s+/g, ' ');

            // Registra a atividade de finalização da competição
            try {
                await activityService.createActivity({
                    type: 'competition',
                    description: `Competição "${competition?.name || 'Desconhecida'}" da Comunidade ${communityName} foi finalizada! ${resultDescription}`,
                    metadata: {
                        competition_id: id,
                        competition_name: competition?.name,
                        community_id: competition?.community_id,
                        community_name: communityName,
                        top_players: topPlayers.map(p => ({
                            id: p.id,
                            name: p.name,
                            wins: p.wins,
                            losses: p.losses,
                            score: p.score,
                            buchudas: p.buchudas,
                            buchudasDeRe: p.buchudasDeRe
                        })),
                        top_pair: {
                            players: topPair.players.map((id, index) => ({
                                id,
                                name: topPairPlayers[index]
                            })),
                            wins: topPair.wins,
                            losses: topPair.losses,
                            score: topPair.score,
                            buchudas: topPair.buchudas,
                            buchudasDeRe: topPair.buchudasDeRe
                        }
                    }
                });
                console.log('Atividade criada com sucesso!');
            } catch (activityError) {
                console.error('Erro ao criar atividade:', activityError);
                // Não propaga o erro para não impedir a finalização da competição
            }

            return {
                players: sortedPlayers,
                pairs: sortedPairs
            };
        } catch (error) {
            console.error('Erro ao finalizar competição:', error);
            throw error;
        }
    },

    async getCompetitionResults(id: string): Promise<CompetitionResult> {
        try {
            // Busca todos os jogos da competição
            const { data: games, error: gamesError } = await supabase
                .from('games')
                .select('*')
                .eq('competition_id', id);

            if (gamesError) throw gamesError;

            // Inicializa os resultados
            const playerStats: Record<string, {
                score: number;
                wins: number;
                losses: number;
                buchudas: number;
                buchudasDeRe: number;
                pairs: Set<string>;
            }> = {};

            const pairStats: Record<string, {
                score: number;
                wins: number;
                losses: number;
                buchudas: number;
                buchudasDeRe: number;
            }> = {};

            // Processa cada jogo
            for (const game of games) {
                if (game.status !== 'finished') continue;

                // Inicializa estatísticas dos jogadores se necessário
                [...game.team1, ...game.team2].forEach(playerId => {
                    if (!playerStats[playerId]) {
                        playerStats[playerId] = {
                            score: 0,
                            wins: 0,
                            losses: 0,
                            buchudas: 0,
                            buchudasDeRe: 0,
                            pairs: new Set()
                        };
                    }
                });

                // Cria chaves para as duplas
                const team1Key = game.team1.sort().join('_');
                const team2Key = game.team2.sort().join('_');

                // Inicializa estatísticas das duplas se necessário
                if (!pairStats[team1Key]) {
                    pairStats[team1Key] = {
                        score: 0,
                        wins: 0,
                        losses: 0,
                        buchudas: 0,
                        buchudasDeRe: 0
                    };
                }
                if (!pairStats[team2Key]) {
                    pairStats[team2Key] = {
                        score: 0,
                        wins: 0,
                        losses: 0,
                        buchudas: 0,
                        buchudasDeRe: 0
                    };
                }

                // Registra as duplas para cada jogador
                game.team1.forEach(playerId => {
                    playerStats[playerId].pairs.add(team1Key);
                });
                game.team2.forEach(playerId => {
                    playerStats[playerId].pairs.add(team2Key);
                });

                // Atualiza estatísticas baseado no resultado
                if (game.team1_score > game.team2_score) {
                    // Time 1 venceu
                    game.team1.forEach(playerId => {
                        playerStats[playerId].wins++;
                        playerStats[playerId].score += game.team1_score;
                    });
                    game.team2.forEach(playerId => {
                        playerStats[playerId].losses++;
                        playerStats[playerId].score += game.team2_score;
                    });
                    pairStats[team1Key].wins++;
                    pairStats[team1Key].score += game.team1_score;
                    pairStats[team2Key].losses++;
                    pairStats[team2Key].score += game.team2_score;

                    // Buchuda normal (6x0)
                    if (game.team1_score === 6 && game.team2_score === 0) {
                        game.team1.forEach(playerId => playerStats[playerId].buchudas++);
                        pairStats[team1Key].buchudas++;
                    }
                    // Buchuda de Ré (time 1 estava perdendo de 5x0 e virou)
                    if (game.team1_was_losing_5_0) {
                        game.team1.forEach(playerId => playerStats[playerId].buchudasDeRe++);
                        pairStats[team1Key].buchudasDeRe++;
                    }
                } else {
                    // Time 2 venceu
                    game.team2.forEach(playerId => {
                        playerStats[playerId].wins++;
                        playerStats[playerId].score += game.team2_score;
                    });
                    game.team1.forEach(playerId => {
                        playerStats[playerId].losses++;
                        playerStats[playerId].score += game.team1_score;
                    });
                    pairStats[team2Key].wins++;
                    pairStats[team2Key].score += game.team2_score;
                    pairStats[team1Key].losses++;
                    pairStats[team1Key].score += game.team1_score;

                    // Buchuda normal (6x0)
                    if (game.team2_score === 6 && game.team1_score === 0) {
                        game.team2.forEach(playerId => playerStats[playerId].buchudas++);
                        pairStats[team2Key].buchudas++;
                    }
                    // Buchuda de Ré (time 2 estava perdendo de 5x0 e virou)
                    if (game.team2_was_losing_5_0) {
                        game.team2.forEach(playerId => playerStats[playerId].buchudasDeRe++);
                        pairStats[team2Key].buchudasDeRe++;
                    }
                }
            }

            // Busca os nomes dos jogadores
            const playerIds = Object.keys(playerStats);
            const players = await Promise.all(
                playerIds.map(async (id) => {
                    const player = await this.getPlayerById(id);
                    return {
                        id,
                        name: player.name,
                        score: playerStats[id].score,
                        wins: playerStats[id].wins,
                        losses: playerStats[id].losses,
                        buchudas: playerStats[id].buchudas,
                        buchudasDeRe: playerStats[id].buchudasDeRe
                    };
                })
            );

            // Formata as estatísticas das duplas
            const pairs = Object.entries(pairStats).map(([key, stats]) => ({
                players: key.split('_'),
                ...stats
            }));

            // Ordena os jogadores por pontuação
            const sortedPlayers = players.sort((a, b) => {
                // 1. Mais vitórias
                if (a.wins !== b.wins) return b.wins - a.wins;
                // 2. Menos derrotas
                if (a.losses !== b.losses) return a.losses - b.losses;
                // 3. Mais pontos
                if (a.score !== b.score) return b.score - a.score;
                return 0;
            });

            // Ordena as duplas por pontuação
            const sortedPairs = pairs.sort((a, b) => {
                // 1. Mais vitórias
                if (a.wins !== b.wins) return b.wins - a.wins;
                // 2. Menos derrotas
                if (a.losses !== b.losses) return a.losses - b.losses;
                // 3. Mais pontos
                if (a.score !== b.score) return b.score - a.score;
                return 0;
            });

            return {
                players: sortedPlayers,
                pairs: sortedPairs
            };
        } catch (error) {
            console.error('Erro ao buscar resultados da competição:', error);
            throw error;
        }
    },

    async listMyCompetitions() {
        try {
            console.log('Verificando usuário autenticado...');
            const { data: user } = await supabase.auth.getUser();
            if (!user?.user?.id) {
                throw new Error('Usuário não autenticado');
            }

            // Buscar comunidades criadas pelo usuário
            console.log('Buscando comunidades criadas pelo usuário...');
            const { data: createdCommunities, error: createdError } = await supabase
                .from('communities')
                .select('id, name, created_by')
                .eq('created_by', user.user.id);

            if (createdError) {
                console.error('Erro ao buscar comunidades criadas:', createdError);
                throw createdError;
            }

            // Buscar comunidades onde o usuário é organizador
            console.log('Buscando comunidades onde usuário é organizador...');
            const { data: organizedCommunities, error: organizedError } = await supabase
                .from('community_organizers')
                .select('community:community_id(id, name, created_by)')
                .eq('user_id', user.user.id);

            if (organizedError) {
                console.error('Erro ao buscar comunidades organizadas:', organizedError);
                throw organizedError;
            }

            // Combinar as comunidades
            const userCommunities = [
                ...(createdCommunities || []),
                ...(organizedCommunities?.map(oc => oc.community) || [])
            ].filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i); // Remove duplicatas

            if (!userCommunities.length) {
                console.log('Nenhuma comunidade encontrada');
                return { created: [], organized: [] };
            }

            const communityIds = userCommunities.map(c => c.id);
            console.log('Comunidades encontradas:', communityIds);

            // Buscar todas as competições dessas comunidades
            const { data: competitions, error: competitionsError } = await supabase
                .from('competitions')
                .select('*, community_id')
                .in('community_id', communityIds)
                .order('created_at', { ascending: false });

            if (competitionsError) {
                console.error('Erro ao buscar competições:', competitionsError);
                throw competitionsError;
            }

            // Separar competições criadas e organizadas
            const created = competitions
                ?.filter(comp => comp.created_by === user.user.id)
                .map(comp => ({
                    ...comp,
                    community: userCommunities.find(c => c.id === comp.community_id),
                    type: 'created' as const
                })) || [];

            const organized = competitions
                ?.filter(comp => {
                    const community = userCommunities.find(c => c.id === comp.community_id);
                    return comp.created_by !== user.user.id && // Não é o criador
                           community && // Comunidade existe
                           community.created_by !== user.user.id; // Não é o criador da comunidade
                })
                .map(comp => ({
                    ...comp,
                    community: userCommunities.find(c => c.id === comp.community_id),
                    type: 'organized' as const
                })) || [];

            console.log('Total de competições criadas:', created.length);
            console.log('Total de competições organizadas:', organized.length);

            return {
                created,
                organized
            };
        } catch (error) {
            console.error('Erro em listMyCompetitions:', error);
            if (error instanceof Error) {
                console.error('Detalhes do erro:', error.message);
                console.error('Stack trace:', error.stack);
            }
            throw error;
        }
    }
};
