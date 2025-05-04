import React, { useEffect, useState, useCallback } from 'react';
import { Alert, Modal, TouchableOpacity, ActivityIndicator, Text, View, FlatList, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import styled from 'styled-components/native';
import { useTheme } from '@/contexts/ThemeProvider';
import { Feather } from '@expo/vector-icons';
import { competitionService } from '@/services/competitionService';
import { communityMembersService } from '@/services/communityMembersService';
import { gameService, Game } from '@/services/gameService';
import { playerService } from '@/services/playerService';
import { InternalHeader } from '@/components/InternalHeader';
import CustomModal from '@/components/CustomModal';

interface Competition {
    id: string;
    name: string;
    description: string;
    status: string;
}

interface CompetitionMember {
    id: string;
    player_id: string;
    players: {
        id: string;
        name: string;
    };
}

interface Member {
    id: string;
    player_id: string;
    players: {
        id: string;
        name: string;
    };
}

interface CompetitionResult {
    players: {
        id: string;
        name: string;
        score: number;
        wins: number;
        losses: number;
        buchudas: number;
        buchudasDeRe: number;
    }[];
    pairs: {
        players: string[];
        score: number;
        wins: number;
        losses: number;
        buchudas: number;
        buchudasDeRe: number;
    }[];
}

export default function CompetitionDetails() {
    const router = useRouter();
    const { id: communityId, competitionId } = useLocalSearchParams();
    const { colors } = useTheme();
    const [competition, setCompetition] = useState<Competition | null>(null);
    const [games, setGames] = useState<(Game & { 
        team1_players?: { id: string; name: string; }[];
        team2_players?: { id: string; name: string; }[];
    })[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [communityMembers, setCommunityMembers] = useState<Member[]>([]);
    const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [canFinish, setCanFinish] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<CompetitionResult | null>(null);
    const [expandedGames, setExpandedGames] = useState(false);
    const [isGamesModalVisible, setIsGamesModalVisible] = useState(false);
    const [expandedMembersSection, setExpandedMembersSection] = useState(false);

    const loadCompetitionAndMembers = useCallback(async () => {
        try {
            setIsLoading(true);
            const competition = await competitionService.getById(competitionId as string);
            const members = await competitionService.listMembers(competitionId as string);
            const games = await gameService.listByCompetition(competitionId as string);
            const communityMembers = await communityMembersService.listMembers(communityId as string);

            setCompetition(competition);
            setMembers(members);
            setGames(games);
            setCommunityMembers(communityMembers);

            if (competition.status === 'finished') {
                const results = await competitionService.getCompetitionResults(competitionId as string);
                setResults(results);
            }
        } catch (error) {
            console.error('Erro ao carregar competição:', error);
            Alert.alert('Erro', 'Não foi possível carregar a competição');
        } finally {
            setIsLoading(false);
        }
    }, [competitionId, communityId]);

    const loadGames = useCallback(async () => {
        try {
            const gamesData = await gameService.listByCompetition(competitionId);
            const gamesWithPlayers = await Promise.all(gamesData.map(async (game) => {
                const team1Players = await Promise.all(game.team1.map(async (playerId) => {
                    const member = members.find(m => m.player_id === playerId);
                    return member?.players || { id: playerId, name: 'Jogador não encontrado' };
                }));
                const team2Players = await Promise.all(game.team2.map(async (playerId) => {
                    const member = members.find(m => m.player_id === playerId);
                    return member?.players || { id: playerId, name: 'Jogador não encontrado' };
                }));
                return {
                    ...game,
                    team1_players: team1Players,
                    team2_players: team2Players,
                };
            }));
            setGames(gamesWithPlayers);
        } catch (error) {
            console.error('Erro ao carregar jogos:', error);
            Alert.alert('Erro', 'Não foi possível carregar os jogos');
        }
    }, [competitionId, members]);

    useEffect(() => {
        if (members.length > 0) {
            loadGames();
        }
    }, [loadGames, members]);

    const checkCanFinish = async () => {
        try {
            const canFinish = await competitionService.canFinishCompetition(competitionId as string);
            setCanFinish(canFinish);
        } catch (error) {
            console.error('Erro ao verificar status:', error);
        }
    };

    const confirmFinishCompetition = () => {
        Alert.alert(
            'Encerrar Competição',
            'Tem certeza que deseja encerrar a competição?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sim', onPress: () => handleFinishCompetition() },
            ],
            { cancelable: true }
        );
    };

    // Atualiza os dados quando a tela recebe foco (ex: ao voltar de outra tela)
    useFocusEffect(
        useCallback(() => {
            // Recarrega os dados da competição quando a tela recebe foco
            const loadData = async () => {
                await loadCompetitionAndMembers();
                checkCanFinish();
            };
            
            loadData();
            
            return () => {
                // Cleanup function (opcional)
            };
        }, [loadCompetitionAndMembers])
    );

    const handleFinishCompetition = async () => {
        try {
            setLoading(true);
            const results = await competitionService.finishCompetition(competitionId as string);
            setResults(results);
            loadCompetitionAndMembers(); // Recarrega para atualizar o status
        } catch (error) {
            console.error('Erro ao finalizar competição:', error);
            Alert.alert('Erro', 'Não foi possível finalizar a competição');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleMember = async (playerId: string) => {
        try {
            const isMember = members.some(m => m.player_id === playerId);
            
            if (isMember) {
                await competitionService.removeMember(competitionId as string, playerId);
            } else {
                await competitionService.addMember(competitionId as string, playerId);
            }
            
            // Recarrega a lista de membros após a alteração
            const updatedMembers = await competitionService.listMembers(competitionId as string);
            setMembers(updatedMembers);
        } catch (error) {
            console.error('Erro ao gerenciar membro:', error);
            Alert.alert('Erro', 'Não foi possível gerenciar o membro');
        }
    };

    const handleStartCompetition = async () => {
        try {
            setIsLoading(true);
            await competitionService.startCompetition(competitionId as string);
            await loadCompetitionAndMembers();
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível iniciar a competição');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading || !competition) {
        return (
            <LoadingContainer colors={colors}>
                <ActivityIndicator size="large" color={colors.primary} />
            </LoadingContainer>
        );
    }

    const canStartCompetition = members.length >= 4 && competition.status === 'pending';

    return (
        <Container colors={colors}>
            <InternalHeader 
                title={competition?.name || ''} 
            />
            <ContentContainer>
                <SectionHeader>
                    <SectionTitle colors={colors}>Detalhes</SectionTitle>
                    <CompetitionStatus colors={colors} status={competition?.status || 'pending'}>
                        {competition?.status === 'pending' && 'Aguardando Início'}
                        {competition?.status === 'in_progress' && 'Em Andamento'}
                        {competition?.status === 'finished' && 'Finalizado'}
                    </CompetitionStatus>
                </SectionHeader>

                {competition?.status === 'in_progress' && canFinish && (
                    <FinishButton onPress={confirmFinishCompetition} disabled={loading} colors={colors}>
                        {loading ? (
                            <ActivityIndicator color={colors.gray100} />
                        ) : (
                            <>
                                <Feather name="flag" size={24} color={colors.gray100} />
                                <FinishButtonText colors={colors}>Encerrar Competição</FinishButtonText>
                            </>
                        )}
                    </FinishButton>
                )}

                {competition?.status === 'finished' ? (
                    <GamesList
                        ListHeaderComponent={() => (
                            <View>
                                <ViewScoresButton 
                                    onPress={() => router.push(`/comunidade/${communityId}/competicao/${competitionId}/scores`)}
                                    colors={colors}
                                >
                                    <Feather name="award" size={24} color={colors.gray100} />
                                    <ViewScoresButtonText colors={colors}>Ver Classificação</ViewScoresButtonText>
                                </ViewScoresButton>

                                <Section>
                                    <SectionTitle colors={colors}>Jogos</SectionTitle>
                                </Section>
                            </View>
                        )}
                        data={games}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <GameCard 
                                key={item.id}
                                onPress={() => router.push(`/comunidade/${communityId}/competicao/${competitionId}/jogo/${item.id}`)}
                                colors={colors}
                            >
                                <GameTeams>
                                    <TeamScore colors={colors}>
                                        <Score colors={colors}>{item.team1_score}</Score>
                                        <TeamName colors={colors}>
                                            {item.team1_players?.map(player => player.name).join(' e ')}
                                        </TeamName>
                                    </TeamScore>
                                    
                                    <Versus colors={colors}>X</Versus>
                                    
                                    <TeamScore colors={colors}>
                                        <Score colors={colors}>{item.team2_score}</Score>
                                        <TeamName colors={colors}>
                                            {item.team2_players?.map(player => player.name).join(' e ')}
                                        </TeamName>
                                    </TeamScore>
                                </GameTeams>

                                <GameStatus colors={colors} status={item.status}>
                                    {item.status === 'pending' && 'Aguardando Início'}
                                    {item.status === 'in_progress' && 'Em Andamento'}
                                    {item.status === 'finished' && 'Finalizado'}
                                </GameStatus>
                            </GameCard>
                        )}
                        ListEmptyComponent={() => (
                            <EmptyContainer>
                                <EmptyText colors={colors}>Nenhum jogo registrado</EmptyText>
                            </EmptyContainer>
                        )}
                        contentContainerStyle={{ padding: 16 }}
                    />
                ) : (
                    <View style={{ flex: 1 }}>
                        <Description colors={colors}>{competition?.description}</Description>

                        <Section>
                            <SectionHeader>
                                <SectionTitle colors={colors}>Membros ({members.length})</SectionTitle>
                                <TouchableOpacity onPress={() => setExpandedMembersSection(prev => !prev)}>
                                    <Feather name={expandedMembersSection ? 'chevron-up' : 'chevron-down'} size={20} color={colors.primary} />
                                </TouchableOpacity>
                                <ManageButton onPress={() => setIsAddMemberModalVisible(true)} colors={colors}>
                                    <Feather name="users" size={20} color={colors.primary} />
                                    <ManageButtonText colors={colors}>Gerenciar</ManageButtonText>
                                </ManageButton>
                            </SectionHeader>

                            {expandedMembersSection && (
                                <MembersList
                                    data={members}
                                    renderItem={({ item }) => (
                                        <MemberItem key={item.id} colors={colors}>
                                            <MemberInfo>
                                                <MemberName colors={colors}>{item.players?.name || 'Nome não disponível'}</MemberName>
                                            </MemberInfo>
                                            <SelectButton onPress={() => handleToggleMember(item.player_id)} colors={colors}>
                                                <Feather name="trash" size={20} color={colors.error} />
                                            </SelectButton>
                                        </MemberItem>
                                    )}
                                    keyExtractor={item => item.id}
                                    contentContainerStyle={{ paddingBottom: 16 }}
                                />
                            )}
                        </Section>

                        {competition?.status === 'pending' && members.length >= 4 && (
                            <Button onPress={handleStartCompetition} colors={colors}>
                                <ButtonText colors={colors}>Iniciar Competição</ButtonText>
                            </Button>
                        )}

                        {competition?.status === 'in_progress' && (
                            <>
                                <SectionHeader>
                                    <SectionTitle colors={colors}>Jogos</SectionTitle>
                                    <TouchableOpacity onPress={() => setIsGamesModalVisible(true)}>
                                        <Feather 
                                            name="list" 
                                            size={24} 
                                            color={colors.primary} 
                                        />
                                    </TouchableOpacity>
                                </SectionHeader>

                                {games.length === 0 ? (
                                    <EmptyContainer>
                                        <EmptyText colors={colors}>Nenhum jogo registrado</EmptyText>
                                        <EmptyDescription colors={colors}>
                                            Clique no botão + para adicionar um novo jogo
                                        </EmptyDescription>
                                    </EmptyContainer>
                                ) : (
                                    <GamesList
                                        data={games}
                                        keyExtractor={(item) => item.id}
                                        renderItem={({ item }) => (
                                            <GameCard 
                                                key={item.id}
                                                onPress={() => router.push(`/comunidade/${communityId}/competicao/${competitionId}/jogo/${item.id}`)}
                                                colors={colors}
                                            >
                                                <GameTeams>
                                                    <TeamScore colors={colors}>
                                                        <Score colors={colors}>{item.team1_score}</Score>
                                                        <TeamName colors={colors}>
                                                            {item.team1_players?.map(player => player.name).join(' e ')}
                                                        </TeamName>
                                                    </TeamScore>
                                                    
                                                    <Versus colors={colors}>X</Versus>
                                                    
                                                    <TeamScore colors={colors}>
                                                        <Score colors={colors}>{item.team2_score}</Score>
                                                        <TeamName colors={colors}>
                                                            {item.team2_players?.map(player => player.name).join(' e ')}
                                                        </TeamName>
                                                    </TeamScore>
                                                </GameTeams>

                                                <GameStatus colors={colors} status={item.status}>
                                                    {item.status === 'pending' && 'Aguardando Início'}
                                                    {item.status === 'in_progress' && 'Em Andamento'}
                                                    {item.status === 'finished' && 'Finalizado'}
                                                </GameStatus>
                                            </GameCard>
                                        )}
                                        contentContainerStyle={{ padding: 16 }}
                                    />
                                )}
                            </>
                        )}
                    </View>
                )}
            </ContentContainer>

            {competition?.status === 'in_progress' && (
                <NewGameButton 
                    onPress={() => router.push(`/comunidade/${communityId}/competicao/${competitionId}/jogo/novo`)}
                    colors={colors}
                >
                    <Feather name="plus" size={24} color={colors.gray100} />
                </NewGameButton>
            )}

            <Modal
                visible={isGamesModalVisible}
                animationType="slide"
                onRequestClose={() => setIsGamesModalVisible(false)}
            >
                <ModalContainer colors={colors}>
                    <ModalHeader colors={colors}>
                        <HeaderTitle colors={colors}>Lista de Jogos</HeaderTitle>
                        <CloseButton onPress={() => setIsGamesModalVisible(false)}>
                            <Feather name="x" size={24} color={colors.gray100} />
                        </CloseButton>
                    </ModalHeader>

                    <ModalContent>
                        <GamesList
                            data={games}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <ModalGameCard 
                                    key={item.id}
                                    onPress={() => {
                                        setIsGamesModalVisible(false);
                                        router.push(`/comunidade/${communityId}/competicao/${competitionId}/jogo/${item.id}`);
                                    }}
                                    colors={colors}
                                >
                                    <GameTeams>
                                        <TeamScore colors={colors}>
                                            <Score colors={colors}>{item.team1_score}</Score>
                                            <TeamName colors={colors}>
                                                {item.team1_players?.map(player => player.name).join(' e ')}
                                            </TeamName>
                                        </TeamScore>
                                        
                                        <Versus colors={colors}>X</Versus>
                                        
                                        <TeamScore colors={colors}>
                                            <Score colors={colors}>{item.team2_score}</Score>
                                            <TeamName colors={colors}>
                                                {item.team2_players?.map(player => player.name).join(' e ')}
                                            </TeamName>
                                        </TeamScore>
                                    </GameTeams>

                                    <GameStatus colors={colors} status={item.status}>
                                        {item.status === 'pending' && 'Aguardando Início'}
                                        {item.status === 'in_progress' && 'Em Andamento'}
                                        {item.status === 'finished' && 'Finalizado'}
                                    </GameStatus>
                                </ModalGameCard>
                            )}
                            contentContainerStyle={{ padding: 16 }}
                        />
                    </ModalContent>
                </ModalContainer>
            </Modal>

            <CustomModal
                visible={isAddMemberModalVisible}
                onClose={() => setIsAddMemberModalVisible(false)}
                title="Adicionar Membros"
                subtitle="Selecione os jogadores que deseja adicionar à competição."
                colors={colors}
            >
                <MembersList
                    data={communityMembers.filter(cm => !members.some(m => m.player_id === cm.player_id))}
                    renderItem={({ item }) => (
                        <MemberItem key={item.id} colors={colors}>
                            <MemberInfo>
                                <MemberName colors={colors}>{item.players.name}</MemberName>
                            </MemberInfo>
                            <SelectButton onPress={() => handleToggleMember(item.player_id)} colors={colors}>
                                <Feather name="circle" size={24} color={colors.primary} />
                            </SelectButton>
                        </MemberItem>
                    )}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 16 }}
                />
            </CustomModal>
        </Container>
    );
}

const Container = styled.View`
    flex: 1;
    background-color: ${props => props.colors.backgroundDark};
`;

const LoadingContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    background-color: ${props => props.colors.backgroundDark};
`;

const ContentContainer = styled.View`
    flex: 1;
    padding: 24px;
`;

const SectionHeader = styled.View`
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
`;

const SectionTitle = styled.Text`
    font-size: 20px;
    font-weight: bold;
    color: ${props => props.colors.gray100};
`;

const Description = styled.Text`
    font-size: 16px;
    color: ${props => props.colors.gray100};
    margin-bottom: 16px;
`;

const CompetitionStatus = styled.Text<{ status: 'pending' | 'in_progress' | 'finished' }>`
    color: ${props => {
        switch (props.status) {
            case 'pending':
                return props.colors.gray300;
            case 'in_progress':
                return props.colors.primary;
            case 'finished':
                return props.colors.success;
            default:
                return props.colors.gray300;
        }
    }};
    font-size: 14px;
    font-weight: 500;
`;

const Button = styled.TouchableOpacity`
    background-color: ${props => props.colors.primary};
    padding: 16px;
    border-radius: 8px;
    align-items: center;
    justify-content: center;
    margin-top: 16px;
`;

const ButtonText = styled.Text`
    color: ${props => props.colors.white};
    font-size: 16px;
    font-weight: bold;
`;

const Section = styled.View`
    margin-top: 8px;
`;

const MembersScrollView = styled.ScrollView`
    max-height: 300px;
    margin-top: 16px;
`;

const MembersList = styled.FlatList.attrs(() => ({
    contentContainerStyle: {
        paddingBottom: 16
    }
}))`
    margin-top: 16px;
`;

const MemberItem = styled.View`
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background-color: ${props => props.colors.surface};
    border-radius: 8px;
    margin-bottom: 8px;
`;

const MemberInfo = styled.View`
    flex: 1;
`;

const MemberName = styled.Text`
    color: ${props => props.colors.gray100};
    font-size: 16px;
`;

const ModalContainer = styled.View`
    flex: 1;
    background-color: ${props => props.colors.backgroundDark};
`;

const ModalHeader = styled.View`
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    background-color: ${props => props.colors.backgroundMedium};
`;

const ModalContent = styled.View`
    flex: 1;
`;

const ModalGameCard = styled(TouchableOpacity)`
    background-color: ${props => props.colors.backgroundMedium};
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
`;

const ManageButton = styled.TouchableOpacity`
    flex-direction: row;
    align-items: center;
    background-color: ${props => props.colors.primary};
    padding: 8px 16px;
    border-radius: 8px;
`;

const ManageButtonText = styled.Text`
    color: ${props => props.colors.gray100};
    font-size: 14px;
    font-weight: 500;
    margin-right: 8px;
`;

const EmptyContainer = styled.View`
    padding: 24px;
    align-items: center;
    justify-content: center;
`;

const EmptyText = styled.Text`
    color: ${props => props.colors.gray300};
    font-size: 16px;
    margin-bottom: 8px;
`;

const EmptyDescription = styled.Text`
    color: ${props => props.colors.gray300};
    font-size: 14px;
    text-align: center;
`;

const GamesList = styled.FlatList`
    margin-top: 16px;
`;

const GameCard = styled.TouchableOpacity`
    background-color: ${props => props.colors.surface};
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 8px;
`;

const GameTeams = styled.View`
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
`;

const TeamScore = styled.View<{ winner?: boolean }>`
    align-items: center;
    flex: 1;
    background-color: ${props => props.winner ? props.colors.primary + '20' : 'transparent'};
    padding: 8px;
    border-radius: 8px;
`;

const Score = styled.Text`
    color: ${props => props.colors.gray100};
    font-size: 32px;
    font-weight: bold;
`;

const TeamName = styled.Text`
    color: ${props => props.colors.gray300};
    font-size: 14px;
    margin-top: 4px;
`;

const Versus = styled.Text`
    color: ${props => props.colors.gray300};
    font-size: 20px;
    margin-horizontal: 16px;
`;

const GameStatus = styled.Text<{ status: 'pending' | 'in_progress' | 'finished' }>`
    color: ${props => {
        switch (props.status) {
            case 'pending':
                return props.colors.gray300;
            case 'in_progress':
                return props.colors.primary;
            case 'finished':
                return props.colors.success;
            default:
                return props.colors.gray300;
        }
    }};
    font-size: 14px;
    text-align: center;
    margin-top: 8px;
`;

const FinishButton = styled.TouchableOpacity<{ disabled?: boolean }>`
    background-color: ${props => props.colors.error};
    padding: 16px;
    border-radius: 8px;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    margin-top: 8px;
    margin-bottom: 8px;
    opacity: ${props => props.disabled ? 0.7 : 1};
`;

const FinishButtonText = styled.Text`
    color: ${props => props.colors.gray100};
    font-size: 16px;
    font-weight: bold;
    margin-left: 8px;
`;

const ViewScoresButton = styled.TouchableOpacity`
    background-color: ${props => props.colors.primary};
    padding: 16px;
    border-radius: 8px;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    margin-top: 8px;
    margin-bottom: 16px;
`;

const ViewScoresButtonText = styled.Text`
    color: ${props => props.colors.gray100};
    font-size: 16px;
    font-weight: bold;
    margin-left: 8px;
`;

const SelectButton = styled.TouchableOpacity`
    padding: 8px;
`;

const CloseButton = styled.TouchableOpacity`
    padding: 8px;
`;

const NewGameButton = styled.TouchableOpacity`
    position: absolute;
    bottom: 32px;
    right: 32px;
    width: 56px;
    height: 56px;
    border-radius: 28px;
    background-color: ${props => props.colors.primary};
    align-items: center;
    justify-content: center;
    elevation: 8;
    z-index: 999;
`;

const HeaderTitle = styled.Text`
    font-size: 20px;
    font-weight: bold;
    color: ${props => props.colors.gray100};
    flex: 1;
`;
