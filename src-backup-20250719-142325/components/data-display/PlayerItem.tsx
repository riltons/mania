import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/contexts/ThemeProvider';
import { PlayerAvatar } from './PlayerAvatar';
import { Player } from '@/features/players/services/playersService';

type PlayerItemProps = {
  player: Player;
  onPress: (playerId: string) => void;
};

export function PlayerItem({ player, onPress }: PlayerItemProps) {
  const { colors } = useTheme();
  
  return (
    <PlayerCard onPress={() => onPress(player.id)}>
      <PlayerCardContent>
        <PlayerAvatar 
          avatarUrl={player.avatar_url} 
          name={player.name} 
          size={40} 
        />
        <InfoContainer>
          <NameContainer>
            <PlayerName>{player.name}</PlayerName>
            {player.isCreatedByOtherUser && (
              <SharedIndicator>
                <Ionicons name="people-outline" size={12} color={colors.primary} />
                <SharedText>Compartilhado</SharedText>
              </SharedIndicator>
            )}
          </NameContainer>
          {player.nickname && (
            <NicknameText>{player.nickname}</NicknameText>
          )}
        </InfoContainer>
      </PlayerCardContent>
    </PlayerCard>
  );
}

const PlayerCard = styled.TouchableOpacity`
  padding: 16px;
  background-color: ${({ theme }) => theme.colors.backgroundMedium};
  border-radius: 8px;
  margin-bottom: 8px;
`;

const PlayerCardContent = styled.View`
  flex-direction: row;
  align-items: center;
`;

const InfoContainer = styled.View`
  flex: 1;
  margin-left: 12px;
`;

const NameContainer = styled.View`
  flex-direction: row;
  align-items: center;
`;

const PlayerName = styled.Text`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const NicknameText = styled.Text`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 4px;
`;

const SharedIndicator = styled.View`
  flex-direction: row;
  align-items: center;
  margin-left: 8px;
  background-color: rgba(130, 87, 229, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
`;

const SharedText = styled.Text`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.primary};
  margin-left: 4px;
`;
