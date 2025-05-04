import { supabase } from '@/lib/supabase';
import { competitionService } from './competitionService';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserStats {
    totalGames: number;
    totalCompetitions: number;
    totalPlayers: number;
    averageScore: number;
    totalCommunities: number;
}

interface MonthlyGamesData {
    labels: string[];
    data: number[];
}

export const statisticsService = {
    async getMonthlyGamesData(): Promise<MonthlyGamesData> {
        try {
            console.log('[statisticsService] Iniciando busca de jogos por mês...');
            
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                console.error('[statisticsService] Erro de autenticação:', userError);
                throw new Error('Usuário não autenticado');
            }
            
            // Verificar se a sessão está ativa
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionData.session) {
                console.error('[statisticsService] Sessão inválida:', sessionError);
                throw new Error('Sessão de usuário inválida');
            }

            // Buscar comunidades onde o usuário é membro
            const { data: memberCommunities, error: memberError } = await supabase
                .from('community_members')
                .select('community_id')
                .eq('player_id', user.id);

            if (memberError) {
                console.error('[statisticsService] Erro ao buscar comunidades como membro:', memberError);
                throw new Error('Erro ao buscar comunidades do usuário');
            }

            // Buscar comunidades onde o usuário é organizador/criador
            const { data: organizerCommunities, error: organizerError } = await supabase
                .from('communities')
                .select('id')
                .eq('created_by', user.id);

            if (organizerError) {
                console.error('[statisticsService] Erro ao buscar comunidades como organizador:', organizerError);
                console.log('[statisticsService] Continuando apenas com comunidades como membro');
            }

            // Combinar IDs únicos de comunidades
            const memberIds = memberCommunities?.map(c => c.community_id) || [];
            const organizerIds = organizerCommunities?.map(c => c.id) || [];
            const communityIds = [...new Set([...memberIds, ...organizerIds])];

            if (communityIds.length === 0) {
                console.log('[statisticsService] Nenhuma comunidade encontrada para o usuário');
                return {
                    labels: [],
                    data: []
                };
            }

            // Buscar competições usando o competitionService
            const competitionsPromises = communityIds.map(communityId => 
                competitionService.refreshCompetitions(communityId)
            );

            const competitionsArrays = await Promise.all(competitionsPromises);
            const competitions = competitionsArrays.flat();
            const competitionIds = competitions.map(c => c.id);

            if (competitionIds.length === 0) {
                console.log('[statisticsService] Nenhuma competição encontrada');
                return {
                    labels: [],
                    data: []
                };
            }

            // Obter os últimos 6 meses
            const today = new Date();
            const months = [];
            const monthsLabels = [];
            
            for (let i = 5; i >= 0; i--) {
                const month = subMonths(today, i);
                const monthStart = startOfMonth(month);
                const monthEnd = endOfMonth(month);
                
                months.push({
                    start: monthStart,
                    end: monthEnd,
                    label: format(month, 'MMM', { locale: ptBR })
                });
                
                monthsLabels.push(format(month, 'MMM', { locale: ptBR }));
            }

            // Buscar jogos das competições
            const gamesPromises = competitionIds.map(async (competitionId) => {
                try {
                    const { data, error } = await supabase
                        .from('games')
                        .select('id, created_at')
                        .eq('competition_id', competitionId)
                        .throwOnError();
                    
                    return error ? [] : (data || []);
                } catch (error) {
                    console.error(`[statisticsService] Erro ao buscar jogos para competição ${competitionId}:`, error);
                    return [];
                }
            });

            const gamesArrays = await Promise.all(gamesPromises);
            const games = gamesArrays.flat();

            // Agrupar jogos por mês
            const gamesByMonth = months.map(month => {
                const gamesInMonth = games.filter(game => {
                    const gameDate = new Date(game.created_at);
                    return gameDate >= month.start && gameDate <= month.end;
                });
                return gamesInMonth.length;
            });

            console.log('[statisticsService] Dados de jogos por mês:', {
                labels: monthsLabels,
                data: gamesByMonth
            });

            return {
                labels: monthsLabels,
                data: gamesByMonth
            };
        } catch (error) {
            console.error('[statisticsService] Erro ao buscar jogos por mês:', error);
            // Retornar dados vazios em caso de erro
            return {
                labels: [],
                data: []
            };
        }
    },
    async getUserStats(): Promise<UserStats> {
        try {
            console.log('[statisticsService] Iniciando busca de estatísticas...');
            
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                console.error('[statisticsService] Erro de autenticação:', userError);
                throw new Error('Usuário não autenticado');
            }
            
            console.log('[statisticsService] Usuário autenticado:', user.id);

            // Verificar se a sessão está ativa
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionData.session) {
                console.error('[statisticsService] Sessão inválida:', sessionError);
                throw new Error('Sessão de usuário inválida');
            }

            // Buscar comunidades onde o usuário é membro
            const { data: memberCommunities, error: memberError } = await supabase
                .from('community_members')
                .select('community_id')
                .eq('player_id', user.id);

            if (memberError) {
                console.error('[statisticsService] Erro ao buscar comunidades como membro:', memberError);
                throw new Error('Erro ao buscar comunidades do usuário');
            }

            console.log('[statisticsService] Comunidades como membro:', memberCommunities);

            // Buscar comunidades onde o usuário é organizador/criador
            const { data: organizerCommunities, error: organizerError } = await supabase
                .from('communities')
                .select('id')
                .eq('created_by', user.id);

            if (organizerError) {
                console.error('[statisticsService] Erro ao buscar comunidades como organizador:', organizerError);
                console.log('[statisticsService] Continuando apenas com comunidades como membro');
            } else {
                console.log('[statisticsService] Comunidades como organizador:', organizerCommunities);
            }

            // Combinar IDs únicos de comunidades
            const memberIds = memberCommunities?.map(c => c.community_id) || [];
            const organizerIds = organizerCommunities?.map(c => c.id) || [];
            const communityIds = [...new Set([...memberIds, ...organizerIds])];

            console.log('[statisticsService] IDs de comunidades encontradas:', communityIds);

            // Se não houver comunidades, retornar zeros
            if (communityIds.length === 0) {
                console.log('[statisticsService] Nenhuma comunidade encontrada para o usuário');
                return {
                    totalGames: 0,
                    totalCompetitions: 0,
                    totalPlayers: 0,
                    averageScore: 0,
                    totalCommunities: 0
                };
            }

            // Buscar competições usando o competitionService
            const competitionsPromises = communityIds.map(communityId => 
                competitionService.refreshCompetitions(communityId)
            );

            const competitionsArrays = await Promise.all(competitionsPromises);
            const competitions = competitionsArrays.flat();
            const competitionIds = competitions.map(c => c.id);

            console.log('[statisticsService] Total de competições encontradas:', competitionIds.length);

            // Buscar jogos das competições
            let totalGames = 0;
            if (competitionIds.length > 0) {
                const gamesPromises = competitionIds.map(async (competitionId) => {
                    try {
                        const { data, error } = await supabase
                            .from('games')
                            .select('id')
                            .eq('competition_id', competitionId)
                            .throwOnError();
                        
                        return error ? [] : (data || []);
                    } catch (error) {
                        console.error(`[statisticsService] Erro ao buscar jogos para competição ${competitionId}:`, error);
                        return [];
                    }
                });

                const gamesArrays = await Promise.all(gamesPromises);
                const games = gamesArrays.flat();
                totalGames = games.length;
                console.log('[statisticsService] Total de jogos encontrados:', totalGames);
            }

            // Buscar jogadores das comunidades
            const { data: players, error: playersError } = await supabase
                .from('community_members')
                .select('player_id')
                .in('community_id', communityIds);

            if (playersError) {
                console.error('[statisticsService] Erro ao buscar jogadores:', playersError);
                throw new Error('Erro ao buscar jogadores');
            }

            // Remover duplicatas de jogadores
            const uniquePlayers = new Set(players?.map(p => p.player_id) || []);
            const totalPlayers = uniquePlayers.size;
            console.log('[statisticsService] Total de jogadores únicos:', totalPlayers);

            // Calcular média de pontos
            let averageScore = 0;
            if (competitionIds.length > 0) {
                const scoresPromises = competitionIds.map(async (competitionId) => {
                    try {
                        const { data, error } = await supabase
                            .from('games')
                            .select('team1_score, team2_score')
                            .eq('competition_id', competitionId)
                            .throwOnError();
                        
                        return error ? [] : (data || []);
                    } catch (error) {
                        console.error(`[statisticsService] Erro ao buscar pontuações para competição ${competitionId}:`, error);
                        return [];
                    }
                });

                const scoresArrays = await Promise.all(scoresPromises);
                const scores = scoresArrays.flat();
                
                const validScores = scores.filter(s => 
                    s.team1_score !== null && 
                    s.team2_score !== null);
                
                if (validScores.length > 0) {
                    const totalScores = validScores.reduce((acc, game) => 
                        acc + (game.team1_score || 0) + (game.team2_score || 0), 0);
                    averageScore = totalScores / (validScores.length * 2);
                    averageScore = Math.round(averageScore * 10) / 10;
                }
            }

            // Montar objeto de estatísticas
            const stats = {
                totalGames,
                totalCompetitions: competitionIds.length,
                totalPlayers,
                averageScore,
                totalCommunities: communityIds.length
            };

            console.log('[statisticsService] Estatísticas calculadas:', stats);
            return stats;

        } catch (error) {
            console.error('[statisticsService] Erro ao buscar estatísticas:', error);
            throw error;
        }
    }
};
