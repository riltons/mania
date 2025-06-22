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

  if (!selectedCompetitionId) {
    return (
      <div className="ranking-sidebar">
        <div className="ranking-header">
          <h3>📊 Rankings</h3>
          <p>Selecione uma competição para ver os rankings</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="ranking-sidebar">
      <div className="ranking-header">
        <h3>📊 Rankings</h3>
        {competitionStatus && (
          <div className="competition-info">
            <div className="competition-name">{competitionStatus.name}</div>
            {competitionStatus.isFinished && (
              <div className="finished-badge">🏆 FINALIZADA</div>
            )}
          </div>
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
    </div>
  );
};

export default RankingSidebar; 