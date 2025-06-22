import { supabase } from '../../../core/lib/supabase';
import { Competition, Game, Player } from '../../../core/types/database.types';

export interface DashboardGameData extends Game {
  competition_name?: string;
  updated_at: string;
  is_buchuda?: boolean;
  is_buchuda_de_re?: boolean;
  team1_players: Array<{
    id: string;
    name: string;
    avatar_url?: string;
  }>;
  team2_players: Array<{
    id: string;
    name: string;
    avatar_url?: string;
  }>;
}

export interface DashboardData {
  activeCompetitions: Competition[];
  ongoingGames: DashboardGameData[];
  finishedGamesLastHour: DashboardGameData[];
  upcomingGames: DashboardGameData[];
}

export const dashboardService = {
  // Busca competições ativas (em progresso)
  async getActiveCompetitions(): Promise<Competition[]> {
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('status', 'in_progress' as any)
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []) as Competition[];
    } catch (error) {
      console.error('Erro ao buscar competições ativas:', error);
      return [];
    }
  },

  // Busca jogos em andamento de uma competição específica
  async getOngoingGames(competitionId?: string): Promise<DashboardGameData[]> {
    try {
      let query = supabase
        .from('games')
        .select(`
          *,
          competitions!inner(name)
        `)
        .eq('status', 'in_progress' as any)
        .order('created_at', { ascending: false });

      if (competitionId) {
        query = query.eq('competition_id', competitionId as any);
      }

      const { data: games, error } = await query;
      if (error) throw error;

      if (!games || games.length === 0) return [];

      // Buscar informações dos jogadores para cada jogo
      const gamesWithPlayers = await Promise.all(
        games.map(async (game: any) => {
          const team1Ids = game.team1 || [];
          const team2Ids = game.team2 || [];
          const allPlayerIds = [...team1Ids, ...team2Ids];

          const { data: players } = await supabase
            .from('players')
            .select('id, name, avatar_url')
            .in('id', allPlayerIds);

          const playersMap = new Map(players?.map(p => [p.id, p]) || []);

          return {
            ...game,
            competition_name: game.competitions?.name,
            team1_players: team1Ids.map(id => playersMap.get(id)).filter(Boolean),
            team2_players: team2Ids.map(id => playersMap.get(id)).filter(Boolean),
          };
        })
      );

      return gamesWithPlayers;
    } catch (error) {
      console.error('Erro ao buscar jogos em andamento:', error);
      return [];
    }
  },

  // Busca jogos finalizados na última hora
  async getRecentFinishedGames(competitionId?: string): Promise<DashboardGameData[]> {
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      let query = supabase
        .from('games')
        .select(`
          *,
          competitions!inner(name)
        `)
        .eq('status', 'finished')
        .gte('updated_at', oneHourAgo.toISOString())
        .order('updated_at', { ascending: false })
        .limit(10);

      if (competitionId) {
        query = query.eq('competition_id', competitionId);
      }

      const { data: games, error } = await query;
      if (error) throw error;

      if (!games || games.length === 0) return [];

      // Buscar informações dos jogadores para cada jogo
      const gamesWithPlayers = await Promise.all(
        games.map(async (game: any) => {
          const team1Ids = game.team1 || [];
          const team2Ids = game.team2 || [];
          const allPlayerIds = [...team1Ids, ...team2Ids];

          const { data: players } = await supabase
            .from('players')
            .select('id, name, avatar_url')
            .in('id', allPlayerIds);

          const playersMap = new Map(players?.map(p => [p.id, p]) || []);

          return {
            ...game,
            competition_name: game.competitions?.name,
            team1_players: team1Ids.map(id => playersMap.get(id)).filter(Boolean),
            team2_players: team2Ids.map(id => playersMap.get(id)).filter(Boolean),
          };
        })
      );

      return gamesWithPlayers;
    } catch (error) {
      console.error('Erro ao buscar jogos finalizados recentes:', error);
      return [];
    }
  },

  // Busca jogos pendentes/próximos
  async getUpcomingGames(competitionId?: string): Promise<DashboardGameData[]> {
    try {
      let query = supabase
        .from('games')
        .select(`
          *,
          competitions!inner(name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(5);

      if (competitionId) {
        query = query.eq('competition_id', competitionId);
      }

      const { data: games, error } = await query;
      if (error) throw error;

      if (!games || games.length === 0) return [];

      // Buscar informações dos jogadores para cada jogo
      const gamesWithPlayers = await Promise.all(
        games.map(async (game: any) => {
          const team1Ids = game.team1 || [];
          const team2Ids = game.team2 || [];
          const allPlayerIds = [...team1Ids, ...team2Ids];

          const { data: players } = await supabase
            .from('players')
            .select('id, name, avatar_url')
            .in('id', allPlayerIds);

          const playersMap = new Map(players?.map(p => [p.id, p]) || []);

          return {
            ...game,
            competition_name: game.competitions?.name,
            team1_players: team1Ids.map(id => playersMap.get(id)).filter(Boolean),
            team2_players: team2Ids.map(id => playersMap.get(id)).filter(Boolean),
          };
        })
      );

      return gamesWithPlayers;
    } catch (error) {
      console.error('Erro ao buscar próximos jogos:', error);
      return [];
    }
  },

  // Busca todos os dados do dashboard
  async getDashboardData(competitionId?: string): Promise<DashboardData> {
    try {
      const [activeCompetitions, ongoingGames, finishedGamesLastHour, upcomingGames] = 
        await Promise.all([
          this.getActiveCompetitions(),
          this.getOngoingGames(competitionId),
          this.getRecentFinishedGames(competitionId),
          this.getUpcomingGames(competitionId)
        ]);

      return {
        activeCompetitions,
        ongoingGames,
        finishedGamesLastHour,
        upcomingGames
      };
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      return {
        activeCompetitions: [],
        ongoingGames: [],
        finishedGamesLastHour: [],
        upcomingGames: []
      };
    }
  },

  // Subscrever mudanças em jogos para uma competição
  subscribeToGamesUpdates(
    competitionId: string | null,
    onUpdate: (payload: any) => void
  ) {
    // Subscribe to games table changes
    const gamesSubscription = supabase
      .channel('dashboard-games')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          ...(competitionId && { filter: `competition_id=eq.${competitionId}` })
        },
        onUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gamesSubscription);
    };
  },

  // Subscrever mudanças em competições
  subscribeToCompetitionsUpdates(onUpdate: (payload: any) => void) {
    const competitionsSubscription = supabase
      .channel('dashboard-competitions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'competitions'
        },
        onUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(competitionsSubscription);
    };
  }
}; 