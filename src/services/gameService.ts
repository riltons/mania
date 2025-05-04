import { supabase } from '@/lib/supabase';
import { activityService } from './activityService';
import { subscriptionService } from './subscriptionService';

export type VictoryType = 
    | 'simple' // 1 ponto
    | 'carroca' // 2 pontos
    | 'la_e_lo' // 3 pontos
    | 'cruzada' // 4 pontos
    | 'contagem' // 1 ponto
    | 'empate'; // 0 ponto + 1 na próxima

export interface GameRound {
    type: VictoryType;
    winner_team: 1 | 2 | null;
    has_bonus: boolean;
}

export interface Game {
    id: string;
    competition_id: string;
    team1: string[];
    team2: string[];
    team1_score: number;
    team2_score: number;
    status: 'pending' | 'in_progress' | 'finished';
    created_at: string;
    rounds: GameRound[];
    last_round_was_tie: boolean;
    team1_was_losing_5_0: boolean;
    team2_was_losing_5_0: boolean;
    is_buchuda: boolean;
    is_buchuda_de_re: boolean;
}

export interface CreateGameDTO {
    competition_id: string;
    team1: string[];
    team2: string[];
}

export const gameService = {
    async create(data: CreateGameDTO) {
        try {
            console.log('Criando jogo com dados:', data);
            const session = await supabase.auth.getSession();
            console.log('Sessão atual:', session);

            // Limitar jogos: free plan só 10 por competição
            const { data: user } = await supabase.auth.getUser();
            if (!user?.user?.id) throw new Error('Usuário não autenticado');
            const subscription = await subscriptionService.getUserSubscription(user.user.id);
            if (subscription?.plans.slug === 'free') {
                const { count, error: countError } = await supabase
                    .from('games')
                    .select('id', { count: 'exact', head: true })
                    .eq('competition_id', data.competition_id);
                if (countError) throw countError;
                if ((count || 0) >= 10) throw new Error('Plano gratuito permite no máximo 10 jogos por competição');
            }

            const { data: newGame, error } = await supabase
                .from('games')
                .insert([{
                    competition_id: data.competition_id,
                    team1: data.team1,
                    team2: data.team2,
                    team1_score: 0,
                    team2_score: 0,
                    status: 'pending',
                    rounds: [],
                    last_round_was_tie: false,
                    team1_was_losing_5_0: false,
                    team2_was_losing_5_0: false,
                    is_buchuda: false,
                    is_buchuda_de_re: false
                }])
                .select()
                .single();

            if (error) {
                console.error('Erro detalhado:', error);
                throw error;
            }

            // Registrar a atividade de criação do jogo com sistema de retry
            if (newGame) {
                // Buscar informações da competição
                const { data: competition } = await supabase
                    .from('competitions')
                    .select('*')
                    .eq('id', newGame.competition_id)
                    .single();

                console.log('Dados da competição:', competition);

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

                console.log('Nome da comunidade:', communityName);

                // Buscar informações dos jogadores do time 1
                const { data: team1Players } = await supabase
                    .from('players')
                    .select('name')
                    .in('id', newGame.team1);

                // Buscar informações dos jogadores do time 2
                const { data: team2Players } = await supabase
                    .from('players')
                    .select('name')
                    .in('id', newGame.team2);

                // Formatar os nomes dos times
                const team1Names = team1Players?.map(p => p.name).join(' e ') || 'Time 1';
                const team2Names = team2Players?.map(p => p.name).join(' e ') || 'Time 2';

                const maxRetries = 3;
                const baseDelay = 1000; // 1 segundo

                const createActivityWithRetry = async (attempt: number) => {
                    try {
                        console.log(`Tentativa ${attempt} de criar atividade...`);
                        await activityService.createActivity({
                            type: 'game',
                            description: `Novo jogo criado na Comunidade ${communityName}, Competição ${competition?.name || 'Desconhecida'} entre as duplas ${team1Names} vs ${team2Names}`,
                            metadata: {
                                game_id: newGame.id,
                                competition_id: newGame.competition_id,
                                competition_name: competition?.name,
                                community_id: competition?.community_id,
                                community_name: communityName,
                                team1: {
                                    ids: newGame.team1,
                                    names: team1Players?.map(p => p.name) || []
                                },
                                team2: {
                                    ids: newGame.team2,
                                    names: team2Players?.map(p => p.name) || []
                                }
                            }
                        });
                        console.log('Atividade criada com sucesso!');
                        return true;
                    } catch (activityError) {
                        console.error(`Erro na tentativa ${attempt}:`, activityError);
                        
                        if (attempt < maxRetries) {
                            const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
                            console.log(`Aguardando ${delay}ms antes da próxima tentativa...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            return createActivityWithRetry(attempt + 1);
                        }
                        
                        console.error('Todas as tentativas de criar atividade falharam');
                        return false;
                    }
                };

                // Inicia o processo de retry em background
                createActivityWithRetry(1).catch(error => {
                    console.error('Erro no processo de retry:', error);
                });
            }

            return newGame;
        } catch (error) {
            console.error('Erro ao criar jogo:', error);
            throw error;
        }
    },

    async startGame(id: string) {
        try {
            const { data, error } = await supabase
                .from('games')
                .update({
                    status: 'in_progress'
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao iniciar jogo:', error);
            throw error;
        }
    },

    async registerRound(id: string, type: VictoryType, winnerTeam: 1 | 2 | null) {
        try {
            console.log('GameService: Registrando rodada:', { id, type, winnerTeam });
            
            const { data: game, error: getError } = await supabase
                .from('games')
                .select('*')
                .eq('id', id)
                .single();

            if (getError) throw getError;

            console.log('GameService: Estado atual do jogo:', {
                id: game.id,
                team1Score: game.team1_score,
                team2Score: game.team2_score,
                team1WasLosing5_0: game.team1_was_losing_5_0,
                team2WasLosing5_0: game.team2_was_losing_5_0,
                isBuchuda: game.is_buchuda,
                isBuchudaDeRe: game.is_buchuda_de_re
            });

            const hasBonus = game.last_round_was_tie;
            let team1Score = game.team1_score;
            let team2Score = game.team2_score;
            let team1WasLosing5_0 = game.team1_was_losing_5_0;
            let team2WasLosing5_0 = game.team2_was_losing_5_0;
            
            // Calcula pontos baseado no tipo de vitória
            let points = 0;
            switch (type) {
                case 'simple':
                case 'contagem':
                    points = 1;
                    break;
                case 'carroca':
                    points = 2;
                    break;
                case 'la_e_lo':
                    points = 3;
                    break;
                case 'cruzada':
                    points = 4;
                    break;
                case 'empate':
                    points = 0;
                    break;
            }

            // Adiciona bônus se a última rodada foi empate
            if (hasBonus && type !== 'empate') {
                points += 1;
            }

            // Atualiza o placar
            if (winnerTeam === 1) {
                team1Score += points;
            } else if (winnerTeam === 2) {
                team2Score += points;
            }

            // Verifica se algum time está em desvantagem de 5x0
            if (team1Score === 0 && team2Score === 5) {
                team1WasLosing5_0 = true;
                console.log('GameService: Time 1 está perdendo de 5x0');
            }
            if (team2Score === 0 && team1Score === 5) {
                team2WasLosing5_0 = true;
                console.log('GameService: Time 2 está perdendo de 5x0');
            }

            // Verifica se é uma buchuda (vencer sem que o adversário pontue)
            const isBuchuda = (team1Score >= 6 && team2Score === 0) || (team2Score >= 6 && team1Score === 0);
            if (isBuchuda) {
                console.log('GameService: Buchuda detectada!', {
                    team1Score,
                    team2Score,
                    winnerTeam
                });
            }
            
            // Verifica se é uma buchuda de ré (time que estava perdendo de 5x0 venceu)
            const isBuchudaDeRe = 
                (team1Score >= 6 && team1WasLosing5_0) || 
                (team2Score >= 6 && team2WasLosing5_0);
            
            if (isBuchudaDeRe) {
                console.log('GameService: Buchuda de Ré detectada!', {
                    team1Score,
                    team2Score,
                    team1WasLosing5_0,
                    team2WasLosing5_0,
                    winnerTeam
                });
            }

            const newRound: GameRound = {
                type,
                winner_team: winnerTeam,
                has_bonus: hasBonus
            };

            const updateData = {
                team1_score: team1Score,
                team2_score: team2Score,
                rounds: [...game.rounds, newRound],
                last_round_was_tie: type === 'empate',
                status: (team1Score >= 6 || team2Score >= 6) ? 'finished' : 'in_progress',
                is_buchuda: isBuchuda,
                is_buchuda_de_re: isBuchudaDeRe,
                team1_was_losing_5_0: team1WasLosing5_0,
                team2_was_losing_5_0: team2WasLosing5_0
            };

            console.log('GameService: Atualizando jogo:', updateData);

            const { data: updatedGame, error: updateError } = await supabase
                .from('games')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            // Se o jogo foi finalizado, registra a atividade
            if (updateData.status === 'finished') {
                // Buscar informações da competição
                const { data: competition } = await supabase
                    .from('competitions')
                    .select('*')
                    .eq('id', game.competition_id)
                    .single();

                console.log('Dados da competição:', competition);

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

                // Buscar informações dos jogadores do time 1
                const { data: team1Players } = await supabase
                    .from('players')
                    .select('name')
                    .in('id', game.team1);

                // Buscar informações dos jogadores do time 2
                const { data: team2Players } = await supabase
                    .from('players')
                    .select('name')
                    .in('id', game.team2);

                // Formatar os nomes dos times
                const team1Names = team1Players?.map(p => p.name).join(' e ') || 'Time 1';
                const team2Names = team2Players?.map(p => p.name).join(' e ') || 'Time 2';

                // Determinar o time vencedor
                const winningTeam = team1Score >= 6 ? team1Names : team2Names;
                const losingTeam = team1Score >= 6 ? team2Names : team1Names;
                const winningScore = team1Score >= 6 ? team1Score : team2Score;
                const losingScore = team1Score >= 6 ? team2Score : team1Score;

                // Construir a descrição do resultado
                let resultDescription = `${winningTeam} venceu ${losingTeam} por ${winningScore}x${losingScore}`;
                if (isBuchuda) {
                    resultDescription += ' (Buchuda!)';
                } else if (isBuchudaDeRe) {
                    resultDescription += ' (Buchuda de Ré!)';
                }

                const maxRetries = 3;
                const baseDelay = 1000;

                const createActivityWithRetry = async (attempt: number) => {
                    try {
                        console.log(`Tentativa ${attempt} de criar atividade...`);
                        await activityService.createActivity({
                            type: 'game',
                            description: `Jogo finalizado na Comunidade ${communityName}, Competição ${competition?.name || 'Desconhecida'}: ${resultDescription}`,
                            metadata: {
                                game_id: game.id,
                                competition_id: game.competition_id,
                                competition_name: competition?.name,
                                community_id: competition?.community_id,
                                community_name: communityName,
                                team1: {
                                    ids: game.team1,
                                    names: team1Players?.map(p => p.name) || [],
                                    score: team1Score
                                },
                                team2: {
                                    ids: game.team2,
                                    names: team2Players?.map(p => p.name) || [],
                                    score: team2Score
                                },
                                is_buchuda: isBuchuda,
                                is_buchuda_de_re: isBuchudaDeRe,
                                winning_team: team1Score >= 6 ? 1 : 2
                            }
                        });
                        console.log('Atividade criada com sucesso!');
                        return true;
                    } catch (activityError) {
                        console.error(`Erro na tentativa ${attempt}:`, activityError);
                        
                        if (attempt < maxRetries) {
                            const delay = baseDelay * Math.pow(2, attempt - 1);
                            console.log(`Aguardando ${delay}ms antes da próxima tentativa...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            return createActivityWithRetry(attempt + 1);
                        }
                        
                        console.error('Todas as tentativas de criar atividade falharam');
                        return false;
                    }
                };

                // Inicia o processo de retry em background
                createActivityWithRetry(1).catch(error => {
                    console.error('Erro no processo de retry:', error);
                });
            }

            return updatedGame;
        } catch (error) {
            console.error('Erro ao registrar rodada:', error);
            throw error;
        }
    },

    async listByCompetition(competitionId: string) {
        try {
            const { data, error } = await supabase
                .from('games')
                .select('*')
                .eq('competition_id', competitionId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao listar jogos:', error);
            throw error;
        }
    },

    async getById(id: string) {
        try {
            const { data, error } = await supabase
                .from('games')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao buscar jogo:', error);
            throw error;
        }
    },
    async getRecentActivities() {
        try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            const { data: playerData, error: playerError } = await supabase
                .from('players')
                .select('id')
                .eq('created_by', userData.user.id);

            if (playerError) throw playerError;

            if (!playerData || playerData.length === 0) {
                return [];
            }

            const playerIds = playerData.map(player => player.id);

            const { data, error } = await supabase
                .from('games')
                .select('*')
                .or(`team1.cs.{${playerIds.join(',')}},team2.cs.{${playerIds.join(',')}}`)  // Filtra jogos onde o jogador está em qualquer time
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) {
                console.error('Erro ao buscar atividades recentes:', error);
                throw new Error('Erro ao buscar atividades recentes');
            }

            return data;
        } catch (error) {
            console.error('Erro ao buscar atividades recentes:', error);
            throw error;
        }
    },

    async deleteGame(id: string) {
        try {
            // Primeiro, busca o jogo para verificar a competição
            const { data: game, error: gameError } = await supabase
                .from('games')
                .select('competition_id')
                .eq('id', id)
                .single();

            if (gameError) throw gameError;

            // Verifica o status da competição
            const { data: competition, error: competitionError } = await supabase
                .from('competitions')
                .select('status')
                .eq('id', game.competition_id)
                .single();

            if (competitionError) throw competitionError;

            // Se a competição estiver finalizada, não permite a exclusão
            if (competition.status === 'finished') {
                throw new Error('Não é possível excluir jogos de uma competição finalizada');
            }

            // Exclui o jogo
            const { error: deleteError } = await supabase
                .from('games')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            return true;
        } catch (error) {
            console.error('Erro ao excluir jogo:', error);
            throw error;
        }
    },

    async undoLastRound(id: string) {
        try {
            console.log('GameService: Desfazendo última rodada do jogo:', id);
            
            // Buscar o jogo atual
            const { data: game, error: getError } = await supabase
                .from('games')
                .select('*')
                .eq('id', id)
                .single();

            if (getError) throw getError;
            
            // Verificar se há rodadas para desfazer
            if (!game.rounds || game.rounds.length === 0) {
                throw new Error('Não há rodadas para desfazer');
            }

            // Obter a última rodada
            const lastRound = game.rounds[game.rounds.length - 1];
            console.log('GameService: Última rodada:', lastRound);

            // Remover a última rodada do array
            const updatedRounds = [...game.rounds];
            updatedRounds.pop();

            // Recalcular o placar
            let team1Score = 0;
            let team2Score = 0;
            let lastRoundWasTie = false;
            let team1WasLosing5_0 = false;
            let team2WasLosing5_0 = false;

            // Recalcular o placar baseado nas rodadas restantes
            for (let i = 0; i < updatedRounds.length; i++) {
                const round = updatedRounds[i];
                let points = 0;
                
                // Calcular pontos baseado no tipo de vitória
                switch (round.type) {
                    case 'simple':
                    case 'contagem':
                        points = 1;
                        break;
                    case 'carroca':
                        points = 2;
                        break;
                    case 'la_e_lo':
                        points = 3;
                        break;
                    case 'cruzada':
                        points = 4;
                        break;
                    case 'empate':
                        points = 0;
                        break;
                }

                // Adicionar bônus se a rodada anterior foi empate
                if (lastRoundWasTie && round.type !== 'empate') {
                    points += 1;
                }

                // Atualizar o placar
                if (round.winner_team === 1) {
                    team1Score += points;
                } else if (round.winner_team === 2) {
                    team2Score += points;
                }

                // Verificar se algum time está em desvantagem de 5x0
                if (team1Score === 0 && team2Score === 5) {
                    team1WasLosing5_0 = true;
                }
                if (team2Score === 0 && team1Score === 5) {
                    team2WasLosing5_0 = true;
                }

                // Atualizar o estado de empate para a próxima rodada
                lastRoundWasTie = round.type === 'empate';
            }

            // Verificar se é uma buchuda (vencer sem que o adversário pontue)
            const isBuchuda = (team1Score >= 6 && team2Score === 0) || (team2Score >= 6 && team1Score === 0);
            
            // Verificar se é uma buchuda de ré (time que estava perdendo de 5x0 venceu)
            const isBuchudaDeRe = 
                (team1Score >= 6 && team1WasLosing5_0) || 
                (team2Score >= 6 && team2WasLosing5_0);

            // Determinar o status do jogo
            const status = (team1Score >= 6 || team2Score >= 6) ? 'finished' : 'in_progress';

            // Atualizar o jogo no banco de dados
            const updateData = {
                team1_score: team1Score,
                team2_score: team2Score,
                rounds: updatedRounds,
                last_round_was_tie: lastRoundWasTie,
                status: status,
                is_buchuda: isBuchuda,
                is_buchuda_de_re: isBuchudaDeRe,
                team1_was_losing_5_0: team1WasLosing5_0,
                team2_was_losing_5_0: team2WasLosing5_0
            };

            console.log('GameService: Atualizando jogo após desfazer rodada:', updateData);

            const { data: updatedGame, error: updateError } = await supabase
                .from('games')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            return updatedGame;
        } catch (error) {
            console.error('Erro ao desfazer última rodada:', error);
            throw error;
        }
    },

    async listByPlayer(playerId: string) {
        try {
            // Busca jogos onde o jogador está em qualquer time
            const { data, error } = await supabase
                .from('games')
                .select('*, competitions(id, name)')
                .or(`team1.cs.{${playerId}},team2.cs.{${playerId}}`)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Erro ao buscar jogos do jogador:', error);
                throw error;
            }

            // Organiza os jogos por competição
            const gamesByCompetition = data?.reduce((acc, game) => {
                const competitionId = game.competition_id;
                const competitionName = game.competitions?.name || 'Competição Desconhecida';
                
                if (!acc[competitionId]) {
                    acc[competitionId] = {
                        id: competitionId,
                        name: competitionName,
                        games: []
                    };
                }
                
                acc[competitionId].games.push(game);
                return acc;
            }, {});

            // Converte o objeto em array
            const result = Object.values(gamesByCompetition || {});
            
            return result;
        } catch (error) {
            console.error('Erro ao listar jogos do jogador:', error);
            throw error;
        }
    }
};
