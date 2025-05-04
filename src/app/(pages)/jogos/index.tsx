import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, ScrollView, View, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import styled from 'styled-components/native';
import { GameWithDetails, gamesService } from '@/services/gamesService';
import { Feather } from '@expo/vector-icons';
import { formatDate } from '@/utils/date';
import { InternalHeader } from '@/components/InternalHeader';
import { useTheme } from 'styled-components/native';

export default function GamesPage() {
    const router = useRouter();
    const [games, setGames] = useState<GameWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentCommunity, setCurrentCommunity] = useState<string>('');
    const scrollY = useRef(new Animated.Value(0)).current;
    const scrollRef = useRef<ScrollView>(null);
    const { colors } = useTheme();
    const { width } = Dimensions.get('window');

    useEffect(() => {
        loadGames();
    }, []);

    // Agrupar jogos por comunidade
    const gamesByCommunity = React.useMemo(() => {
        const grouped: Record<string, { communityName: string, games: GameWithDetails[] }> = {};
        
        games.forEach(game => {
            const communityId = game.competition.community.id;
            if (!grouped[communityId]) {
                grouped[communityId] = {
                    communityName: game.competition.community.name,
                    games: []
                };
            }
            grouped[communityId].games.push(game);
        });
        
        return Object.values(grouped);
    }, [games]);

    // Detectar a comunidade atual durante a rolagem
    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false, listener: (event: any) => {
            const offsetY = event.nativeEvent.contentOffset.y;
            let totalHeight = 0;
            
            for (let i = 0; i < gamesByCommunity.length; i++) {
                const communityGames = gamesByCommunity[i];
                const sectionHeight = 50 + (communityGames.games.length * 180); // Altura aproximada
                
                if (offsetY >= totalHeight && offsetY < totalHeight + sectionHeight) {
                    if (currentCommunity !== communityGames.communityName) {
                        setCurrentCommunity(communityGames.communityName);
                    }
                    break;
                }
                
                totalHeight += sectionHeight;
            }
        }}
    );

    const loadGames = async () => {
        try {
            setLoading(true);
            const games = await gamesService.getUserGames();
            setGames(games);
            
            // Definir a comunidade inicial
            if (games.length > 0) {
                setCurrentCommunity(games[0].competition.community.name);
            }
        } catch (error) {
            console.error('Erro ao carregar jogos:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <LoadingContainer>
                <ActivityIndicator size="large" color={colors.accent} />
            </LoadingContainer>
        );
    }

    return (
        <Container>
            <InternalHeader title="Meus Jogos" />
            
            {/* Cabeçalho fixo da comunidade atual */}
            <CommunityHeader>
                <CommunityHeaderText>{currentCommunity}</CommunityHeaderText>
            </CommunityHeader>
            
            <ScrollView
                ref={scrollRef}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingTop: 56 }} // Adicionar espaço para o cabeçalho fixo
            >
                <ContentContainer>
                    {gamesByCommunity.map((communityGroup, index) => (
                        <CommunitySection key={index}>
                            <CommunitySectionHeader>
                                <CommunitySectionName>{communityGroup.communityName}</CommunitySectionName>
                            </CommunitySectionHeader>
                            
                            {communityGroup.games.map((game) => (
                                <GameCard key={game.id}>
                                    <CompetitionName>{game.competition.name}</CompetitionName>
                                    
                                    <TeamsContainer>
                                        <TeamContainer>
                                            <TeamScore winner={game.team1_score > game.team2_score}>
                                                {game.team1_score}
                                            </TeamScore>
                                            <TeamPlayers>
                                                {game.team1_players && game.team1_players.length > 0 
                                                    ? game.team1_players.map(player => player.name).join(' & ')
                                                    : 'Jogador 1'}
                                            </TeamPlayers>
                                        </TeamContainer>

                                        <VsText>vs</VsText>

                                        <TeamContainer>
                                            <TeamScore winner={game.team2_score > game.team1_score}>
                                                {game.team2_score}
                                            </TeamScore>
                                            <TeamPlayers>
                                                {game.team2_players && game.team2_players.length > 0 
                                                    ? game.team2_players.map(player => player.name).join(' & ')
                                                    : 'Jogador 2'}
                                            </TeamPlayers>
                                        </TeamContainer>
                                    </TeamsContainer>

                                    <GameDetails>
                                        {game.is_buchuda && (
                                            <GameBadge>
                                                <Feather name="star" size={12} color={colors.accent} />
                                                <BadgeText>Buchuda</BadgeText>
                                            </GameBadge>
                                        )}
                                        {game.is_buchuda_de_re && (
                                            <GameBadge>
                                                <Feather name="star" size={12} color={colors.accent} />
                                                <BadgeText>Buchuda de Ré</BadgeText>
                                            </GameBadge>
                                        )}
                                        <GameDate>{formatDate(game.created_at)}</GameDate>
                                    </GameDetails>
                                </GameCard>
                            ))}
                        </CommunitySection>
                    ))}
                </ContentContainer>
            </ScrollView>
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
    background-color: ${({ theme }) => theme.colors.backgroundDark};
`;

const ContentContainer = styled.View`
    padding: 16px;
`;

// Cabeçalho fixo da comunidade
const CommunityHeader = styled.View`
    background-color: ${({ theme }) => theme.colors.accent};
    padding: 12px 16px;
    position: absolute;
    top: 56px; /* Altura do InternalHeader */
    left: 0;
    right: 0;
    z-index: 10;
    elevation: 5;
    shadow-color: #000;
    shadow-offset: 0px 2px;
    shadow-opacity: 0.25;
    shadow-radius: 3.84px;
`;

const CommunityHeaderText = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: white;
    text-align: center;
`;

// Seção de comunidade
const CommunitySection = styled.View`
    margin-bottom: 20px;
`;

const CommunitySectionHeader = styled.View`
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom-width: 1px;
    border-bottom-color: ${({ theme }) => theme.colors.border};
`;

const CommunitySectionName = styled.Text`
    font-size: 16px;
    font-weight: bold;
    color: ${({ theme }) => theme.colors.textPrimary};
`;

const GameCard = styled.View`
    background-color: ${({ theme }) => theme.colors.secondary};
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
`;

const CommunityName = styled.Text`
    font-size: 14px;
    color: ${({ theme }) => theme.colors.textSecondary};
    margin-bottom: 4px;
`;

const CompetitionName = styled.Text`
    font-size: 16px;
    font-weight: bold;
    color: ${({ theme }) => theme.colors.textPrimary};
    margin-bottom: 12px;
`;

const TeamsContainer = styled.View`
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
`;

const TeamContainer = styled.View`
    flex: 1;
    align-items: center;
`;

const TeamScore = styled.Text<{ winner: boolean }>`
    font-size: 24px;
    font-weight: bold;
    color: ${props => props.winner ? props.theme.colors.accent : props.theme.colors.textSecondary};
    margin-bottom: 4px;
`;

const TeamPlayers = styled.Text`
    font-size: 14px;
    color: ${({ theme }) => theme.colors.textSecondary};
    text-align: center;
`;

const VsText = styled.Text`
    font-size: 14px;
    color: ${({ theme }) => theme.colors.textSecondary};
    margin: 0 12px;
`;

const GameDetails = styled.View`
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 8px;
`;

const GameBadge = styled.View`
    flex-direction: row;
    align-items: center;
    background-color: ${({ theme }) => theme.colors.backgroundLight};
    padding: 4px 8px;
    border-radius: 4px;
    gap: 4px;
`;

const BadgeText = styled.Text`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textSecondary};
`;

const GameDate = styled.Text`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textSecondary};
    margin-left: auto;
`;
