import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import { useTheme } from '@/contexts/ThemeProvider';
import { InternalHeader } from '@/components/InternalHeader';
import { PageTransition } from '@/components/Transitions';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { rankingService, PairRanking } from '@/services/rankingService';
import { useRouter } from 'expo-router';
import { LoggedLayout } from '@/components/LoggedLayout';
import { PlayerAvatar } from '@/components/PlayerAvatar';

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
    color: ${({ theme }) => theme.colors.error};
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
    color: ${({ theme }) => theme.colors.gray300};
    font-size: 16px;
    text-align: center;
`;

export default function TopDuplas() {
    const [pairs, setPairs] = useState<PairRanking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { colors } = useTheme();
    const router = useRouter();

    useEffect(() => {
        loadPairs();
    }, []);

    const loadPairs = async () => {
        try {
            const data = await rankingService.getTopPairs();
            setPairs(data);
            setError(null);
        } catch (err) {
            setError('Erro ao carregar o ranking de duplas');
        } finally {
            setLoading(false);
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
            <LoggedLayout>
                <Container>
                    <InternalHeader title="Top Duplas" />
                    <LoadingContainer>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </LoadingContainer>
                </Container>
            </LoggedLayout>
        );
    }

    if (error) {
        return (
            <LoggedLayout>
                <Container>
                    <InternalHeader title="Top Duplas" />
                    <ErrorContainer>
                        <ErrorText>{error}</ErrorText>
                    </ErrorContainer>
                </Container>
            </LoggedLayout>
        );
    }

    return (
        <LoggedLayout>
            <PageTransition>
                <Container>
                    <InternalHeader title="Top Duplas" />
                    <Content>
                        {pairs.length > 0 ? (
                            <FlatList
                                data={pairs}
                                renderItem={renderPair}
                                keyExtractor={(item, index) => item.player1Id && item.player2Id ? `${item.player1Id}-${item.player2Id}` : `pair-${index}`}
                            />
                        ) : (
                            <EmptyContainer>
                                <EmptyText>Nenhuma dupla encontrada</EmptyText>
                            </EmptyContainer>
                        )}
                    </Content>
                </Container>
            </PageTransition>
        </LoggedLayout>
    );
}
