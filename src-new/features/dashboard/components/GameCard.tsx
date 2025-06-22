import React from 'react';
import { View, Text } from 'react-native';
import styled from 'styled-components/native';
import { PlayerAvatar } from '../../../core/components/data-display/PlayerAvatar';
import { DashboardGameData } from '../services/dashboardService';

interface GameCardProps {
  game: DashboardGameData;
  showCompetitionName?: boolean;
}

const CardContainer = styled.View<{ status: string }>`
  background-color: ${(props: any) => props.theme.colors.backgroundMedium};
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 16px;
  border-left-width: 6px;
  border-left-color: ${(props: any) => 
    props.status === 'in_progress' ? '#22C55E' : 
    props.status === 'finished' ? props.theme.colors.primary : 
    props.theme.colors.gray500
  };
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 8;
`;

const Header = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const StatusBadge = styled.View<{ status: string }>`
  background-color: ${(props: any) => 
    props.status === 'in_progress' ? '#22C55E' : 
    props.status === 'finished' ? props.theme.colors.primary : 
    props.theme.colors.gray500
  };
  padding: 8px 16px;
  border-radius: 20px;
`;

const StatusText = styled.Text`
  color: ${(props: any) => props.theme.colors.white};
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
`;

const CompetitionName = styled.Text`
  color: ${(props: any) => props.theme.colors.textSecondary};
  font-size: 14px;
  font-weight: 600;
`;

const TeamsContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const TeamContainer = styled.View`
  flex: 1;
  align-items: center;
`;

const PlayersContainer = styled.View`
  flex-direction: row;
  justify-content: center;
  margin-bottom: 12px;
`;

const PlayerContainer = styled.View`
  align-items: center;
  margin-horizontal: 8px;
`;

const PlayerName = styled.Text`
  color: ${(props: any) => props.theme.colors.textPrimary};
  font-size: 16px;
  font-weight: 600;
  margin-top: 8px;
  text-align: center;
`;

const ScoreContainer = styled.View`
  align-items: center;
  justify-content: center;
  margin-horizontal: 24px;
`;

const Score = styled.Text<{ isWinning?: boolean }>`
  color: ${(props: any) => 
    props.isWinning ? props.theme.colors.accent : props.theme.colors.textPrimary
  };
  font-size: 48px;
  font-weight: bold;
`;

const Separator = styled.Text`
  color: ${(props: any) => props.theme.colors.textTertiary};
  font-size: 32px;
  margin-horizontal: 8px;
`;

const GameDetails = styled.View`
  margin-top: 16px;
  padding-top: 16px;
  border-top-width: 1px;
  border-top-color: ${(props: any) => props.theme.colors.border};
  flex-direction: row;
  justify-content: space-between;
`;

const DetailItem = styled.View`
  align-items: center;
`;

const DetailLabel = styled.Text`
  color: ${(props: any) => props.theme.colors.textTertiary};
  font-size: 12px;
  margin-bottom: 4px;
`;

const DetailValue = styled.Text`
  color: ${(props: any) => props.theme.colors.textPrimary};
  font-size: 14px;
  font-weight: 600;
`;

const WinnerIndicator = styled.View<{ show: boolean }>`
  background-color: ${(props: any) => props.theme.colors.accent};
  padding: 4px 8px;
  border-radius: 12px;
  margin-top: 8px;
  opacity: ${(props: any) => props.show ? 1 : 0};
`;

const WinnerText = styled.Text`
  color: ${(props: any) => props.theme.colors.white};
  font-size: 12px;
  font-weight: bold;
`;

export const GameCard: React.FC<GameCardProps> = ({ 
  game, 
  showCompetitionName = true 
}) => {
  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress': return 'Em Andamento';
      case 'finished': return 'Finalizado';
      case 'pending': return 'Aguardando';
      default: return status;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const team1Score = game.team1_score || 0;
  const team2Score = game.team2_score || 0;
  const team1Winning = team1Score > team2Score;
  const team2Winning = team2Score > team1Score;
  const isFinished = game.status === 'finished';

  const roundsCount = game.rounds?.length || 0;

  return (
    <CardContainer status={game.status}>
      <Header>
        {showCompetitionName && (
          <CompetitionName>{game.competition_name}</CompetitionName>
        )}
        <StatusBadge status={game.status}>
          <StatusText>{getStatusText(game.status)}</StatusText>
        </StatusBadge>
      </Header>

      <TeamsContainer>
        <TeamContainer>
                     <PlayersContainer>
             {game.team1_players.map((player) => (
               <PlayerContainer key={player.id}>
                 <PlayerAvatar 
                   avatarUrl={player.avatar_url}
                   name={player.name}
                   size={60}
                 />
                 <PlayerName numberOfLines={2}>
                   {player.name}
                 </PlayerName>
               </PlayerContainer>
             ))}
          </PlayersContainer>
          {isFinished && team1Winning && (
            <WinnerIndicator show={true}>
              <WinnerText>VENCEDOR</WinnerText>
            </WinnerIndicator>
          )}
        </TeamContainer>

        <ScoreContainer>
          <Score isWinning={team1Winning && isFinished}>
            {team1Score}
          </Score>
          <Separator>×</Separator>
          <Score isWinning={team2Winning && isFinished}>
            {team2Score}
          </Score>
        </ScoreContainer>

        <TeamContainer>
          <PlayersContainer>
                         {game.team2_players.map((player) => (
               <PlayerContainer key={player.id}>
                 <PlayerAvatar 
                   avatarUrl={player.avatar_url}
                   name={player.name}
                   size={60}
                 />
                 <PlayerName numberOfLines={2}>
                   {player.name}
                 </PlayerName>
               </PlayerContainer>
             ))}
          </PlayersContainer>
          {isFinished && team2Winning && (
            <WinnerIndicator show={true}>
              <WinnerText>VENCEDOR</WinnerText>
            </WinnerIndicator>
          )}
        </TeamContainer>
      </TeamsContainer>

      <GameDetails>
        <DetailItem>
          <DetailLabel>Rodadas</DetailLabel>
          <DetailValue>{roundsCount}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Iniciado</DetailLabel>
          <DetailValue>{formatTime(game.created_at)}</DetailValue>
        </DetailItem>
        {isFinished && (
          <DetailItem>
            <DetailLabel>Finalizado</DetailLabel>
            <DetailValue>{formatTime(game.updated_at)}</DetailValue>
          </DetailItem>
        )}
        {(game.is_buchuda || game.is_buchuda_de_re) && (
          <DetailItem>
            <DetailLabel>Especial</DetailLabel>
            <DetailValue>
              {game.is_buchuda_de_re ? 'Buchuda de Ré' : 'Buchuda'}
            </DetailValue>
          </DetailItem>
        )}
      </GameDetails>
    </CardContainer>
  );
}; 