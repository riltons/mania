import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import { useTheme } from '@/core/contexts/ThemeProvider';
import { Header } from '@/core/components/layout/Header';
import { rankingService, PairRanking } from '@/features/statistics/services/rankingService';
import rankingServiceFixed from '@/features/statistics/services/rankingServiceFixed';
import { mockRankingService } from '@/features/statistics/services/simpleRankingTest';
import { useRouter } from 'expo-router';
import { PlayerAvatar } from '@/core/components/data-display/PlayerAvatar';
import { DefaultTheme } from 'styled-components';

const Container = styled.View`
    flex: 1;
    background-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.backgroundDark};
`;

const Content = styled.View`
    flex: 1;
    padding: 20px 16px;
`;

const PairCard = styled.TouchableOpacity`
    background-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.backgroundMedium};
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid ${({ theme }: { theme: DefaultTheme }) => theme.colors.tertiary}40;
`;

const Position = styled.Text`
    color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.primary};
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
    color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textPrimary};
    font-size: 16px;
    font-weight: bold;
    margin-left: 8px;
`;

const StatsContainer = styled.View`
    flex-direction: row;
    justify-content: space-between;
    padding-top: 16px;
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

export default function TopDuplas() {
    const [pairs, setPairs] = useState<PairRanking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { colors } = useTheme();
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;
        
        const loadPairs = async () => {
            try {
                console.log('[TopDuplas] Iniciando carregamento de duplas...');
                
                // Sistema de fallback: original → fixed → mock
                let data: PairRanking[];
                
                try {
                    console.log('[TopDuplas] Tentando usar rankingService original...');
                    data = await rankingService.getTopPairs();
                    console.log('[TopDuplas] rankingService original funcionou!');
                } catch (originalError) {
                    console.log('[TopDuplas] rankingService original falhou, tentando fixed...');
                    console.error('[TopDuplas] Erro original:', originalError);
                    
                    try {
                        data = await rankingServiceFixed.getTopPairs();
                        console.log('[TopDuplas] rankingServiceFixed funcionou!');
                    } catch (fixedError) {
                        console.log('[TopDuplas] rankingServiceFixed falhou, usando mock...');
                        console.error('[TopDuplas] Erro fixed:', fixedError);
                        data = await mockRankingService.getTopPairs();
                    }
                }
                
                console.log('[TopDuplas] Duplas carregadas:', data.length);
                if (isMounted) {
                    setPairs(data || []);
                    setError(null);
                }
            } catch (err) {
                console.error('[TopDuplas] Erro ao carregar duplas:', err);
                if (isMounted) {
                    setError('Erro ao carregar o ranking de duplas. Tente novamente mais tarde.');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadPairs();
        
        return () => {
            isMounted = false;
        };
    }, []);

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
                <Header title="Top Duplas" showBackButton />
                <LoadingContainer>
                    <ActivityIndicator size="large" color={colors.primary} />
                </LoadingContainer>
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <Header title="Top Duplas" showBackButton />
                <ErrorContainer>
                    <ErrorText>{error}</ErrorText>
                </ErrorContainer>
            </Container>
        );
    }

    if (pairs.length === 0) {
        return (
            <Container>
                <Header title="Top Duplas" showBackButton />
                <EmptyContainer>
                    <EmptyText>Nenhuma dupla encontrada</EmptyText>
                </EmptyContainer>
            </Container>
        );
    }

    return (
        <Container>
            <Header title="Top Duplas" showBackButton />
            <Content>
                <FlatList
                    data={pairs}
                    renderItem={renderPair}
                    keyExtractor={(item, index) => 
                        item.player1?.id && item.player2?.id 
                            ? `${item.player1.id}-${item.player2.id}` 
                            : `pair-${index}`
                    }
                    showsVerticalScrollIndicator={false}
                />
            </Content>
        </Container>
    );
}