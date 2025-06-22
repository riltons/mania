import React, { useEffect } from 'react';
import { View, FlatList } from 'react-native';
import styled from 'styled-components/native';
import { useTheme } from '../../../core/contexts/ThemeProvider';
import { InternalHeader } from '../../../core/components/navigation/InternalHeader';
import { PageTransition } from '../../../core/components/transitions/PageTransition';
import { rankingService, PairRanking } from '../services/rankingService';
import { useRouter } from 'expo-router';
import { LoadingState, ErrorState, EmptyState } from '../../../core/components/feedback';
import { useAsyncState } from '../../../core/hooks';
import { PlayerAvatar } from '../../../core/components/data-display/PlayerAvatar';

const Container = styled.View`
    flex: 1;
    background-color: ${({ theme }) => theme.colors.backgroundDark};
`;

const Content = styled.View`
    flex: 1;
    padding: 20px;
`;

const PairCard = styled.TouchableOpacity`
    background-color: ${({ theme }) => theme.colors.backgroundMedium};
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
`;

const Position = styled.Text`
    color: ${({ theme }) => theme.colors.primary};
    font-size: 24px;
    font-weight: bold;
    min-width: 40px;
`;

const CardHeader = styled.View`
    flex-direction: column;
    margin-bottom: 16px;
`;

const PlayersContainer = styled.View`
    flex-direction: column;
    align-items: flex-start;
    margin-top: 12px;
    margin-bottom: 12px;
`;

const PlayerInfo = styled.View`
    flex-direction: row;
    align-items: center;
`;

const PlayerName = styled.Text`
    color: ${({ theme }) => theme.colors.gray100};
    font-size: 16px;
    font-weight: bold;
    margin-left: 8px;
`;

const Separator = styled.View`
    margin-horizontal: 8px;
    align-items: center;
`;

const PlayerIcon = styled.View`
    width: 32px;
    height: 32px;
    border-radius: 16px;
    background-color: ${({ theme }) => theme.colors.primary}20;
    align-items: center;
    justify-content: center;
    margin-right: 4px;
`;

const PlayerSeparator = styled.View`
    width: 32px;
    align-items: center;
    margin-vertical: 8px;
`;

const SeparatorText = styled.Text`
    color: ${({ theme }) => theme.colors.gray300};
    font-size: 14px;
`;

const StatsContainer = styled.View`
    flex-direction: row;
    justify-content: space-between;
    padding-top: 16px;
    border-top-width: 1px;
    border-top-color: ${({ theme }) => theme.colors.backgroundLight};
`;

const StatItem = styled.View`
    align-items: center;
    flex: 1;
`;

const StatValue = styled.Text`
    color: ${({ theme }) => theme.colors.primary};
    font-size: 16px;
    font-weight: bold;
`;

const StatLabel = styled.Text`
    color: ${({ theme }) => theme.colors.gray300};
    font-size: 12px;
    margin-top: 4px;
    text-align: center;
`;

export default function TopDuplas() {
    const { data: pairs, loading, error, setData, setError, setLoading } = useAsyncState<PairRanking[]>([]);
    const { colors } = useTheme();
    const router = useRouter();

    useEffect(() => {
        loadPairs();
    }, []);

    const loadPairs = async () => {
        setLoading(true);
        try {
            const data = await rankingService.getTopPairs();
            setData(data);
        } catch (err) {
            setError('Erro ao carregar o ranking de duplas');
        }
    };

    const renderPair = ({ item, index }: { item: PairRanking; index: number }) => (
        <PairCard>
            <CardHeader>
                <Position>{index + 1}º</Position>
                <PlayersContainer>
                    <PlayerInfo>
                        <PlayerAvatar 
                            avatarUrl={item.player1.avatar_url} 
                            name={item.player1.name} 
                            size={32} 
                        />
                        <PlayerName>{item.player1.name}</PlayerName>
                    </PlayerInfo>
                    <View style={{ height: 8 }} />
                    <PlayerInfo>
                        <PlayerAvatar 
                            avatarUrl={item.player2.avatar_url} 
                            name={item.player2.name} 
                            size={32} 
                        />
                        <PlayerName>{item.player2.name}</PlayerName>
                    </PlayerInfo>
                </PlayersContainer>
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
        </PairCard>
    );

    if (loading) {
        return (
            <Container>
                <InternalHeader title="Top Duplas" />
                <LoadingState message="Carregando ranking..." />
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <InternalHeader title="Top Duplas" />
                <ErrorState message={error} onRetry={loadPairs} />
            </Container>
        );
    }

    return (
        <PageTransition>
            <Container>
                <InternalHeader title="Top Duplas" />
                <Content>
                    {pairs && pairs.length > 0 ? (
                        <FlatList
                            data={pairs}
                            renderItem={renderPair}
                            keyExtractor={(item, index) => item.player1?.id && item.player2?.id ? `${item.player1.id}-${item.player2.id}` : `pair-${index}`}
                        />
                    ) : (
                        <EmptyState 
                            message="Nenhuma dupla encontrada" 
                            icon="people-outline"
                        />
                    )}
                </Content>
            </Container>
        </PageTransition>
    );
}

