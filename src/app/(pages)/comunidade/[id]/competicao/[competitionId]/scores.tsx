import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import styled from 'styled-components/native';
import { useTheme } from 'styled-components/native';
import { CompetitionResult, competitionService } from '@/services/competitionService';
import { InternalHeader } from '@/components/InternalHeader';

export default function CompetitionScores() {
    const router = useRouter();
    const { id: communityId, competitionId } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<CompetitionResult | null>(null);
    const theme = useTheme();

    const loadResults = useCallback(async () => {
        try {
            setLoading(true);
            const results = await competitionService.getCompetitionResults(competitionId as string);
            setResults(results);
        } catch (error) {
            console.error('Erro ao carregar resultados:', error);
            Alert.alert('Erro', 'Não foi possível carregar os resultados');
        } finally {
            setLoading(false);
        }
    }, [competitionId]);

    useEffect(() => {
        loadResults();
    }, [loadResults]);

    const calculatePosition = (index: number, items: Array<any>, scoreKey: string = 'score'): number => {
        if (index === 0) return 1;
        const currentScore = items[index][scoreKey];
        const previousScore = items[index - 1][scoreKey];
        return currentScore === previousScore ? calculatePosition(index - 1, items, scoreKey) : index + 1;
    };

    if (loading) {
        return (
            <Container>
                <InternalHeader title="Classificação" />
                <LoadingContainer>
                    <ActivityIndicator size="large" color={theme.colors.accent} />
                </LoadingContainer>
            </Container>
        );
    }

    return (
        <Container>
            <InternalHeader title="Classificação" />
            <MainContent>
                <ContentContainer>
                    <Section>
                        <SectionTitle>Classificação Individual</SectionTitle>
                        {results?.players.map((player, index) => (
                            <PlayerCard key={player.id}>
                                <Position>{calculatePosition(index, results.players)}º</Position>
                                <PlayerInfo>
                                    <PlayerName>{player.name}</PlayerName>
                                    <PlayerStats>
                                        <StatItem>
                                            <StatLabel>Pontos:</StatLabel>
                                            <StatValue>{player.score}</StatValue>
                                        </StatItem>
                                        <StatItem>
                                            <StatLabel>V/D:</StatLabel>
                                            <StatValue>{player.wins}/{player.losses}</StatValue>
                                        </StatItem>
                                        <StatItem>
                                            <StatLabel>Buchudas dadas:</StatLabel>
                                            <StatValue>{player.buchudas}</StatValue>
                                        </StatItem>
                                        <StatItem>
                                            <StatLabel>Buchudas de Ré dadas:</StatLabel>
                                            <StatValue>{player.buchudasDeRe}</StatValue>
                                        </StatItem>
                                    </PlayerStats>
                                </PlayerInfo>
                            </PlayerCard>
                        ))}
                    </Section>

                    <Section>
                        <SectionTitle>Classificação por Duplas</SectionTitle>
                        {results?.pairs.map((pair, index) => (
                            <PairCard key={pair.players.join('_')}>
                                <Position>{calculatePosition(index, results.pairs)}º</Position>
                                <PairInfo>
                                    <PairPlayers>
                                        {pair.players.map(playerId => {
                                            const player = results.players.find(p => p.id === playerId);
                                            return player?.name;
                                        }).join(' e ')}
                                    </PairPlayers>
                                    <PairStats>
                                        <StatItem>
                                            <StatLabel>Pontos:</StatLabel>
                                            <StatValue>{pair.score}</StatValue>
                                        </StatItem>
                                        <StatItem>
                                            <StatLabel>V/D:</StatLabel>
                                            <StatValue>{pair.wins}/{pair.losses}</StatValue>
                                        </StatItem>
                                        <StatItem>
                                            <StatLabel>Buchudas dadas:</StatLabel>
                                            <StatValue>{pair.buchudas}</StatValue>
                                        </StatItem>
                                        <StatItem>
                                            <StatLabel>Buchudas de Ré dadas:</StatLabel>
                                            <StatValue>{pair.buchudasDeRe}</StatValue>
                                        </StatItem>
                                    </PairStats>
                                </PairInfo>
                            </PairCard>
                        ))}
                    </Section>
                </ContentContainer>
            </MainContent>
        </Container>
    );
}

const Container = styled.View`
    flex: 1;
    background-color: ${({ theme }) => theme.colors.backgroundDark};
`;

const LoadingContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
`;

const MainContent = styled.ScrollView`
    flex: 1;
`;

const ContentContainer = styled.View`
    padding: 16px;
`;

const Section = styled.View`
    margin-bottom: 24px;
`;

const SectionTitle = styled.Text`
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 16px;
    color: ${({ theme }) => theme.colors.textPrimary};
`;

const PlayerCard = styled.View`
    flex-direction: row;
    background-color: ${({ theme }) => theme.colors.secondary};
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 8px;
`;

const PairCard = styled(PlayerCard)``;

const Position = styled.Text`
    font-size: 16px;
    font-weight: bold;
    margin-right: 12px;
    color: ${({ theme }) => theme.colors.textPrimary};
`;

const PlayerInfo = styled.View`
    flex: 1;
`;

const PairInfo = styled(PlayerInfo)``;

const PlayerName = styled.Text`
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 4px;
    color: ${({ theme }) => theme.colors.textPrimary};
`;

const PairPlayers = styled(PlayerName)``;

const PlayerStats = styled.View`
    flex-direction: row;
    flex-wrap: wrap;
`;

const PairStats = styled(PlayerStats)``;

const StatItem = styled.View`
    flex-direction: row;
    align-items: center;
    margin-right: 16px;
    margin-bottom: 4px;
`;

const StatLabel = styled.Text`
    font-size: 14px;
    color: ${({ theme }) => theme.colors.textSecondary};
    margin-right: 4px;
`;

const StatValue = styled.Text`
    font-size: 14px;
    font-weight: bold;
    color: ${({ theme }) => theme.colors.textPrimary};
`;
