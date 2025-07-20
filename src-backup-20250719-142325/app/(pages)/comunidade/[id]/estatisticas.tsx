import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import styled from 'styled-components/native';
import { useTheme } from '@/core/contexts/ThemeProvider';
import { DefaultTheme } from 'styled-components/native';

// Tipos para os componentes estilizados
interface ThemeProps {
  theme: DefaultTheme;
}

interface ContainerProps {
  theme: DefaultTheme;
}

interface CardProps {
  theme: DefaultTheme;
  first?: boolean;
}

interface StatValueProps {
  theme: DefaultTheme;
  highlight?: boolean;
}

interface StatLabelProps {
  theme: DefaultTheme;
}

interface StatCardProps {
  theme: DefaultTheme;
}

interface LoadingContainerProps {
  theme: DefaultTheme;
}
import { Feather } from '@expo/vector-icons';
import { communityStatsService, CommunityStats } from '@/services/communityStatsService';
import { communityService } from '@/features/communities/services/communityService';
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

const Container = styled.View<ContainerProps>`
    flex: 1;
    background-color: ${props => props.theme.colors.backgroundDark};
    padding: 0;
`;

const LoadingContainer = styled.View<LoadingContainerProps>`
    flex: 1;
    justify-content: center;
    align-items: center;
`;

const Content = styled.View<ThemeProps>`
    flex: 1;
    padding: 8px;
`;

const Section = styled.View<ThemeProps>`
    margin-bottom: 24px;
`;

const SectionTitle = styled.Text<ThemeProps>`
    font-size: 20px;
    font-weight: bold;
    color: ${(props: ThemeProps) => props.theme.colors.textPrimary};
    margin-bottom: 16px;
`;

const StatCard = styled.View<StatCardProps>`
    background-color: ${(props: ThemeProps) => props.theme.colors.backgroundLight};
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
`;

const PlayerName = styled.Text<ThemeProps>`
    font-size: 18px;
    font-weight: bold;
    color: ${(props: ThemeProps) => props.theme.colors.textPrimary};
    margin-bottom: 12px;
`;

const PairNames = styled.Text<ThemeProps>`
    font-size: 18px;
    font-weight: bold;
    color: ${(props: ThemeProps) => props.theme.colors.textPrimary};
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

const StatLabel = styled.Text<ThemeProps>`
    font-size: 14px;
    color: ${props => props.theme.colors.textSecondary};
    margin-bottom: 4px;
`;

const StatValue = styled.Text<ThemeProps>`
    font-size: 16px;
    font-weight: bold;
    color: ${props => props.theme.colors.primary};
`;
