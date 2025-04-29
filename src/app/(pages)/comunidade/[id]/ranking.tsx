import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import styled from 'styled-components/native';
import { useTheme } from '@/contexts/ThemeProvider';
import { rankingService, PlayerRanking, PairRanking } from '@/services/rankingService';
import { InternalHeader } from '@/components/InternalHeader';

const Container = styled.View`
  flex: 1;
  background-color: ${props => props.theme.colors.backgroundDark};
  padding: 0;
`;

const Content = styled.View`
  flex: 1;
  padding: 8px;
`;

const SectionTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: ${props => props.theme.colors.textPrimary};
  margin-top: 24px;
  margin-bottom: 12px;
`;

const RankingCard = styled.View`
  background-color: ${props => props.theme.colors.backgroundMedium};
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid ${props => props.theme.colors.border};
`;

const RankingText = styled.Text`
  color: ${props => props.theme.colors.textPrimary};
  font-size: 16px;
  margin-bottom: 4px;
`;

const StatsContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 4px;
`;

const StatItem = styled.View`
  align-items: center;
`;

const StatLabel = styled.Text`
  color: ${props => props.theme.colors.textTertiary};
  font-size: 12px;
`;

const StatValue = styled.Text`
  color: ${props => props.theme.colors.textPrimary};
  font-size: 14px;
  font-weight: bold;
`;

export default function CommunityRanking() {
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<PlayerRanking[]>([]);
  const [pairs, setPairs] = useState<PairRanking[]>([]);

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    try {
      setLoading(true);
      const communityId = params.id as string;
      const [playersData, pairsData] = await Promise.all([
        rankingService.getTopPlayers(communityId),
        rankingService.getTopPairs(communityId)
      ]);
      setPlayers(playersData);
      setPairs(pairsData);
    } catch (error) {
      console.error('Error loading rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <InternalHeader title="Classificação" />
        <Content>
          <ActivityIndicator size="large" color={colors.primary} />
        </Content>
      </Container>
    );
  }

  return (
    <Container>
      <InternalHeader title="Classificação" />
      <ScrollView>
        <Content>
          <SectionTitle>Ranking Individual</SectionTitle>
          {players.map((player, index) => (
            <RankingCard key={player.id}>
              <RankingText>{index + 1}. {player.name}</RankingText>
              <StatsContainer>
                <StatItem>
                  <StatValue>{player.points}</StatValue>
                  <StatLabel>Pontos</StatLabel>
                </StatItem>
                <StatItem>
                  <StatValue>{player.wins}</StatValue>
                  <StatLabel>Vitórias</StatLabel>
                </StatItem>
                <StatItem>
                  <StatValue>{player.losses}</StatValue>
                  <StatLabel>Derrotas</StatLabel>
                </StatItem>
                <StatItem>
                  <StatValue>{player.winRate}%</StatValue>
                  <StatLabel>Taxa de Vitória</StatLabel>
                </StatItem>
              </StatsContainer>
            </RankingCard>
          ))}

          <SectionTitle>Ranking de Duplas</SectionTitle>
          {pairs.map((pair, index) => (
            <RankingCard key={`${pair.player1.id}-${pair.player2.id}`}>
              <RankingText>{index + 1}. {pair.player1.name} e {pair.player2.name}</RankingText>
              <StatsContainer>
                <StatItem>
                  <StatValue>{pair.points}</StatValue>
                  <StatLabel>Pontos</StatLabel>
                </StatItem>
                <StatItem>
                  <StatValue>{pair.wins}</StatValue>
                  <StatLabel>Vitórias</StatLabel>
                </StatItem>
                <StatItem>
                  <StatValue>{pair.losses}</StatValue>
                  <StatLabel>Derrotas</StatLabel>
                </StatItem>
                <StatItem>
                  <StatValue>{pair.winRate}%</StatValue>
                  <StatLabel>Taxa de Vitória</StatLabel>
                </StatItem>
              </StatsContainer>
            </RankingCard>
          ))}
        </Content>
      </ScrollView>
    </Container>
  );
}