import { Redirect, useRouter } from 'expo-router';

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { playerService, Player as PlayerType } from '@/services/playerService';
import { Header } from '@/components/Header';
import { colors } from '@/styles/colors';
import styled from 'styled-components/native';
import { PageTransition } from '@/components/Transitions';
import { Feather } from '@expo/vector-icons';

const Container = styled.View`
    flex: 1;
    background-color: ${colors.backgroundDark};
`;

const Content = styled.View`
    flex: 1;
    padding: 20px;
`;

const PlayerInfo = styled.View`
    background-color: ${colors.backgroundMedium};
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
`;

const PlayerName = styled.Text`
    color: ${colors.gray100};
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 16px;
`;

const InfoItem = styled.View`
    margin-bottom: 12px;
`;

const InfoLabel = styled.Text`
    color: ${colors.gray300};
    font-size: 14px;
    margin-bottom: 4px;
`;

const InfoValue = styled.Text`
    color: ${colors.gray100};
    font-size: 16px;
`;

const ActionsContainer = styled.View`
    flex-direction: row;
    justify-content: flex-end;
    margin-top: 16px;
`;

const ActionButton = styled.TouchableOpacity`
    flex-direction: row;
    align-items: center;
    background-color: ${colors.backgroundLight};
    padding: 8px 12px;
    border-radius: 8px;
    margin-left: 8px;
`;

const ActionText = styled.Text`
    color: ${colors.gray100};
    font-size: 14px;
    margin-left: 4px;
`;

type Player = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
};

export default function PlayerDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlayer() {
      try {
        if (typeof id === 'string') {
          const response = await playerService.getById(id);
          // Verificar se a resposta é válida
          if (response) {
            const playerData = response as any;
            setPlayer({
              id: playerData.id,
              name: playerData.name,
              phone: playerData.phone,
              email: playerData.email
            });
          }
        }
      } catch (err) {
        setError('Erro ao carregar os detalhes do jogador');
      } finally {
        setLoading(false);
      }
    }

    loadPlayer();
  }, [id]);

  const navigateToEdit = () => {
    if (typeof id === 'string') {
      // Navegar para a nova página de edição com o ID como parâmetro
      router.push({
        pathname: '/jogador/editar',
        params: { id }
      });
    }
  };

  return (
    <PageTransition>
      <Container>
        <Header 
          title="Detalhes do Jogador" 
          showBackButton
        />
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: colors.error }}>{error}</Text>
          </View>
        ) : !player ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: colors.gray300 }}>Jogador não encontrado</Text>
          </View>
        ) : (
          <Content>
            <PlayerInfo>
              <PlayerName>{player.name}</PlayerName>
              {player.phone && (
                <InfoItem>
                  <InfoLabel>Telefone</InfoLabel>
                  <InfoValue>{player.phone}</InfoValue>
                </InfoItem>
              )}
              {player.email && (
                <InfoItem>
                  <InfoLabel>Email</InfoLabel>
                  <InfoValue>{player.email}</InfoValue>
                </InfoItem>
              )}
              
              <ActionsContainer>
                <ActionButton onPress={navigateToEdit}>
                  <Feather name="edit" size={16} color={colors.gray100} />
                  <ActionText>Editar</ActionText>
                </ActionButton>
              </ActionsContainer>
            </PlayerInfo>
          </Content>
        )}
      </Container>
    </PageTransition>
  );
}