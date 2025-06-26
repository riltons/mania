import React, { useState, useEffect } from 'react';
import { competitionRankingService, PlayerRanking, PairRanking, CompetitionStatus } from '../services/competitionRankingService';

interface RankingSidebarProps {
  selectedCompetitionId: string | null;
  competitions: Array<{ id: string; name: string; status: string }>;
}

const RankingSidebar: React.FC<RankingSidebarProps> = ({ selectedCompetitionId, competitions }) => {
  const [playerRanking, setPlayerRanking] = useState<PlayerRanking[]>([]);
  const [pairRanking, setPairRanking] = useState<PairRanking[]>([]);
  const [competitionStatus, setCompetitionStatus] = useState<CompetitionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'players' | 'pairs'>('players');

  const loadRankings = async (competitionId: string) => {
    setLoading(true);
    try {
      const [players, pairs, status] = await Promise.all([
        competitionRankingService.getPlayerRankingByCompetition(competitionId),
        competitionRankingService.getPairRankingByCompetition(competitionId),
        competitionRankingService.getCompetitionStatus(competitionId)
      ]);

      setPlayerRanking(players);
      setPairRanking(pairs);
      setCompetitionStatus(status);
    } catch (error) {
      console.error('Erro ao carregar rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCompetitionId) {
      loadRankings(selectedCompetitionId);
    } else {
      setPlayerRanking([]);
      setPairRanking([]);
      setCompetitionStatus(null);
    }
  }, [selectedCompetitionId]);

  const renderPlayerRanking = () => (
    <div className="ranking-content">
      {playerRanking.length > 0 ? (
        <div className="ranking-list">
          {playerRanking.slice(0, 10).map((player, index) => (
            <div key={player.id} className={`ranking-item ${index === 0 ? 'first-place' : ''}`}>
              <div className="rank-position">
                {index === 0 && competitionStatus?.isFinished ? '👑' : `${index + 1}º`}
              </div>
              <div className="player-info">
                <div className="player-avatar">
                  {player.avatar_url ? (
                    <img src={player.avatar_url} alt={player.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="player-details">
                  <div className="player-name">{player.name}</div>
                  <div className="player-stats">
                    {player.wins}V - {player.losses}D
                    <span className="win-rate">({player.winRate.toFixed(1)}%)</span>
                  </div>
                </div>
              </div>
              <div className="points">{player.pointsGained}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-ranking">
          <p>Nenhum jogador com jogos finalizados</p>
        </div>
      )}
    </div>
  );

  const renderPairRanking = () => (
    <div className="ranking-content">
      {pairRanking.length > 0 ? (
        <div className="ranking-list">
          {pairRanking.slice(0, 8).map((pair, index) => (
            <div key={pair.id} className={`ranking-item pair ${index === 0 ? 'first-place' : ''}`}>
              <div className="rank-position">
                {index === 0 && competitionStatus?.isFinished ? '👑' : `${index + 1}º`}
              </div>
              <div className="pair-info">
                <div className="pair-avatars">
                  <div className="player-avatar small">
                    {pair.player1.avatar_url ? (
                      <img src={pair.player1.avatar_url} alt={pair.player1.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {pair.player1.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="player-avatar small">
                    {pair.player2.avatar_url ? (
                      <img src={pair.player2.avatar_url} alt={pair.player2.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {pair.player2.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="pair-details">
                  <div className="pair-names">
                    {pair.player1.name} & {pair.player2.name}
                  </div>
                  <div className="pair-stats">
                    {pair.wins}V - {pair.losses}D
                    <span className="win-rate">({pair.winRate.toFixed(1)}%)</span>
                  </div>
                </div>
              </div>
              <div className="points">{pair.pointsGained}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-ranking">
          <p>Nenhuma dupla com jogos finalizados</p>
        </div>
      )}
    </div>
  );

  // SEMPRE RETORNA O COMPONENTE VISÍVEL
  return (
    <>
      <style>{`
        /* ESTILOS FORÇADOS PARA SIDEBAR RANKINGS */
        .ranking-sidebar .ranking-header {
          padding: 32px 16px 28px 16px !important;
        }
        .ranking-sidebar .ranking-header h3 {
          margin: 0 0 16px 0 !important;
        }
        .ranking-sidebar .competition-info {
          margin-top: 20px !important;
          margin-bottom: 8px !important;
        }
        .ranking-sidebar .competition-name {
          margin-bottom: 12px !important;
        }
        .ranking-sidebar .ranking-tabs {
          margin-top: 16px !important;
          margin-bottom: 8px !important;
          padding: 0 16px !important;
          display: flex !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .ranking-sidebar .tab-button {
          padding: 20px 12px !important;
          margin: 0 !important;
          flex: 1 !important;
          border-radius: 8px 8px 0 0 !important;
          width: 50% !important;
        }
        .ranking-sidebar .ranking-content {
          padding: 16px 0 20px 0 !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .ranking-sidebar .ranking-item {
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          padding: 16px 10px !important;
          min-height: 76px !important;
          width: 100% !important;
          box-sizing: border-box !important;
          margin-bottom: 8px !important;
        }
        .ranking-sidebar .ranking-item .rank-position {
          min-width: 40px !important;
          text-align: center !important;
          flex-shrink: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 1.4rem !important;
          font-weight: 800 !important;
        }
        .ranking-sidebar .ranking-item .player-info {
          flex: 1 !important;
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          min-width: 0 !important;
          overflow: hidden !important;
        }
        .ranking-sidebar .ranking-item .pair-info {
          flex: 1 !important;
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          min-width: 0 !important;
          overflow: hidden !important;
        }
        .ranking-sidebar .ranking-item .player-avatar {
          width: 48px !important;
          height: 48px !important;
          border-radius: 50% !important;
          flex-shrink: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          background: linear-gradient(135deg, #8257e5 0%, #00875f 100%) !important;
          font-size: 1.2rem !important;
        }
        .ranking-sidebar .ranking-item .player-avatar.small {
          width: 40px !important;
          height: 40px !important;
          font-size: 1rem !important;
        }
        .ranking-sidebar .ranking-item .player-details,
        .ranking-sidebar .ranking-item .pair-details {
          flex: 1 !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          gap: 3px !important;
          min-width: 0 !important;
          overflow: hidden !important;
        }
        .ranking-sidebar .ranking-item .player-name {
          font-size: 1.1rem !important;
          font-weight: 700 !important;
          line-height: 1.3 !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        .ranking-sidebar .ranking-item .pair-names {
          font-size: 1rem !important;
          font-weight: 700 !important;
          line-height: 1.3 !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        .ranking-sidebar .ranking-item .player-stats,
        .ranking-sidebar .ranking-item .pair-stats {
          font-size: 0.95rem !important;
          gap: 8px !important;
        }
        .ranking-sidebar .ranking-item .points {
          min-width: 50px !important;
          text-align: right !important;
          flex-shrink: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: flex-end !important;
          padding-left: 8px !important;
          margin-right: 0 !important;
          font-size: 1.4rem !important;
          font-weight: 800 !important;
        }
        .ranking-sidebar .ranking-item .pair-avatars {
          display: flex !important;
          gap: 2px !important;
          flex-shrink: 0 !important;
          align-items: center !important;
        }
        
        /* ESTILOS UNIFICADOS PARA TODOS OS CARDS - LARGURA TOTAL */
        .ranking-sidebar .ranking-item {
          padding: 16px 16px !important;
          gap: 12px !important;
          margin: 0 16px 8px 16px !important;
          width: calc(100% - 32px) !important;
          box-sizing: border-box !important;
          display: flex !important;
          align-items: center !important;
        }
        
        /* FORÇAR ALTURA TOTAL - REGRAS CRÍTICAS */
        .ranking-sidebar {
          height: 100% !important;
          min-height: 100% !important;
          max-height: none !important;
          overflow: visible !important;
          overflow-x: visible !important;
          overflow-y: visible !important;
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          box-sizing: border-box !important;
        }
        .ranking-content {
          flex: 1 1 auto !important;
          height: 100% !important;
          min-height: 100% !important;
          max-height: none !important;
          overflow: visible !important;
          display: flex !important;
          flex-direction: column !important;
        }
        .ranking-list {
          flex: 1 !important;
          height: 100% !important;
          overflow: visible !important;
          padding: 0 !important;
          margin: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
      `}</style>
      
      <div className="ranking-sidebar" style={{
        width: '480px',
        minWidth: '480px',
        maxWidth: '480px',
        display: 'flex',
        flexDirection: 'column',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
        overflow: 'visible'
      }}>
      <div className="ranking-header">
        <h3>📊 Rankings</h3>
        {!selectedCompetitionId ? (
          <p>Selecione uma competição para ver os rankings</p>
        ) : (
          competitionStatus && (
            <div className="competition-info">
              <div className="competition-name">{competitionStatus.name}</div>
              {competitionStatus.isFinished && (
                <div className="finished-badge">🏆 FINALIZADA</div>
              )}
            </div>
          )
        )}
      </div>

      {competitionStatus?.isFinished && competitionStatus.champion && (
        <div className="champions-section">
          <h4>🏆 Campeões</h4>
          {competitionStatus.champion.player && (
            <div className="champion-card">
              <span className="champion-type">Jogador:</span>
              <span className="champion-name">{competitionStatus.champion.player.name}</span>
            </div>
          )}
          {competitionStatus.champion.pair && (
            <div className="champion-card">
              <span className="champion-type">Dupla:</span>
              <span className="champion-name">
                {competitionStatus.champion.pair.player1.name} & {competitionStatus.champion.pair.player2.name}
              </span>
            </div>
          )}
        </div>
      )}

      {selectedCompetitionId && (
        <>
          <div className="ranking-tabs">
            <button
              className={`tab-button ${activeTab === 'players' ? 'active' : ''}`}
              onClick={() => setActiveTab('players')}
            >
              👤 Jogadores
            </button>
            <button
              className={`tab-button ${activeTab === 'pairs' ? 'active' : ''}`}
              onClick={() => setActiveTab('pairs')}
            >
              👥 Duplas
            </button>
          </div>

          {loading ? (
            <div className="loading-rankings">
              <div className="loading-spinner"></div>
              <p>Carregando rankings...</p>
            </div>
          ) : (
            <>
              {activeTab === 'players' ? renderPlayerRanking() : renderPairRanking()}
            </>
          )}
        </>
      )}
    </div>
    </>
  );
};

export default RankingSidebar; 