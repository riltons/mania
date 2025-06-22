import React, { useEffect } from 'react';
import { FlatList, TouchableOpacity } from 'react-native';
import { PlayerAvatar } from '../../../core/components/data-display/PlayerAvatar';
import styled from 'styled-components/native';
import { useTheme } from '../../../core/contexts/ThemeProvider';
import { ThemeType } from '../../../core/theme';
import { InternalHeader } from '../../../core/components/navigation/InternalHeader';
import { PageTransition } from '../../../core/components/transitions/PageTransition';
import { Feather } from '@expo/vector-icons';
import { rankingService, PlayerRanking } from '../../../features/statistics/services/rankingService';
import { useRouter } from 'expo-router';
import { LoadingState, ErrorState, EmptyState } from '../../../core/components/feedback';
import { useAsyncState } from '../../../core/hooks';

const Container = styled.View`
    flex: 1;
    background-color: ${({ theme }: { theme: ThemeType }) => theme.colors.backgroundDark};
`;

const Content = styled.View`
    flex: 1;
    padding: 20px;
`;

const PlayerCard = styled.TouchableOpacity`
    background-color: ${({ theme }: { theme: ThemeType }) => theme.colors.backgroundMedium};
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
`;

const CardHeader = styled.View`
    flex-direction: row;
    align-items: center;
    margin-bottom: 12px;
`;

const Position = styled.Text`
    color: ${({ theme }: { theme: ThemeType }) => theme.colors.primary};
    font-size: 24px;
    font-weight: bold;
    min-width: 40px;
`;

const PlayerInfo = styled.View`
    flex: 1;
    margin-left: 12px;
`;

const PlayerName = styled.Text`
    color: ${({ theme }: { theme: ThemeType }) => theme.colors.gray100};
    font-size: 18px;
    font-weight: bold;
`;

const StatsContainer = styled.View`
    flex-direction: row;
    justify-content: space-between;
    padding-top: 12px;
    border-top-width: 1px;
    border-top-color: ${({ theme }: { theme: ThemeType }) => theme.colors.backgroundLight};
`;

const StatItem = styled.View`
    align-items: center;
    flex: 1;
`;

const StatValue = styled.Text`
    color: ${({ theme }: { theme: ThemeType }) => theme.colors.primary};
    font-size: 16px;
    font-weight: bold;
`;

const StatLabel = styled.Text`
    color: ${({ theme }: { theme: ThemeType }) => theme.colors.gray300};
    font-size: 12px;
    margin-top: 4px;
    text-align: center;
`;

export default function TopJogadores() {
  const { data: players, loading, error, setData, setError, setLoading } = useAsyncState<PlayerRanking[]>([]);
  const router = useRouter();
  const theme = useTheme();
  const colors = theme.colors;

  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    setLoading(true);
    try {
      const data = await rankingService.getTopPlayers();
      setData(data);
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error);
      setError('Erro ao carregar jogadores. Tente novamente mais tarde.');
    }
  }

    if (loading) {
        return (
            <Container>
                <InternalHeader title="Top Jogadores" />
                <LoadingState message="Carregando ranking..." />
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <InternalHeader title="Top Jogadores" />
                <ErrorState message={error} onRetry={loadPlayers} />
            </Container>
        );
    }

    if (!players || players.length === 0) {
        return (
            <Container>
                <InternalHeader title="Top Jogadores" />
                <EmptyState 
                    message="Nenhum jogador encontrado" 
                    icon="person-outline"
                />
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
        <PlayerCard onPress={() => router.push(`/jogador/jogador/${item.id}/jogos`)}>
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
        <PageTransition>
            <Container>
                <InternalHeader title="Top Jogadores" rightComponent={
                        <TouchableOpacity onPress={() => router.push('/')}>
                            <Feather name="bar-chart-2" size={24} color={colors.gray100} />
                        </TouchableOpacity>
                    }/>
                <Content>
                    <FlatList
                        data={players}
                        renderItem={renderPlayer}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                    />
                </Content>
            </Container>
        </PageTransition>
    );
}

