import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import styled from 'styled-components/native';
import { useTheme } from '../../../core/contexts/ThemeProvider';
import { dashboardService, DashboardData } from '../services/dashboardService';
import { CompetitionSelector } from '../components/CompetitionSelector';
import { GameCard } from '../components/GameCard';
import { DashboardSection } from '../components/DashboardSection';
import { LoadingState, ErrorState } from '../../../core/components/feedback';
import { useAsyncState } from '../../../core/hooks';

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.backgroundDark};
`;

const Header = styled.View`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.accent} 100%);
  padding: 40px 24px 24px;
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
`;

const HeaderTitle = styled.Text`
  color: ${({ theme }) => theme.colors.white};
  font-size: 32px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 8px;
`;

const HeaderSubtitle = styled.Text`
  color: ${({ theme }) => theme.colors.white};
  font-size: 16px;
  text-align: center;
  opacity: 0.9;
`;

const Content = styled.ScrollView.attrs({
  contentContainerStyle: { padding: 24 },
  showsVerticalScrollIndicator: false
})`
  flex: 1;
`;

const LastUpdated = styled.View`
  background-color: ${({ theme }) => theme.colors.backgroundMedium};
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 24px;
  align-items: center;
`;

const LastUpdatedText = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
`;

const LiveIndicator = styled.View`
  position: absolute;
  top: 16px;
  right: 16px;
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.accent};
  padding: 8px 12px;
  border-radius: 20px;
`;

const LiveDot = styled.View`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.colors.white};
  margin-right: 6px;
`;

const LiveText = styled.Text`
  color: ${({ theme }) => theme.colors.white};
  font-size: 12px;
  font-weight: bold;
`;

export const Dashboard: React.FC = () => {
  const theme = useTheme();
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const {
    data: dashboardData,
    loading,
    error,
    execute: loadDashboardData
  } = useAsyncState<DashboardData>({
    activeCompetitions: [],
    ongoingGames: [],
    finishedGamesLastHour: [],
    upcomingGames: []
  });

  // Função para carregar dados do dashboard
  const fetchDashboardData = useCallback(async () => {
    try {
      const data = await dashboardService.getDashboardData(selectedCompetitionId);
      setLastUpdated(new Date());
      return data;
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      throw error;
    }
  }, [selectedCompetitionId]);

  // Carregamento inicial
  useEffect(() => {
    loadDashboardData(fetchDashboardData);
  }, [selectedCompetitionId, loadDashboardData, fetchDashboardData]);

  // Setup de subscriptions para atualizações em tempo real
  useEffect(() => {
    const unsubscribeGames = dashboardService.subscribeToGamesUpdates(
      selectedCompetitionId,
      () => {
        console.log('Atualização em tempo real detectada - recarregando dados...');
        loadDashboardData(fetchDashboardData);
      }
    );

    const unsubscribeCompetitions = dashboardService.subscribeToCompetitionsUpdates(
      () => {
        console.log('Competições atualizadas - recarregando dados...');
        loadDashboardData(fetchDashboardData);
      }
    );

    return () => {
      unsubscribeGames();
      unsubscribeCompetitions();
    };
  }, [selectedCompetitionId, loadDashboardData, fetchDashboardData]);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refresh do dashboard...');
      loadDashboardData(fetchDashboardData);
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [loadDashboardData, fetchDashboardData]);

  const handleRefresh = useCallback(() => {
    loadDashboardData(fetchDashboardData);
  }, [loadDashboardData, fetchDashboardData]);

  const formatLastUpdated = (date: Date) => {
    return `Última atualização: ${date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })}`;
  };

  if (loading && !dashboardData) {
    return (
      <Container>
        <LoadingState message="Carregando dashboard..." />
      </Container>
    );
  }

  if (error && !dashboardData) {
    return (
      <Container>
        <ErrorState 
          message="Erro ao carregar o dashboard"
          onRetry={handleRefresh}
        />
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <HeaderTitle>🏆 Dashboard de Jogos</HeaderTitle>
        <HeaderSubtitle>Acompanhe os jogos em tempo real</HeaderSubtitle>
        <LiveIndicator>
          <LiveDot />
          <LiveText>AO VIVO</LiveText>
        </LiveIndicator>
      </Header>

      <Content
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <LastUpdated>
          <LastUpdatedText>
            {formatLastUpdated(lastUpdated)}
          </LastUpdatedText>
        </LastUpdated>

        <CompetitionSelector
          competitions={dashboardData?.activeCompetitions || []}
          selectedCompetitionId={selectedCompetitionId}
          onSelectCompetition={setSelectedCompetitionId}
        />

        <DashboardSection
          title="Jogos em Andamento"
          icon="play-circle"
          count={dashboardData?.ongoingGames.length}
          backgroundColor="#22C55E20"
        >
          {dashboardData?.ongoingGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              showCompetitionName={!selectedCompetitionId}
            />
          ))}
        </DashboardSection>

        <DashboardSection
          title="Jogos Finalizados (Última Hora)"
          icon="check-circle"
          count={dashboardData?.finishedGamesLastHour.length}
          backgroundColor="#8257E520"
        >
          {dashboardData?.finishedGamesLastHour.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              showCompetitionName={!selectedCompetitionId}
            />
          ))}
        </DashboardSection>

        <DashboardSection
          title="Próximos Jogos"
          icon="clock-outline"
          count={dashboardData?.upcomingGames.length}
          backgroundColor="#FBA94C20"
        >
          {dashboardData?.upcomingGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              showCompetitionName={!selectedCompetitionId}
            />
          ))}
        </DashboardSection>
      </Content>
    </Container>
  );
}; 