import React, { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, FlatList, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import styled from 'styled-components/native';
import { useTheme } from '@/core/contexts/ThemeProvider';
import { supabase } from '@/core/lib/supabase';
import { Player, playersService } from '@/features/players/services/playersService';
import { PlayerItem } from '@/core/components/data-display/PlayerItem';
import { Ionicons } from '@expo/vector-icons';

export default function SharedPlayersScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [sharedPlayers, setSharedPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSharedPlayers();
  }, []);

  const loadSharedPlayers = async () => {
    try {
      setLoading(true);
      
      // Obter o usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Erro ao obter usuário:', userError);
        Alert.alert('Erro', 'Você precisa estar logado para ver jogadores compartilhados');
        return;
      }
      
      // Buscar jogadores compartilhados
      const { data: players, error } = await supabase.rpc('get_shared_players', { user_id: user.id });
      
      if (error) {
        console.error('Erro ao buscar jogadores compartilhados:', error);
        Alert.alert('Erro', 'Não foi possível carregar os jogadores compartilhados');
        return;
      }
      
      // Adicionar propriedades necessárias para a exibição
      const processedPlayers = players.map((player: any) => ({
        ...player,
        isCreatedByOtherUser: true,
        sharedPlayer: true
      }));
      
      setSharedPlayers(processedPlayers);
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
        <ActivityIndicator size="large" color={colors.primary} />
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <HeaderTitle>Jogadores Compartilhados</HeaderTitle>
        <HeaderSubtitle>Jogadores criados por outros usuários que você pode acessar</HeaderSubtitle>
      </Header>

      {sharedPlayers.length === 0 ? (
        <EmptyContainer>
          <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
          <EmptyText>Você não possui jogadores compartilhados</EmptyText>
          <EmptySubText>
            Quando outros usuários compartilharem jogadores com você, eles aparecerão aqui
          </EmptySubText>
        </EmptyContainer>
      ) : (
        <FlatList
          data={sharedPlayers}
          keyExtractor={(item: Player) => item.id}
          renderItem={({ item }: { item: Player }) => (
            <PlayerItem 
              player={item} 
              onPress={handlePlayerPress} 
            />
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
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }: { theme: any }) => theme.colors.border};
`;

const HeaderTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: ${({ theme }: { theme: any }) => theme.colors.textPrimary};
`;

const HeaderSubtitle = styled.Text`
  font-size: 14px;
  color: ${({ theme }: { theme: any }) => theme.colors.textSecondary};
  margin-top: 4px;
`;

const EmptyContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 24px;
`;

const EmptyText = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: ${({ theme }: { theme: any }) => theme.colors.textPrimary};
  margin-top: 16px;
  text-align: center;
`;

const EmptySubText = styled.Text`
  font-size: 14px;
  color: ${({ theme }: { theme: any }) => theme.colors.textSecondary};
  margin-top: 8px;
  text-align: center;
`;
