import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, SectionList } from 'react-native';
import styled from 'styled-components/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { InternalHeader } from '@/components/InternalHeader';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { gameService, Game } from '@/services/gameService';
import { playerService } from '@/services/playerService';
import { useTheme } from 'styled-components/native';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';

type Game = {
    id: string;
    team1: string[];
    team2: string[];
    team1_score: number;
    team2_score: number;
    status: string;
    is_buchuda: boolean;
    is_buchuda_de_re: boolean;
    created_at: string;
    competition_id: string;
    competitions?: {
        id: string;
        name: string;
    };
};

type Player = {
    id: string;
    name: string;
};

type CompetitionGames = {
    id: string;
    name: string;
    games: Game[];
};

const Container = styled.View`
    flex: 1;
    background-color: ${({ theme }) => theme.colors.backgroundDark};
`;

const Content = styled.View`
    flex: 1;
    padding: 16px;
`;

const GamesList = styled.FlatList`
    flex: 1;
    padding: 16px;
`;

const GameCard = styled.View`
    background-color: ${({ theme }) => theme.colors.secondary};
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
`;

const GameDate = styled.Text`
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 14px;
    margin-bottom: 8px;
`;

const GameScore = styled.View`
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
`;

const TeamScore = styled.View`
    align-items: center;
    width: 40%;
`;

const TeamName = styled.Text`
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 4px;
    text-align: center;
`;

const Score = styled.Text`
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: 24px;
    font-weight: bold;
`;

const Separator = styled.Text`
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 20px;
    margin: 0 12px;
`;

const LoadingContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
`;

const LoadingText = styled.Text`
    font-size: 18px;
    color: ${({ theme }) => theme.colors.textPrimary};
    text-align: center;
    margin-top: 20px;
`;

const EmptyContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

const EmptyText = styled.Text`
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 16px;
    text-align: center;
`;

const BuchudaTag = styled.View`
    background-color: ${({ theme }) => theme.colors.accent};
    padding: 4px 8px;
    border-radius: 4px;
    margin-top: 8px;
    align-self: flex-start;
`;

const ResultBadge = styled.View<{ isWinner: boolean }>`
    background-color: ${({ isWinner, theme }) => isWinner ? theme.colors.success : theme.colors.error};
    padding: 6px 12px;
    border-radius: 8px;
    margin-top: 12px;
    align-self: center;
    margin-right: 8px;
`;

const VictoryTag = styled.View`
    background-color: ${({ theme }) => theme.colors.success};
    padding: 4px 8px;
    border-radius: 4px;
    margin-top: 8px;
    margin-right: 8px;
    align-self: flex-start;
`;

const DefeatTag = styled.View`
    background-color: ${({ theme }) => theme.colors.error};
    padding: 4px 8px;
    border-radius: 4px;
    margin-top: 8px;
    margin-right: 8px;
    align-self: flex-start;
`;

const BuchudaText = styled.Text`
    color: ${({ theme }) => theme.colors.white};
    font-size: 12px;
`;

const ResultText = styled.Text`
    color: ${({ theme }) => theme.colors.white};
    font-size: 16px;
    font-weight: bold;
`;

const StatsButton = styled.TouchableOpacity`
    flex-direction: row;
    align-items: center;
    padding: 8px 16px;
    border-radius: 8px;
    background-color: ${({ theme }) => theme.colors.backgroundLight}20;
`;

const BackButton = styled.TouchableOpacity`
    padding: 8px;
    margin-right: 16px;
`;

export default function PlayerGames() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [player, setPlayer] = useState<any>(null);
    const [competitionGames, setCompetitionGames] = useState<CompetitionGames[]>([]);
    const [playerNames, setPlayerNames] = useState<{[key: string]: string}>({});
    const { colors } = useTheme();

    useEffect(() => {
        loadPlayerAndGames();
    }, []);

    const loadPlayerAndGames = async () => {
        try {
            setLoading(true);
            const [playerData, gamesData] = await Promise.all([
                playerService.getById(id as string),
                gameService.listByPlayer(id as string)
            ]);
            setPlayer(playerData);
            setCompetitionGames(gamesData || []);
            
            // Coletar todos os IDs de jogadores para buscar seus nomes
            const playerIds = new Set<string>();
            gamesData?.forEach(competition => {
                competition.games.forEach(game => {
                    game.team1.forEach(playerId => playerIds.add(playerId));
                    game.team2.forEach(playerId => playerIds.add(playerId));
                });
            });
            
            // Buscar nomes de todos os jogadores
            if (playerIds.size > 0) {
                const { data: playersData } = await supabase
                    .from('players')
                    .select('id, name')
                    .in('id', Array.from(playerIds));
                
                if (playersData) {
                    const namesMap: {[key: string]: string} = {};
                    playersData.forEach(player => {
                        namesMap[player.id] = player.name;
                    });
                    setPlayerNames(namesMap);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar jogador e jogos:', error);
        } finally {
            setLoading(false);
        }
    };

    // Função para formatar os nomes dos jogadores de um time
    const formatTeamNames = (teamIds: string[]) => {
        if (!teamIds || teamIds.length === 0) return 'Time';
        
        // Retorna cada nome em uma linha separada
        return teamIds
            .map(id => playerNames[id] || 'Jogador')
            .join('\n');
    };

    if (loading) {
        return (
            <Container>
                <InternalHeader title="Jogos do Jogador" />
                <LoadingContainer>
                    <ActivityIndicator size="large" color={colors.accent} />
                    <LoadingText>Carregando...</LoadingText>
                </LoadingContainer>
            </Container>
        );
    }

    const renderGameItem = ({ item }: { item: Game }) => {
        // Determinar se o jogador atual está no time 1 ou time 2
        const isPlayerInTeam1 = item.team1.includes(id as string);
        const isPlayerInTeam2 = item.team2.includes(id as string);
        
        // Determinar se o jogador ganhou ou perdeu
        const isWinner = (isPlayerInTeam1 && item.team1_score > item.team2_score) || 
                        (isPlayerInTeam2 && item.team2_score > item.team1_score);
        
        // Só mostrar o badge se o jogo estiver finalizado
        const showResultBadge = item.status === 'finished';
        
        return (
            <GameCard>
                <GameDate>
                    {format(new Date(item.created_at), "dd 'de' MMMM 'de' yyyy", { locale: pt })}
                </GameDate>
                <GameScore>
                    <TeamScore>
                        <TeamName>{formatTeamNames(item.team1)}</TeamName>
                        <Score>{item.team1_score}</Score>
                    </TeamScore>
                    <Separator>x</Separator>
                    <TeamScore>
                        <TeamName>{formatTeamNames(item.team2)}</TeamName>
                        <Score>{item.team2_score}</Score>
                    </TeamScore>
                </GameScore>
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10 }}>
                    {showResultBadge && (
                        <ResultBadge isWinner={isWinner}>
                            <ResultText>{isWinner ? 'Vitória' : 'Derrota'}</ResultText>
                        </ResultBadge>
                    )}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {item.is_buchuda && (
                        <BuchudaTag>
                            <BuchudaText>Buchuda</BuchudaText>
                        </BuchudaTag>
                    )}
                    {item.is_buchuda_de_re && (
                        <BuchudaTag>
                            <BuchudaText>Buchuda de Ré</BuchudaText>
                        </BuchudaTag>
                    )}
                </View>
            </GameCard>
        );
    };

    const renderSectionHeader = ({ section }: { section: { title: string } }) => (
        <View style={{ 
            backgroundColor: colors.backgroundDark, 
            paddingVertical: 8,
            paddingHorizontal: 16,
            marginBottom: 8,
            borderRadius: 8,
        }}>
            <Text style={{ 
                fontSize: 18, 
                fontWeight: 'bold', 
                color: colors.textPrimary 
            }}>
                {section.title}
            </Text>
        </View>
    );

    // Prepare data for SectionList
    const sections = competitionGames.map(competition => ({
        title: competition.name,
        data: competition.games
    }));

    return (
        <Container>
            <InternalHeader title={`Jogos de ${player?.name || ''}`} />
            <Content>
                <SectionList
                    sections={sections}
                    renderItem={renderGameItem}
                    renderSectionHeader={renderSectionHeader}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 12 }}
                    stickySectionHeadersEnabled={true}
                    ListEmptyComponent={() => (
                        <EmptyContainer>
                            <View style={{ alignItems: 'center', marginTop: 40 }}>
                                <MaterialCommunityIcons name="cards-outline" size={60} color={colors.textSecondary} />
                                <EmptyText style={{ marginTop: 16 }}>Nenhum jogo encontrado para este jogador</EmptyText>
                            </View>
                        </EmptyContainer>
                    )}
                />
            </Content>
        </Container>
    );
}