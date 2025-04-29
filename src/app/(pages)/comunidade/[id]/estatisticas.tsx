import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import styled from 'styled-components/native';
import { useTheme } from '@/contexts/ThemeProvider';
import { Feather } from '@expo/vector-icons';
import { communityStatsService, CommunityStats } from '@/services/communityStatsService';
import { communityService } from '@/services/communityService';
import { InternalHeader } from '@/components/InternalHeader';

export default function CommunityStatsPage() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { colors } = useTheme();
    const [stats, setStats] = useState<CommunityStats | null>(null);
    const [community, setCommunity] = useState<{ name: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [communityData, statsData] = await Promise.all([
                communityService.getById(id as string),
                communityStatsService.getCommunityStats(id as string)
            ]);
            setCommunity(communityData);
            setStats(statsData);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Container>
                <InternalHeader title="Estatísticas" />
                <LoadingContainer>
                    <ActivityIndicator size="large" color={colors.primary} />
                </LoadingContainer>
            </Container>
        );
    }

    return (
        <Container>
            <InternalHeader title={`Estatísticas - ${community?.name || ''}`} />
            {loading ? (
                <LoadingContainer>
                    <ActivityIndicator size="large" color={colors.primary} />
                </LoadingContainer>
            ) : (
                <Content>
                    <ScrollView>
                        <Section>
                            <SectionTitle>Jogadores</SectionTitle>
                            {stats?.players.map((player) => (
                                <StatCard key={player.id}>
                                    <PlayerName>{player.name}</PlayerName>
                                    <StatRow>
                                        <StatItem>
                                            <StatLabel>Vitórias</StatLabel>
                                            <StatValue>{player.wins}</StatValue>
                                        </StatItem>
                                        <StatItem>
                                            <StatLabel>Derrotas</StatLabel>
                                            <StatValue>{player.losses}</StatValue>
                                        </StatItem>
                                        <StatItem>
                                            <StatLabel>Pontos</StatLabel>
                                            <StatValue>{player.score}</StatValue>
                                        </StatItem>
                                    </StatRow>
                                    <StatRow>
                                        <StatItem>
                                            <StatLabel>Buchudas</StatLabel>
                                            <StatValue>+{player.buchudas_given} / -{player.buchudas_taken}</StatValue>
                                        </StatItem>
                                        <StatItem>
                                            <StatLabel>Buchudas de Ré</StatLabel>
                                            <StatValue>+{player.buchudas_de_re_given} / -{player.buchudas_de_re_taken}</StatValue>
                                        </StatItem>
                                    </StatRow>
                                </StatCard>
                            ))}
                        </Section>

                        <Section>
                            <SectionTitle>Duplas</SectionTitle>
                            {stats?.pairs.map((pair, index) => (
                                <StatCard key={index}>
                                    <PairNames>
                                        {pair.players.map((player) => player.name).join(' & ')}
                                    </PairNames>
                                    <StatRow>
                                        <StatItem>
                                            <StatLabel>Vitórias</StatLabel>
                                            <StatValue>{pair.wins}</StatValue>
                                        </StatItem>
                                        <StatItem>
                                            <StatLabel>Derrotas</StatLabel>
                                            <StatValue>{pair.losses}</StatValue>
                                        </StatItem>
                                        <StatItem>
                                            <StatLabel>Pontos</StatLabel>
                                            <StatValue>{pair.score}</StatValue>
                                        </StatItem>
                                    </StatRow>
                                    <StatRow>
                                        <StatItem>
                                            <StatLabel>Buchudas</StatLabel>
                                            <StatValue>+{pair.buchudas_given} / -{pair.buchudas_taken}</StatValue>
                                        </StatItem>
                                        <StatItem>
                                            <StatLabel>Buchudas de Ré</StatLabel>
                                            <StatValue>+{pair.buchudas_de_re_given} / -{pair.buchudas_de_re_taken}</StatValue>
                                        </StatItem>
                                    </StatRow>
                                </StatCard>
                            ))}
                        </Section>
                    </ScrollView>
                </Content>
            )}
        </Container>
    );
}

const Container = styled.View`
    flex: 1;
    background-color: ${props => props.theme.colors.backgroundDark};
    padding: 0;
`;

const LoadingContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
`;

const Content = styled.View`
    flex: 1;
    padding: 8px;
`;

const Section = styled.View`
    margin-bottom: 24px;
`;

const SectionTitle = styled.Text`
    font-size: 20px;
    font-weight: bold;
    color: ${props => props.theme.colors.gray100};
    margin-bottom: 16px;
`;

const StatCard = styled.View`
    background-color: ${props => props.theme.colors.backgroundLight};
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
`;

const PlayerName = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: ${props => props.theme.colors.gray100};
    margin-bottom: 12px;
`;

const PairNames = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: ${props => props.theme.colors.gray100};
    margin-bottom: 12px;
`;

const StatRow = styled.View`
    flex-direction: row;
    justify-content: space-between;
    margin-bottom: 8px;
`;

const StatItem = styled.View`
    align-items: center;
`;

const StatLabel = styled.Text`
    font-size: 14px;
    color: ${props => props.theme.colors.textSecondary};
    margin-bottom: 4px;
`;

const StatValue = styled.Text`
    font-size: 16px;
    font-weight: bold;
    color: ${props => props.theme.colors.primary};
`;
