import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import styled from 'styled-components/native';
import { Feather } from '@expo/vector-icons';
import { InternalHeader } from '@/core/components/layout/InternalHeader';
import { competitionService } from '@/features/competitions/services';
import { formatDateBR } from '@/core/utils';
import { FloatingButton } from '@/core/components/ui';
import { useTheme } from 'styled-components/native';

// Interface para tipagem das props com tema
interface ThemeProps {
  theme: {
    colors: {
      backgroundDark: string;
      backgroundMedium: string;
      textPrimary: string;
      textSecondary: string;
      primary: string;
      success: string;
      error: string;
      warning: string;
    }
  }
}

// Componentes estilizados
const Container = styled.View`
  flex: 1;
  background-color: ${(props: ThemeProps) => props.theme.colors.backgroundDark};
`;

const Content = styled.ScrollView`
  flex: 1;
  padding: 16px;
`;

const Card = styled.View`
  background-color: ${(props: ThemeProps) => props.theme.colors.backgroundMedium};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`;

const Title = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: ${(props: ThemeProps) => props.theme.colors.textPrimary};
  margin-bottom: 8px;
`;

const Description = styled.Text`
  font-size: 16px;
  color: ${(props: ThemeProps) => props.theme.colors.textSecondary};
  margin-bottom: 16px;
`;

const InfoRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 8px;
`;

const InfoLabel = styled.Text`
  font-size: 14px;
  font-weight: bold;
  color: ${(props: ThemeProps) => props.theme.colors.textPrimary};
  margin-right: 8px;
  width: 100px;
`;

const InfoValue = styled.Text`
  font-size: 14px;
  color: ${(props: ThemeProps) => props.theme.colors.textSecondary};
  flex: 1;
`;

const SectionTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: ${(props: ThemeProps) => props.theme.colors.textPrimary};
  margin-top: 24px;
  margin-bottom: 16px;
`;

const ActionButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: ${(props: ThemeProps) => props.theme.colors.backgroundMedium};
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 12px;
`;

const ActionButtonText = styled.Text`
  font-size: 16px;
  color: ${(props: ThemeProps) => props.theme.colors.textPrimary};
  margin-left: 12px;
`;

const StatusBadge = styled.View<{ status: string }>`
  background-color: ${(props) => {
    switch (props.status) {
      case 'pending': return props.theme.colors.warning;
      case 'in_progress': return props.theme.colors.primary;
      case 'finished': return props.theme.colors.success;
      default: return props.theme.colors.textSecondary;
    }
  }};
  padding: 4px 8px;
  border-radius: 4px;
  align-self: flex-start;
  margin-bottom: 16px;
`;

const StatusText = styled.Text`
  color: white;
  font-size: 12px;
  font-weight: bold;
`;

const StatsContainer = styled.View`
  flex-direction: row;
  justify-content: space-around;
  margin-top: 16px;
  margin-bottom: 16px;
`;

const StatItem = styled.View`
  align-items: center;
`;

const StatValue = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: ${(props: ThemeProps) => props.theme.colors.primary};
`;

const StatLabel = styled.Text`
  font-size: 14px;
  color: ${(props: ThemeProps) => props.theme.colors.textSecondary};
`;

const EmptyStateContainer = styled.View`
  align-items: center;
  justify-content: center;
  padding: 40px 0;
`;

const EmptyStateText = styled.Text`
  font-size: 16px;
  color: ${(props: ThemeProps) => props.theme.colors.textSecondary};
  text-align: center;
  margin-top: 16px;
`;

export default function CompetitionDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [competition, setCompetition] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();

  useEffect(() => {
    loadCompetition();
  }, [id]);

  const loadCompetition = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      console.log('Carregando competição:', id);
      
      // Carregar detalhes da competição
      const competitionData = await competitionService.getById(id as string);
      console.log('Competição carregada:', competitionData);
      
      if (!competitionData) {
        Alert.alert('Erro', 'Competição não encontrada');
        router.back();
        return;
      }
      
      setCompetition(competitionData);
      
      // Carregar estatísticas da competição
      const statsData = await competitionService.getCompetitionStats(id as string);
      setStats(statsData);
      
    } catch (error) {
      console.error('Erro ao carregar competição:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes da competição');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em Andamento';
      case 'finished': return 'Finalizada';
      default: return status;
    }
  };

  const handleAddPlayer = () => {
    if (!competition) return;
    router.push(`/competicoes/${competition.id}/adicionar-jogador`);
  };

  const handleCreateGame = () => {
    if (!competition) return;
    router.push(`/competicoes/${competition.id}/novo-jogo`);
  };

  const handleViewGames = () => {
    if (!competition) return;
    router.push(`/competicoes/${competition.id}/jogos`);
  };

  const handleViewPlayers = () => {
    if (!competition) return;
    router.push(`/competicoes/${competition.id}/jogadores`);
  };

  const handleViewRanking = () => {
    if (!competition) return;
    router.push(`/competicoes/${competition.id}/ranking`);
  };

  if (loading) {
    return (
      <Container>
        <InternalHeader title="Detalhes da Competição" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Container>
    );
  }

  if (!competition) {
    return (
      <Container>
        <InternalHeader title="Detalhes da Competição" />
        <EmptyStateContainer>
          <Feather name="alert-circle" size={64} color={colors.error} />
          <EmptyStateText>Competição não encontrada</EmptyStateText>
        </EmptyStateContainer>
      </Container>
    );
  }

  return (
    <Container>
      <InternalHeader title="Detalhes da Competição" />
      <Content>
        <Card>
          <Title>{competition.name}</Title>
          <StatusBadge status={competition.status}>
            <StatusText>{getStatusText(competition.status)}</StatusText>
          </StatusBadge>
          <Description>{competition.description}</Description>
          
          <InfoRow>
            <InfoLabel>Criado em:</InfoLabel>
            <InfoValue>{formatDateBR(competition.created_at)}</InfoValue>
          </InfoRow>
          
          {competition.start_date && (
            <InfoRow>
              <InfoLabel>Início:</InfoLabel>
              <InfoValue>{formatDateBR(competition.start_date)}</InfoValue>
            </InfoRow>
          )}
          
          {competition.end_date && (
            <InfoRow>
              <InfoLabel>Término:</InfoLabel>
              <InfoValue>{formatDateBR(competition.end_date)}</InfoValue>
            </InfoRow>
          )}
          
          {stats && (
            <StatsContainer>
              <StatItem>
                <StatValue>{stats.totalPlayers || 0}</StatValue>
                <StatLabel>Jogadores</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{stats.totalGames || 0}</StatValue>
                <StatLabel>Jogos</StatLabel>
              </StatItem>
            </StatsContainer>
          )}
        </Card>

        <SectionTitle>Ações</SectionTitle>
        
        <ActionButton onPress={handleAddPlayer}>
          <Feather name="user-plus" size={24} color={colors.primary} />
          <ActionButtonText>Adicionar Jogador</ActionButtonText>
        </ActionButton>
        
        <ActionButton onPress={handleCreateGame}>
          <Feather name="plus-circle" size={24} color={colors.primary} />
          <ActionButtonText>Novo Jogo</ActionButtonText>
        </ActionButton>
        
        <ActionButton onPress={handleViewGames}>
          <Feather name="list" size={24} color={colors.primary} />
          <ActionButtonText>Ver Jogos</ActionButtonText>
        </ActionButton>
        
        <ActionButton onPress={handleViewPlayers}>
          <Feather name="users" size={24} color={colors.primary} />
          <ActionButtonText>Ver Jogadores</ActionButtonText>
        </ActionButton>
        
        <ActionButton onPress={handleViewRanking}>
          <Feather name="award" size={24} color={colors.primary} />
          <ActionButtonText>Ver Ranking</ActionButtonText>
        </ActionButton>
      </Content>
    </Container>
  );
}