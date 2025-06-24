import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import RankingSidebar from './components/RankingSidebar';
import './dashboard.css';

interface Game {
  id: string;
  competition_id: string;
  team1: string[];
  team2: string[];
  team1_score: number;
  team2_score: number;
  status: 'pending' | 'in_progress' | 'finished';
  created_at: string;
  updated_at: string;
  is_buchuda?: boolean;
  is_buchuda_de_re?: boolean;
  rounds?: any[];
}

interface Competition {
  id: string;
  name: string;
  description: string;
  status: string;
}

interface DashboardGameData extends Game {
  competition_name?: string;
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

const Dashboard: React.FC = () => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(null);
  const [ongoingGames, setOngoingGames] = useState<DashboardGameData[]>([]);
  const [finishedGames, setFinishedGames] = useState<DashboardGameData[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<DashboardGameData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  // Carregar competições ativas
  const loadCompetitions = async () => {
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('status', 'in_progress')
        .order('name', { ascending: true });

      if (error) throw error;
      setCompetitions(data || []);
    } catch (error) {
      console.error('Erro ao carregar competições:', error);
    }
  };

  // Carregar jogos com informações dos jogadores
  const loadGames = async (competitionId: string | null) => {
    try {
      setLoading(true);

      // Jogos em andamento
      let ongoingQuery = supabase
        .from('games')
        .select(`
          *,
          competitions!inner(name)
        `)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false });

      if (competitionId) {
        ongoingQuery = ongoingQuery.eq('competition_id', competitionId);
      }

      const { data: ongoingData } = await ongoingQuery;

      // Jogos finalizados na última hora
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      let finishedQuery = supabase
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
        finishedQuery = finishedQuery.eq('competition_id', competitionId);
      }

      const { data: finishedData } = await finishedQuery;

      // Jogos pendentes
      let upcomingQuery = supabase
        .from('games')
        .select(`
          *,
          competitions!inner(name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(5);

      if (competitionId) {
        upcomingQuery = upcomingQuery.eq('competition_id', competitionId);
      }

      const { data: upcomingData } = await upcomingQuery;

      // Buscar informações dos jogadores para todos os jogos
      const allGames = [...(ongoingData || []), ...(finishedData || []), ...(upcomingData || [])];
      const gamesWithPlayers = await Promise.all(
        allGames.map(async (game: any) => {
          const team1Ids = game.team1 || [];
          const team2Ids = game.team2 || [];
          const allPlayerIds = [...team1Ids, ...team2Ids];

          if (allPlayerIds.length === 0) {
            return {
              ...game,
              competition_name: game.competitions?.name,
              team1_players: [],
              team2_players: [],
            };
          }

          const { data: players } = await supabase
            .from('players')
            .select('id, name, avatar_url')
            .in('id', allPlayerIds);

          const playersMap = new Map(players?.map((p: any) => [p.id, p]) || []);

          return {
            ...game,
            competition_name: game.competitions?.name,
            team1_players: team1Ids.map((id: string) => playersMap.get(id)).filter(Boolean),
            team2_players: team2Ids.map((id: string) => playersMap.get(id)).filter(Boolean),
          };
        })
      );

      // Separar os jogos
      const gamesMap = new Map(gamesWithPlayers.map(game => [game.id, game]));
      
      setOngoingGames((ongoingData || []).map((game: any) => gamesMap.get(game.id)).filter(Boolean));
      setFinishedGames((finishedData || []).map((game: any) => gamesMap.get(game.id)).filter(Boolean));
      setUpcomingGames((upcomingData || []).map((game: any) => gamesMap.get(game.id)).filter(Boolean));
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Erro ao carregar jogos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregamento inicial
  useEffect(() => {
    loadCompetitions();
    loadGames(selectedCompetitionId);
  }, [selectedCompetitionId]);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadGames(selectedCompetitionId);
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedCompetitionId]);

  // Setup de subscriptions para atualizações em tempo real
  useEffect(() => {
    const gamesSubscription = supabase
      .channel('dashboard-games')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
        },
        () => {
          console.log('Atualização em tempo real detectada - recarregando dados...');
          loadGames(selectedCompetitionId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gamesSubscription);
    };
  }, [selectedCompetitionId]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatLastUpdated = (date: Date) => {
    return `Última atualização: ${date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })}`;
  };

  const renderGameCard = (game: DashboardGameData) => {
    const team1Score = game.team1_score || 0;
    const team2Score = game.team2_score || 0;
    const team1Winning = team1Score > team2Score;
    const team2Winning = team2Score > team1Score;
    const isFinished = game.status === 'finished';
    const roundsCount = game.rounds?.length || 0;

    const getStatusText = (status: string) => {
      switch (status) {
        case 'in_progress': return 'Em Andamento';
        case 'finished': return 'Finalizado';
        case 'pending': return 'Aguardando';
        default: return status;
      }
    };

    const getStatusClass = (status: string) => {
      switch (status) {
        case 'in_progress': return 'status-in-progress';
        case 'finished': return 'status-finished';
        case 'pending': return 'status-pending';
        default: return 'status-pending';
      }
    };

    return (
      <div key={game.id} className={`game-card ${getStatusClass(game.status)}`}>
        <div className="game-header">
          {!selectedCompetitionId && (
            <div className="competition-name">{game.competition_name}</div>
          )}
          <div className={`status-badge ${getStatusClass(game.status)}`}>
            {getStatusText(game.status)}
          </div>
        </div>

        <div className="teams-container">
          <div className="team-container">
            <div className="players-container">
              {game.team1_players.map((player) => (
                <div key={player.id} className="player-container">
                  <div className="player-avatar">
                    {player.avatar_url ? (
                      <img src={player.avatar_url} alt={player.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="player-name">{player.name}</div>
                </div>
              ))}
            </div>
            {isFinished && team1Winning && (
              <div className="winner-indicator">VENCEDOR</div>
            )}
          </div>

          <div className="score-container">
            <div className={`score ${team1Winning && isFinished ? 'winning' : ''}`}>
              {team1Score}
            </div>
            <div className="separator">×</div>
            <div className={`score ${team2Winning && isFinished ? 'winning' : ''}`}>
              {team2Score}
            </div>
          </div>

          <div className="team-container">
            <div className="players-container">
              {game.team2_players.map((player) => (
                <div key={player.id} className="player-container">
                  <div className="player-avatar">
                    {player.avatar_url ? (
                      <img src={player.avatar_url} alt={player.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="player-name">{player.name}</div>
                </div>
              ))}
            </div>
            {isFinished && team2Winning && (
              <div className="winner-indicator">VENCEDOR</div>
            )}
          </div>
        </div>

        <div className="game-details">
          <div className="detail-item">
            <div className="detail-label">Rodadas</div>
            <div className="detail-value">{roundsCount}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Iniciado</div>
            <div className="detail-value">{formatTime(game.created_at)}</div>
          </div>
          {isFinished && (
            <div className="detail-item">
              <div className="detail-label">Finalizado</div>
              <div className="detail-value">{formatTime(game.updated_at)}</div>
            </div>
          )}
          {(game.is_buchuda || game.is_buchuda_de_re) && (
            <div className="detail-item">
              <div className="detail-label">Especial</div>
              <div className="detail-value">
                {game.is_buchuda_de_re ? 'Buchuda de Ré' : 'Buchuda'}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>🏆 Jogos Online - Ao Vivo</h1>
        <p>Acompanhe os jogos em tempo real</p>
        <div className="live-indicator">
          <div className="live-dot"></div>
          <span>AO VIVO</span>
        </div>
      </div>

      <div className="dashboard-with-sidebar" style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '32px',
        alignItems: 'flex-start',
        padding: '0 32px 32px',
        width: '100%'
      }}>
        <div className="dashboard-main-content" style={{
          flex: 1,
          width: '60%'
        }}>
          <div className="dashboard-content" style={{
            maxWidth: 'none',
            margin: 0,
            padding: 0,
            width: '100%'
          }}>
            <div className="last-updated">
              {formatLastUpdated(lastUpdated)}
              {loading && (
                <span className="loading-indicator">
                  <span className="loading-dot"></span>
                  Atualizando...
                </span>
              )}
            </div>

            <div className="competition-selector">
              <h2>Filtrar por Competição</h2>
              <div className="competition-chips">
                <button
                  className={`competition-chip ${selectedCompetitionId === null ? 'selected' : ''}`}
                  onClick={() => setSelectedCompetitionId(null)}
                >
                  Todas as Competições
                </button>
                {competitions.map((competition) => (
                  <button
                    key={competition.id}
                    className={`competition-chip ${selectedCompetitionId === competition.id ? 'selected' : ''}`}
                    onClick={() => setSelectedCompetitionId(competition.id)}
                  >
                    {competition.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="dashboard-section">
              <div className="section-header in-progress">
                <div className="section-title">
                  <i className="icon">▶</i>
                  <h2>Jogos em Andamento</h2>
                </div>
                <div className="count-badge">{ongoingGames.length}</div>
              </div>
              <div className="section-content">
                {ongoingGames.length > 0 ? (
                  ongoingGames.map(renderGameCard)
                ) : (
                  <div className="empty-state">
                    <h3>Nenhum jogo em andamento</h3>
                    <p>Quando houver jogos sendo realizados, eles aparecerão aqui</p>
                  </div>
                )}
              </div>
            </div>

            <div className="dashboard-section">
              <div className="section-header finished">
                <div className="section-title">
                  <i className="icon">✓</i>
                  <h2>Jogos Finalizados (Última Hora)</h2>
                </div>
                <div className="count-badge">{finishedGames.length}</div>
              </div>
              <div className="section-content">
                {finishedGames.length > 0 ? (
                  finishedGames.map(renderGameCard)
                ) : (
                  <div className="empty-state">
                    <h3>Nenhum jogo finalizado recentemente</h3>
                    <p>Jogos finalizados na última hora aparecerão aqui</p>
                  </div>
                )}
              </div>
            </div>

            <div className="dashboard-section">
              <div className="section-header pending">
                <div className="section-title">
                  <i className="icon">⏱</i>
                  <h2>Próximos Jogos</h2>
                </div>
                <div className="count-badge">{upcomingGames.length}</div>
              </div>
              <div className="section-content">
                {upcomingGames.length > 0 ? (
                  upcomingGames.map(renderGameCard)
                ) : (
                  <div className="empty-state">
                    <h3>Nenhum jogo agendado</h3>
                    <p>Jogos pendentes aparecerão aqui quando forem criados</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-sidebar" style={{
          position: 'sticky',
          top: '32px',
          flexShrink: 0
        }}>
          <RankingSidebar 
            selectedCompetitionId={selectedCompetitionId}
            competitions={competitions}
          />
        </div>
      </div>


    </div>
  );
};

export default Dashboard; 