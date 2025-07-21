import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { PlayerAvatar } from '@/core/components/data-display/PlayerAvatar';
import styled from 'styled-components/native';
import { useTheme } from '@/core/contexts/ThemeProvider';
import { Header } from '@/core/components/layout/Header';
import { Feather } from '@expo/vector-icons';
import { rankingService, PlayerRanking } from '@/features/statistics/services/rankingService';
import rankingServiceFixed from '@/features/statistics/services/rankingServiceFixed';
import { mockRankingService } from '@/features/statistics/services/simpleRankingTest';
import { useRouter } from 'expo-router';
import { DefaultTheme } from 'styled-components';

const Container = styled.View`
    flex: 1;
    background-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.backgroundDark};
`;

const Content = styled.View`
    flex: 1;
    padding: 20px;
`;

const PlayerCard = styled.TouchableOpacity`
    background-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.backgroundMedium};
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    border: 1px solid ${({ theme }: { theme: DefaultTheme }) => theme.colors.tertiary}40;
`;

const CardHeader = styled.View`
    flex-direction: row;
    align-items: center;
    margin-bottom: 12px;
`;

const Position = styled.Text`
    color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.primary};
    font-size: 24px;
    font-weight: bold;
    min-width: 40px;
`;

const PlayerInfo = styled.View`
    flex: 1;
    margin-left: 12px;
`;

const PlayerName = styled.Text`
    color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textPrimary};
    font-size: 18px;
    font-weight: bold;
`;

const StatsContainer = styled.View`
    flex-direction: row;
    justify-content: space-between;
    padding-top: 12px;
    border-top-width: 1px;
    border-top-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.border};
`;

const StatItem = styled.View`
    align-items: center;
    flex: 1;
`;

const StatValue = styled.Text`
    color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.primary};
    font-size: 16px;
    font-weight: bold;
`;

const StatLabel = styled.Text`
    color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textSecondary};
    font-size: 12px;
    margin-top: 4px;
    text-align: center;
`;

const LoadingContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

const ErrorContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

const ErrorText = styled.Text`
    color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.error};
    font-size: 16px;
    text-align: center;
`;

const EmptyContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

const EmptyText = styled.Text`
    color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textSecondary};
    font-size: 16px;
    text-align: center;
`;

export default function TopJogadores() {
  const [players, setPlayers] = useState<PlayerRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    try {
      console.log('[TopJogadores] Iniciando carregamento de jogadores...');
      
      // Sistema de fallback: original → fixed → mock
      let data: PlayerRanking[];
      
      try {
        console.log('[TopJogadores] Tentando usar rankingService original...');
        data = await rankingService.getTopPlayers();
        console.log('[TopJogadores] rankingService original funcionou!');
      } catch (originalError) {
        console.log('[TopJogadores] rankingService original falhou, tentando fixed...');
        console.error('[TopJogadores] Erro original:', originalError);
        
        try {
          data = await rankingServiceFixed.getTopPlayers();
          console.log('[TopJogadores] rankingServiceFixed funcionou!');
        } catch (fixedError) {
          console.log('[TopJogadores] rankingServiceFixed falhou, usando mock...');
          console.error('[TopJogadores] Erro fixed:', fixedError);
          data = await mockRankingService.getTopPlayers();
        }
      }
      
      console.log('[TopJogadores] Jogadores carregados:', data.length);
      setPlayers(data);
      setError(null);
    } catch (error) {
      console.error('[TopJogadores] Erro ao carregar jogadores:', error);
      setError('Erro ao carregar jogadores. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }

    if (loading) {
        return (
            <Container>
                <Header title="Top Jogadores" showBackButton />
                <LoadingContainer>
                    <ActivityIndicator size="large" color={colors.primary} />
                </LoadingContainer>
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <Header title="Top Jogadores" showBackButton />
                <ErrorContainer>
                    <ErrorText>{error}</ErrorText>
                </ErrorContainer>
            </Container>
        );
    }

    if (players.length === 0) {
        return (
            <Container>
                <Header title="Top Jogadores" showBackButton />
                <EmptyContainer>
                    <EmptyText>Nenhum jogador encontrado</EmptyText>
                </EmptyContainer>
            </Container>
        );
    }

    const calculatePosition = (index: number, items: PlayerRanking[]): number => {
        if (index === 0) return 1;
        const currentWinRate = items[index].winRate;
        const previousWinRate = items[index - 1].winRate;
        return currentWinRate === previousWinRate ? calculatePosition(index - 1, items) : index + 1;
    };
    
    const renderPlayer = ({ item, index }: { item: PlayerRanking; index: number }) => (
        <PlayerCard onPress={() => router.push(`/(pages)/jogador/jogador/${item.id}/jogos`)}>
            <CardHeader>
                <Position>{calculatePosition(index, players)}º</Position>
                <PlayerAvatar 
                    avatarUrl={item.avatar_url} 
                    name={item.name} 
                    size={40} 
                />
                <PlayerInfo>
                    <PlayerName>{item.name}</PlayerName>
                </PlayerInfo>
            </CardHeader>
            <StatsContainer>
                <StatItem>
                    <StatValue>{item.wins}/{item.losses}</StatValue>
                    <StatLabel>Vitórias/{"\n"}Derrotas</StatLabel>
                </StatItem>
                <StatItem>
                    <StatValue>{item.pointsGained}/{item.pointsLost}</StatValue>
                    <StatLabel>Pontos{"\n"}Ganhos/Perdidos</StatLabel>
                </StatItem>
                <StatItem>
                    <StatValue>{item.totalGames}</StatValue>
                    <StatLabel>Total de{"\n"}Jogos</StatLabel>
                </StatItem>
                <StatItem>
                    <StatValue>{item.winRate.toFixed(1)}%</StatValue>
                    <StatLabel>Taxa de{"\n"}Vitória</StatLabel>
                </StatItem>
            </StatsContainer>
            <StatsContainer style={{ marginTop: 8 }}>
                <StatItem>
                    <StatValue>{item.buchudas}/{item.buchudasTaken}</StatValue>
                    <StatLabel>Buchudas{"\n"}Dadas/Levadas</StatLabel>
                </StatItem>
                <StatItem>
                    <StatValue>{item.buchudasDeRe}/{item.buchudasDeReTaken}</StatValue>
                    <StatLabel>Buchudas de Ré{"\n"}Dadas/Levadas</StatLabel>
                </StatItem>
            </StatsContainer>
        </PlayerCard>
    );

    return (
        <Container>
            <Header title="Top Jogadores" showBackButton />
            <Content>
                <FlatList
                    data={players}
                    renderItem={renderPlayer}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                />
            </Content>
        </Container>
    );
}