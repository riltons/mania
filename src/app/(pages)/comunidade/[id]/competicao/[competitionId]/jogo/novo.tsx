import React, { useEffect, useState } from 'react';
import {
    View,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import styled from 'styled-components/native';
import { Feather } from '@expo/vector-icons';
import { competitionService } from '@/services/competitionService';
import { gameService } from '@/services/gameService';
import { InternalHeader } from '@/components/InternalHeader';
import { useTheme } from '@/contexts/ThemeProvider';

interface Player {
    id: string;
    name: string;
}

interface Team {
    players: Player[];
}

export default function NewGame() {
    const router = useRouter();
    const { id: communityId, competitionId } = useLocalSearchParams();
    const { colors } = useTheme();
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<Player[]>([]);
    const [team1, setTeam1] = useState<Team>({ players: [] });
    const [team2, setTeam2] = useState<Team>({ players: [] });
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
    const [isManualSelection, setIsManualSelection] = useState(false);

    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = async () => {
        try {
            setLoading(true);
            const membersData = await competitionService.listMembers(competitionId as string);
            console.log('Dados dos membros recebidos:', membersData);
            
            // Mapeia os membros usando os dados do join
            const mappedMembers = membersData.map(m => ({
                id: m.player_id,
                name: m.players.name
            }));
            
            console.log('Membros mapeados para times:', mappedMembers);
            setMembers(mappedMembers);
        } catch (error) {
            console.error('Erro ao carregar membros:', error);
            Alert.alert('Erro', 'Não foi possível carregar os membros');
        } finally {
            setLoading(false);
        }
    };

    const shuffleArray = (array: any[]) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    const handleRandomize = () => {
        const shuffledMembers = shuffleArray(members);
        setTeam1({ players: shuffledMembers.slice(0, 2) });
        setTeam2({ players: shuffledMembers.slice(2, 4) });
        setIsManualSelection(false);
    };

    const handleTogglePlayer = (playerId: string) => {
        if (selectedPlayers.includes(playerId)) {
            setSelectedPlayers(prev => prev.filter(id => id !== playerId));
            setTeam1(prev => ({
                players: prev.players.filter(p => p.id !== playerId)
            }));
            setTeam2(prev => ({
                players: prev.players.filter(p => p.id !== playerId)
            }));
        } else {
            if (selectedPlayers.length >= 4) {
                Alert.alert('Erro', 'Já foram selecionados 4 jogadores');
                return;
            }

            const player = members.find(m => m.id === playerId);
            if (!player) return;

            setSelectedPlayers(prev => [...prev, playerId]);
            
            if (team1.players.length < 2) {
                setTeam1(prev => ({
                    players: [...prev.players, player]
                }));
            } else {
                setTeam2(prev => ({
                    players: [...prev.players, player]
                }));
            }
        }
    };

    const handleCreateGame = async () => {
        if (team1.players.length !== 2 || team2.players.length !== 2) {
            Alert.alert('Erro', 'Cada time deve ter exatamente 2 jogadores');
            return;
        }

        try {
            setLoading(true);
            const newGame = await gameService.create({
                competition_id: competitionId as string,
                team1: team1.players.map(p => p.id),
                team2: team2.players.map(p => p.id)
            });

            router.replace(`/comunidade/${communityId}/competicao/${competitionId}/jogo/${newGame.id}`);
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível criar o jogo');
        }
    };

    if (loading) {
        return (
            <LoadingContainer colors={colors}>
                <ActivityIndicator size="large" color={colors.primary} />
            </LoadingContainer>
        );
    }

    return (
        <Container colors={colors}>
            <InternalHeader title="Novo Jogo" />
            <Content>
                <ScrollView>
                    <MainContent>
                        <SelectionButtons>
                            <SelectionButton 
                                onPress={handleRandomize}
                                style={{ marginRight: 8 }}
                                colors={colors}
                            >
                                <Feather name="shuffle" size={20} color={colors.white} />
                                <SelectionButtonText colors={colors}>Sortear Times</SelectionButtonText>
                            </SelectionButton>

                            <SelectionButton 
                                onPress={() => {
                                    setIsManualSelection(true);
                                    setTeam1({ players: [] });
                                    setTeam2({ players: [] });
                                    setSelectedPlayers([]);
                                }}
                                style={{ marginLeft: 8 }}
                                colors={colors}
                            >
                                <Feather name="users" size={20} color={colors.white} />
                                <SelectionButtonText colors={colors}>Selecionar Times</SelectionButtonText>
                            </SelectionButton>
                        </SelectionButtons>

                        <TeamsContainer>
                            <TeamSection>
                                <TeamTitle colors={colors}>Time 1</TeamTitle>
                                {team1.players.map(player => (
                                    <PlayerCard key={player.id} colors={colors}>
                                        <PlayerName colors={colors}>{player.name}</PlayerName>
                                        {isManualSelection && (
                                            <TouchableOpacity onPress={() => handleTogglePlayer(player.id)}>
                                                <Feather name="x" size={20} color={colors.error} />
                                            </TouchableOpacity>
                                        )}
                                    </PlayerCard>
                                ))}
                            </TeamSection>

                            <TeamSection>
                                <TeamTitle colors={colors}>Time 2</TeamTitle>
                                {team2.players.map(player => (
                                    <PlayerCard key={player.id} colors={colors}>
                                        <PlayerName colors={colors}>{player.name}</PlayerName>
                                        {isManualSelection && (
                                            <TouchableOpacity onPress={() => handleTogglePlayer(player.id)}>
                                                <Feather name="x" size={20} color={colors.error} />
                                            </TouchableOpacity>
                                        )}
                                    </PlayerCard>
                                ))}
                            </TeamSection>
                        </TeamsContainer>

                        {isManualSelection && (
                            <>
                                <SectionTitle colors={colors}>Jogadores Disponíveis</SectionTitle>
                                <PlayersList>
                                    {members
                                        .filter(m => !selectedPlayers.includes(m.id))
                                        .map(player => (
                                            <PlayerCard key={player.id} colors={colors} onPress={() => handleTogglePlayer(player.id)}>
                                                <PlayerName colors={colors}>{player.name}</PlayerName>
                                                <Feather name="plus" size={20} color={colors.primary} />
                                            </PlayerCard>
                                        ))
                                    }
                                </PlayersList>
                            </>
                        )}

                        {(team1.players.length === 2 && team2.players.length === 2) && (
                            <ConfirmButton colors={colors} onPress={handleCreateGame}>
                                <ConfirmButtonText colors={colors}>Confirmar Times</ConfirmButtonText>
                            </ConfirmButton>
                        )}
                    </MainContent>
                </ScrollView>
            </Content>
        </Container>
    );
}

const Container = styled.View<{ colors: any }>`
    flex: 1;
    background-color: ${({ colors }) => colors.backgroundDark};
`;

const LoadingContainer = styled.View<{ colors: any }>`
    flex: 1;
    justify-content: center;
    align-items: center;
    background-color: ${({ colors }) => colors.backgroundDark};
`;

const Content = styled.View`
    flex: 1;
    padding: 16px;
`;

const MainContent = styled.View`
    flex: 1;
`;

const SelectionButtons = styled.View`
    flex-direction: row;
    justify-content: center;
    margin-bottom: 24px;
`;

const SelectionButton = styled.TouchableOpacity<{ colors: any }>`
    flex: 1;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    background-color: ${({ colors }) => colors.primary};
    padding: 16px;
    border-radius: 8px;
`;

const SelectionButtonText = styled.Text<{ colors: any }>`
    color: ${({ colors }) => colors.white};
    font-size: 16px;
    font-weight: bold;
    margin-left: 8px;
`;

const TeamsContainer = styled.View`
    flex-direction: row;
    margin-bottom: 24px;
`;

const TeamSection = styled.View`
    flex: 1;
    margin-horizontal: 8px;
`;

const TeamTitle = styled.Text<{ colors: any }>`
    font-size: 18px;
    font-weight: bold;
    color: ${({ colors }) => colors.gray100};
    margin-bottom: 16px;
    text-align: center;
`;

const PlayerCard = styled.TouchableOpacity<{ colors: any }>`
    background-color: ${({ colors }) => colors.secondary};
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 8px;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
`;

const PlayerName = styled.Text<{ colors: any }>`
    font-size: 16px;
    color: ${({ colors }) => colors.gray100};
`;

const SectionTitle = styled.Text<{ colors: any }>`
    font-size: 18px;
    font-weight: bold;
    color: ${({ colors }) => colors.gray100};
    margin-bottom: 16px;
`;

const PlayersList = styled.View`
    margin-bottom: 24px;
`;

const ConfirmButton = styled.TouchableOpacity<{ colors: any }>`
    background-color: ${({ colors }) => colors.primary};
    padding: 16px;
    border-radius: 8px;
    align-items: center;
    margin-top: 16px;
`;

const ConfirmButtonText = styled.Text<{ colors: any }>`
    color: ${({ colors }) => colors.white};
    font-size: 16px;
    font-weight: bold;
`;
