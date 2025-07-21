import { supabase } from '@/core/lib/supabase';

/**
 * Serviço para gerenciar estatísticas de competições
 */
export const competitionStatsService = {
  /**
   * Obtém estatísticas de uma competição
   * @param competitionId ID da competição
   * @returns Estatísticas da competição
   */
  async getCompetitionStats(competitionId: string) {
    try {
      console.log(`[competitionStatsService] Buscando estatísticas para competição ${competitionId}`);
      
      // Buscar número de jogadores na competição
      const { count: totalPlayers, error: playersError } = await supabase
        .from('competition_members')
        .select('*', { count: 'exact', head: true })
        .eq('competition_id', competitionId);
      
      if (playersError) {
        console.error('[competitionStatsService] Erro ao buscar jogadores:', playersError);
        throw playersError;
      }
      
      // Buscar jogos da competição
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('id, status')
        .eq('competition_id', competitionId);
      
      if (gamesError) {
        console.error('[competitionStatsService] Erro ao buscar jogos:', gamesError);
        throw gamesError;
      }
      
      // Calcular estatísticas dos jogos
      const totalGames = games?.length || 0;
      const finishedGames = games?.filter(game => game.status === 'finished').length || 0;
      const pendingGames = games?.filter(game => game.status === 'pending').length || 0;
      const inProgressGames = games?.filter(game => game.status === 'in_progress').length || 0;
      
      const hasFinishedGames = finishedGames > 0;
      const hasOnlyPendingOrInProgress = totalGames > 0 && finishedGames === 0;
      
      console.log(`[competitionStatsService] Estatísticas para competição ${competitionId}:`, {
        totalPlayers,
        totalGames,
        finishedGames,
        pendingGames,
        inProgressGames,
        hasFinishedGames,
        hasOnlyPendingOrInProgress
      });
      
      return {
        totalPlayers: totalPlayers || 0,
        totalGames,
        hasFinishedGames,
        hasOnlyPendingOrInProgress
      };
    } catch (error) {
      console.error(`[competitionStatsService] Erro ao buscar estatísticas para competição ${competitionId}:`, error);
      // Retorna valores padrão em caso de erro
      return {
        totalPlayers: 0,
        totalGames: 0,
        hasFinishedGames: false,
        hasOnlyPendingOrInProgress: false
      };
    }
  }
};