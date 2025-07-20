import React from 'react';
import { TouchableOpacity, Alert } from 'react-native';
import styled from 'styled-components/native';
import { Feather } from '@expo/vector-icons';

import { Game } from '@/core/types/database.types';
import { formatDate } from '@/core/utils/date';
import { ThemeProps } from '@/core/types/theme';

interface GameItemProps {
  game: Game;
  canDelete?: boolean;
  onDelete?: () => void;
  onPress?: () => void;
}

const Container = styled.TouchableOpacity`
  background-color: ${({ theme }: ThemeProps) => theme.colors.backgroundMedium};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  elevation: 2;
`;

const Header = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const GameStatus = styled.View`
  padding: 4px 8px;
  border-radius: 12px;
  background-color: ${({ status, theme }: { status: string; theme: any }) => {
    switch (status) {
      case 'pending':
        return theme.colors.warningLight;
      case 'in_progress':
        return theme.colors.infoLight;
      case 'finished':
        return theme.colors.successLight;
      default:
        return theme.colors.textSecondary;
    }
  }};
`;

const StatusText = styled.Text`
  font-size: 12px;
  font-weight: 500;
  color: ${({ status, theme }: { status: string; theme: any }) => {
    switch (status) {
      case 'pending':
        return theme.colors.warning;
      case 'in_progress':
        return theme.colors.info;
      case 'finished':
        return theme.colors.success;
      default:
        return theme.colors.textSecondary;
    }
  }};
`;

const Title = styled.Text`
  color: ${({ theme }: ThemeProps) => theme.colors.text};
  font-size: 18px;
  font-weight: bold;
`;

const GameInfo = styled.View`
  margin-top: 8px;
`;

const InfoRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: 4px;
`;

const TeamContainer = styled.View`
  flex-direction: row;
  align-items: center;
`;

const TeamName = styled.Text`
  color: ${({ theme }: ThemeProps) => theme.colors.text};
  font-size: 16px;
  margin-right: 8px;
  width: 120px;
`;

const Score = styled.Text<{ winner: boolean }>`
  font-size: 18px;
  font-weight: bold;
  color: ${({ winner, theme }: { winner: boolean; theme: any }) => 
    winner ? theme.colors.accent : theme.colors.textSecondary};
`;

const DateText = styled.Text`
  color: ${({ theme }: ThemeProps) => theme.colors.textSecondary};
  font-size: 14px;
  margin-top: 8px;
`;

const ActionButton = styled.TouchableOpacity`
  width: 32px;
  height: 32px;
  justify-content: center;
  align-items: center;
  border-radius: 16px;
`;

const getStatusText = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'in_progress':
      return 'Em Andamento';
    case 'finished':
      return 'Finalizado';
    default:
      return 'Desconhecido';
  }
};

export const GameItem: React.FC<GameItemProps> = ({ 
  game, 
  canDelete = false,
  onDelete,
  onPress
}) => {
  const team1Winner = game.team1_score > game.team2_score;
  const team2Winner = game.team2_score > game.team1_score;
  const isDraw = game.status === 'finished' && game.team1_score === game.team2_score;
  
  const handleDelete = () => {
    Alert.alert(
      'Remover Jogo',
      'Tem certeza que deseja remover este jogo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          onPress: onDelete,
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <Container onPress={onPress} disabled={!onPress}>
      <Header>
        <GameStatus status={game.status}>
          <StatusText status={game.status}>{getStatusText(game.status)}</StatusText>
        </GameStatus>

        {canDelete && (
          <ActionButton onPress={handleDelete}>
            <Feather name="trash-2" size={18} color="#FF3333" />
          </ActionButton>
        )}
      </Header>

      <GameInfo>
        <InfoRow>
          <TeamContainer>
            <TeamName numberOfLines={1}>{game.team1_name}</TeamName>
            <Score winner={team1Winner || isDraw}>{game.team1_score}</Score>
          </TeamContainer>

          <Feather name="x" size={16} color="#9ca3af" />

          <TeamContainer>
            <Score winner={team2Winner || isDraw}>{game.team2_score}</Score>
            <TeamName numberOfLines={1} style={{ textAlign: 'right' }}>{game.team2_name}</TeamName>
          </TeamContainer>
        </InfoRow>
      </GameInfo>

      <DateText>{formatDate(game.played_at || game.created_at)}</DateText>
    </Container>
  );
};
