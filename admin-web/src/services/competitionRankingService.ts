import { supabase } from '../lib/supabase';

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
  winRate: number;
  buchudas: number;
  buchudasTaken: number;
  buchudasDeRe: number;
  buchudasDeReTaken: number;
}

export interface CompetitionStatus {
  id: string;
  name: string;
  status: 'in_progress' | 'finished' | 'pending';
  isFinished: boolean;
  champion?: {
    player?: PlayerRanking;
    pair?: PairRanking;
  };
}

export const competitionRankingService = {
  async getPlayerRankingByCompetition(competitionId: string): Promise<PlayerRanking[]> {
    try {
      console.log('🏆 Buscando ranking de jogadores para competição:', competitionId);

      // Buscar jogos da competição
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .eq('competition_id', competitionId)
        .eq('status', 'finished');

      if (gamesError) {
        console.error('Erro ao buscar jogos:', gamesError);
        return [];
      }

      if (!games || games.length === 0) {
        console.log('Nenhum jogo finalizado encontrado para a competição');
        return [];
      }

      // Extrair IDs únicos de jogadores
      const playerIds = new Set<string>();
      games.forEach((game: any) => {
        const team1 = game.team1 || [];
        const team2 = game.team2 || [];
        [...team1, ...team2].forEach((id: string) => playerIds.add(id));
      });

      // Buscar dados dos jogadores
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id, name, avatar_url')
        .in('id', Array.from(playerIds));

      if (playersError) {
        console.error('Erro ao buscar jogadores:', playersError);
        return [];
      }

      // Criar mapa de jogadores
      const playersMap = new Map(players?.map((p: any) => [p.id, p]) || []);

      // Calcular estatísticas
      const playerStats = new Map<string, PlayerRanking>();

      // Inicializar estatísticas
      playerIds.forEach(playerId => {
        const player = playersMap.get(playerId);
        if (player) {
          playerStats.set(playerId, {
            id: playerId,
            name: player.name,
            avatar_url: player.avatar_url,
            wins: 0,
            losses: 0,
            totalGames: 0,
            pointsGained: 0,
            pointsLost: 0,
            winRate: 0,
            buchudas: 0,
            buchudasTaken: 0,
            buchudasDeRe: 0,
            buchudasDeReTaken: 0,
          });
        }
      });

      // Processar jogos
      games.forEach((game: any) => {
        const team1 = game.team1 || [];
        const team2 = game.team2 || [];
        const team1Score = game.team1_score || 0;
        const team2Score = game.team2_score || 0;

        // Processar team1
        team1.forEach((playerId: string) => {
          const stats = playerStats.get(playerId);
          if (stats) {
            stats.totalGames++;
            stats.pointsGained += team1Score;
            stats.pointsLost += team2Score;

            if (team1Score > team2Score) {
              stats.wins++;
              if (team2Score === 0) stats.buchudas++;
              if (game.is_buchuda_de_re) stats.buchudasDeRe++;
            } else {
              stats.losses++;
              if (game.is_buchuda && team1Score === 0) stats.buchudasTaken++;
              if (game.is_buchuda_de_re) stats.buchudasDeReTaken++;
            }

            stats.winRate = stats.totalGames > 0 ? (stats.wins / stats.totalGames) * 100 : 0;
          }
        });

        // Processar team2
        team2.forEach((playerId: string) => {
          const stats = playerStats.get(playerId);
          if (stats) {
            stats.totalGames++;
            stats.pointsGained += team2Score;
            stats.pointsLost += team1Score;

            if (team2Score > team1Score) {
              stats.wins++;
              if (team1Score === 0) stats.buchudas++;
              if (game.is_buchuda_de_re) stats.buchudasDeRe++;
            } else {
              stats.losses++;
              if (game.is_buchuda && team2Score === 0) stats.buchudasTaken++;
              if (game.is_buchuda_de_re) stats.buchudasDeReTaken++;
            }

            stats.winRate = stats.totalGames > 0 ? (stats.wins / stats.totalGames) * 100 : 0;
          }
        });
      });

      // Converter para array e ordenar
      return Array.from(playerStats.values())
        .filter(player => player.totalGames > 0)
        .sort((a, b) => {
          // 1. Maior número de vitórias
          if (b.wins !== a.wins) return b.wins - a.wins;
          // 2. Menor número de derrotas
          if (a.losses !== b.losses) return a.losses - b.losses;
          // 3. Maior taxa de vitória
          if (b.winRate !== a.winRate) return b.winRate - a.winRate;
          // 4. Maior pontuação
          return b.pointsGained - a.pointsGained;
        });

    } catch (error) {
      console.error('Erro ao buscar ranking de jogadores:', error);
      return [];
    }
  },

  async getPairRankingByCompetition(competitionId: string): Promise<PairRanking[]> {
    try {
      console.log('🏆 Buscando ranking de duplas para competição:', competitionId);

      // Buscar jogos da competição (apenas 2x2)
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .eq('competition_id', competitionId)
        .eq('status', 'finished');

      if (gamesError || !games) return [];

      // Filtrar apenas jogos 2x2
      const validGames = games.filter((game: any) => {
        const team1 = game.team1 || [];
        const team2 = game.team2 || [];
        return team1.length === 2 && team2.length === 2;
      });

      if (validGames.length === 0) return [];

      // Extrair IDs de jogadores
      const playerIds = new Set<string>();
      validGames.forEach((game: any) => {
        const team1 = game.team1 || [];
        const team2 = game.team2 || [];
        [...team1, ...team2].forEach((id: string) => playerIds.add(id));
      });

      // Buscar dados dos jogadores
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id, name, avatar_url')
        .in('id', Array.from(playerIds));

      if (playersError || !players) return [];

      const playersMap = new Map(players.map((p: any) => [p.id, p]));

      // Calcular estatísticas de duplas
      const pairStats = new Map<string, any>();

      const getPairKey = (id1: string, id2: string) => [id1, id2].sort().join('_');

      validGames.forEach((game: any) => {
        const team1 = game.team1;
        const team2 = game.team2;
        const team1Score = game.team1_score || 0;
        const team2Score = game.team2_score || 0;

        // Processar dupla 1
        const pair1Key = getPairKey(team1[0], team1[1]);
        if (!pairStats.has(pair1Key)) {
          const player1 = playersMap.get(team1[0]);
          const player2 = playersMap.get(team1[1]);
          if (player1 && player2) {
            pairStats.set(pair1Key, {
              id: pair1Key,
              player1: { id: player1.id, name: player1.name, avatar_url: player1.avatar_url },
              player2: { id: player2.id, name: player2.name, avatar_url: player2.avatar_url },
              wins: 0,
              losses: 0,
              totalGames: 0,
              pointsGained: 0,
              pointsLost: 0,
              winRate: 0,
              buchudas: 0,
              buchudasTaken: 0,
              buchudasDeRe: 0,
              buchudasDeReTaken: 0,
            });
          }
        }

        const pair1Stats = pairStats.get(pair1Key);
        if (pair1Stats) {
          pair1Stats.totalGames++;
          pair1Stats.pointsGained += team1Score;
          pair1Stats.pointsLost += team2Score;

          if (team1Score > team2Score) {
            pair1Stats.wins++;
            if (team2Score === 0) pair1Stats.buchudas++;
            if (game.is_buchuda_de_re) pair1Stats.buchudasDeRe++;
          } else {
            pair1Stats.losses++;
            if (game.is_buchuda && team1Score === 0) pair1Stats.buchudasTaken++;
            if (game.is_buchuda_de_re) pair1Stats.buchudasDeReTaken++;
          }

          pair1Stats.winRate = pair1Stats.totalGames > 0 ? (pair1Stats.wins / pair1Stats.totalGames) * 100 : 0;
        }

        // Processar dupla 2
        const pair2Key = getPairKey(team2[0], team2[1]);
        if (!pairStats.has(pair2Key)) {
          const player1 = playersMap.get(team2[0]);
          const player2 = playersMap.get(team2[1]);
          if (player1 && player2) {
            pairStats.set(pair2Key, {
              id: pair2Key,
              player1: { id: player1.id, name: player1.name, avatar_url: player1.avatar_url },
              player2: { id: player2.id, name: player2.name, avatar_url: player2.avatar_url },
              wins: 0,
              losses: 0,
              totalGames: 0,
              pointsGained: 0,
              pointsLost: 0,
              winRate: 0,
              buchudas: 0,
              buchudasTaken: 0,
              buchudasDeRe: 0,
              buchudasDeReTaken: 0,
            });
          }
        }

        const pair2Stats = pairStats.get(pair2Key);
        if (pair2Stats) {
          pair2Stats.totalGames++;
          pair2Stats.pointsGained += team2Score;
          pair2Stats.pointsLost += team1Score;

          if (team2Score > team1Score) {
            pair2Stats.wins++;
            if (team1Score === 0) pair2Stats.buchudas++;
            if (game.is_buchuda_de_re) pair2Stats.buchudasDeRe++;
          } else {
            pair2Stats.losses++;
            if (game.is_buchuda && team2Score === 0) pair2Stats.buchudasTaken++;
            if (game.is_buchuda_de_re) pair2Stats.buchudasDeReTaken++;
          }

          pair2Stats.winRate = pair2Stats.totalGames > 0 ? (pair2Stats.wins / pair2Stats.totalGames) * 100 : 0;
        }
      });

      return Array.from(pairStats.values())
        .filter((pair: any) => pair.totalGames > 0)
        .sort((a: any, b: any) => {
          if (b.wins !== a.wins) return b.wins - a.wins;
          if (a.losses !== b.losses) return a.losses - b.losses;
          if (b.winRate !== a.winRate) return b.winRate - a.winRate;
          return b.pointsGained - a.pointsGained;
        });

    } catch (error) {
      console.error('Erro ao buscar ranking de duplas:', error);
      return [];
    }
  },

  async getCompetitionStatus(competitionId: string): Promise<CompetitionStatus | null> {
    try {
      // Buscar dados da competição
      const { data: competition, error: compError } = await supabase
        .from('competitions')
        .select('id, name, status')
        .eq('id', competitionId)
        .single();

      if (compError || !competition) return null;

      const isFinished = competition.status === 'finished';
      const result: CompetitionStatus = {
        id: competition.id,
        name: competition.name,
        status: competition.status,
        isFinished,
      };

      // Se a competição estiver finalizada, buscar campeões
      if (isFinished) {
        const [playerRanking, pairRanking] = await Promise.all([
          this.getPlayerRankingByCompetition(competitionId),
          this.getPairRankingByCompetition(competitionId)
        ]);

        result.champion = {
          player: playerRanking[0] || undefined,
          pair: pairRanking[0] || undefined,
        };
      }

      return result;
    } catch (error) {
      console.error('Erro ao buscar status da competição:', error);
      return null;
    }
  }
}; 