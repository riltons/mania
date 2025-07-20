import React, { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, FlatList, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import styled from 'styled-components/native';
import { useTheme } from '@/core/contexts/ThemeProvider';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { PlayerAvatar } from '@/components/data-display/PlayerAvatar';
import { sharedPlayersService, SharedPlayer } from '@/features/players/services/sharedPlayersService';

// Usando a interface SharedPlayer do serviço

export default function SharedPlayersRoute() {
  const router = useRouter();
  const theme = useTheme();
  const [sharedPlayers, setSharedPlayers] = useState<SharedPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSharedPlayers();
  }, []);

  const loadSharedPlayers = async () => {
    try {
      setLoading(true);
      const players = await sharedPlayersService.getSharedPlayers();
      setSharedPlayers(players);
    } catch (error) {
      console.error('Erro ao carregar jogadores compartilhados:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao carregar os jogadores compartilhados');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerPress = (playerId: string) => {
    router.push(`/jogador/jogador/${playerId}/jogos`);
  };

  if (loading) {
    return (
      <Container>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <BackButton onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </BackButton>
        <HeaderTitle>Jogadores Compartilhados</HeaderTitle>
      </Header>

      {sharedPlayers.length === 0 ? (
        <EmptyContainer>
          <MaterialCommunityIcons name="account-group-outline" size={48} color={theme.colors.textSecondary} />
          <EmptyText>Você não possui jogadores compartilhados</EmptyText>
          <EmptySubText>
            Quando outros usuários compartilharem jogadores com você, eles aparecerão aqui
          </EmptySubText>
        </EmptyContainer>
      ) : (
        <FlatList
          data={sharedPlayers}
          keyExtractor={(item: SharedPlayer) => item.id}
          renderItem={({ item }: { item: SharedPlayer }) => (
            <PlayerCard onPress={() => handlePlayerPress(item.id)}>
              <PlayerAvatarContainer>
                <PlayerAvatar avatarUrl={item.avatar_url} name={item.name} size={50} />
              </PlayerAvatarContainer>
              <PlayerInfo>
                <PlayerName>{item.name}</PlayerName>
                {item.nickname && <PlayerNickname>@{item.nickname}</PlayerNickname>}
                {item.phone && <PlayerPhone>{item.phone}</PlayerPhone>}
                <SharedBadge>
                  <MaterialCommunityIcons name="account-multiple" size={14} color={theme.colors.accent} />
                  <SharedText>Compartilhado</SharedText>
                </SharedBadge>
              </PlayerInfo>
            </PlayerCard>
          )}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </Container>
  );
}

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }: { theme: any }) => theme.colors.background};
`;

const Header = styled.View`
  padding: 16px;
  flex-direction: row;
  align-items: center;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }: { theme: any }) => theme.colors.border};
`;

const BackButton = styled.TouchableOpacity`
  margin-right: 16px;
`;

const HeaderTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: ${({ theme }: { theme: any }) => theme.colors.text};
`;

const EmptyContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const EmptyText = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: ${({ theme }: { theme: any }) => theme.colors.textSecondary};
  margin-top: 16px;
  text-align: center;
`;

const EmptySubText = styled.Text`
  font-size: 14px;
  color: ${({ theme }: { theme: any }) => theme.colors.textSecondary};
  margin-top: 8px;
  text-align: center;
`;

const PlayerCard = styled.TouchableOpacity`
  flex-direction: row;
  background-color: ${({ theme }: { theme: any }) => theme.colors.card};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
`;

const PlayerAvatarContainer = styled.View`
  margin-right: 16px;
`;

const PlayerInfo = styled.View`
  flex: 1;
`;

const PlayerName = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: ${({ theme }: { theme: any }) => theme.colors.text};
  margin-bottom: 4px;
`;

const PlayerNickname = styled.Text`
  font-size: 14px;
  color: ${({ theme }: { theme: any }) => theme.colors.textSecondary};
  margin-bottom: 4px;
`;

const PlayerPhone = styled.Text`
  font-size: 14px;
  color: ${({ theme }: { theme: any }) => theme.colors.textSecondary};
  margin-bottom: 8px;
`;

const SharedBadge = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }: { theme: any }) => theme.colors.accent + '20'};
  padding: 4px 8px;
  border-radius: 4px;
  align-self: flex-start;
`;

const SharedText = styled.Text`
  font-size: 12px;
  color: ${({ theme }: { theme: any }) => theme.colors.accent};
  margin-left: 4px;
`;
