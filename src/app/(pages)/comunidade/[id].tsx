import React, { useCallback, useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, Text, View, TouchableOpacity, Animated } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import CustomModal from '../../../components/CustomModal';
import styled from 'styled-components/native';
import { useAuth } from '@/hooks/useAuth';
import { communityService } from '@/services/communityService';
import { communityMembersService } from '@/services/communityMembersService';
import { communityOrganizersService } from '@/services/communityOrganizersService';
import { playerService } from '@/services/playerService';
import { competitionService } from '@/services/competitionService';
import { InternalHeader } from '@/components/InternalHeader';

type CommunityOrganizer = {
    id: string;
    community_id: string;
    user_id: string;
    user_profile?: {
        id: string;
        name: string;
        email: string;
    };
    is_creator?: boolean;
};

type Community = {
    id: string;
    name: string;
    description: string;
    created_at: string;
    created_by: string;
};

type Member = {
    id: string;
    player_id: string;
    community_id: string;
    players: {
        id: string;
        name: string;
    };
};

type Player = {
    id: string;
    name: string;
};

type Competition = {
    id: string;
    name: string;
    description: string;
    start_date: string;
    created_at: string;
};

const Container = styled.View`
    flex: 1;
    background-color: ${props => props.colors.backgroundDark};
    padding: 0;
`;

const MainContent = styled.View`
    flex: 1;
    padding: 8px;
`;

const ScrollContainer = styled.ScrollView`
    flex: 1;
    background-color: ${props => props.colors.background};
`;

const ContentContainer = styled.View`
    padding: 24px;
    background-color: ${props => props.colors.background};
`;

const Section = styled.View`
    background-color: ${props => props.colors.gray800};
    border-radius: 8px;
    padding: 12px;
    margin: 8px 0;
`;

const SectionHeader = styled.View`
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
`;

const HeaderLeft = styled.View`
    flex-direction: row;
    align-items: center;
    gap: 8px;
`;

const HeaderRight = styled.View`
    flex-direction: row;
    align-items: center;
    gap: 8px;
    z-index: 10;
`;

const SectionTitle = styled.Text<{ colors: any }>`
    color: ${props => props.colors.text};
    font-size: 16px;
    font-weight: bold;
`;

const ExpandButton = styled.TouchableOpacity`
    padding: 8px;
`;

const ManageButton = styled.TouchableOpacity<{ colors: any }>`
    flex-direction: row;
    align-items: center;
    justify-content: center;
    background-color: ${({ colors }) => colors.primary};
    padding: 12px;
    border-radius: 8px;
    margin-top: 8px;
`;

const ManageButtonText = styled.Text<{ colors: any }>`
    color: ${({ colors }) => colors.white};
    font-size: 14px;
    font-weight: bold;
    margin-left: 8px;
`;

const MemberCard = styled.View`
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background-color: ${props => props.colors.gray700};
    border-radius: 8px;
    margin-top: 8px;
`;

const MemberInfo = styled.View`
    flex: 1;
`;

const MemberName = styled.Text<{ colors: any }>`
    font-size: 16px;
    font-weight: bold;
    color: ${props => props.colors.gray100};
`;

const SelectAllHeader = styled.View`
    margin-bottom: 16px;
`;

const SelectAllButton = styled.TouchableOpacity`
    flex-direction: row;
    align-items: center;
`;

const SelectAllText = styled.Text`
    color: ${props => props.colors.gray100};
    font-size: 14px;
    margin-left: 8px;
`;

const RemoveButton = styled.TouchableOpacity`
    padding: 8px;
    background-color: ${props => props.colors.red500};
    border-radius: 4px;
    margin-top: 16px;
`;

const RemoveButtonText = styled.Text`
    color: ${props => props.colors.white};
    font-size: 14px;
`;

const OrganizerCard = styled.View`
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background-color: ${props => props.colors.gray700};
    border-radius: 8px;
    margin-top: 8px;
`;

const OrganizerInfo = styled.View`
    flex: 1;
`;

const OrganizerName = styled.Text`
    font-size: 16px;
    font-weight: bold;
    color: ${props => props.colors.gray100};
`;

const OrganizerEmail = styled.Text`
    font-size: 14px;
    color: ${props => props.colors.gray300};
    margin-top: 4px;
`;

const RemoveOrganizerButton = styled.TouchableOpacity`
    padding: 8px;
    background-color: ${props => props.colors.red500};
    border-radius: 4px;
    margin-left: auto;
`;

const ModalContainer = styled.View`
    flex: 1;
    background-color: rgba(0, 0, 0, 0.5);
    padding: 24px;
    justify-content: center;
`;

const ModalContent = styled.View`
    background-color: ${props => props.colors.gray800};
    padding: 24px;
    border-radius: 8px;
    elevation: 5;
    shadow-color: #000;
    shadow-offset: 0px 2px;
    shadow-opacity: 0.25;
    shadow-radius: 3.84px;
`;

const ModalHeader = styled.View`
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
`;

const ModalTitle = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: ${props => props.colors.gray100};
`;

const ModalSubtitle = styled.Text`
    font-size: 14px;
    color: ${props => props.colors.gray300};
    margin-bottom: 16px;
`;

const ModalInput = styled.TextInput`
    width: 100%;
    height: 48px;
    background-color: ${props => props.colors.gray800};
    border-radius: 8px;
    padding: 0 16px;
    color: ${props => props.colors.gray100};
    margin-bottom: 16px;
`;

const ModalButtonsContainer = styled.View`
    flex-direction: row;
    justify-content: space-between;
    margin-top: 16px;
`;

const ModalCancelButton = styled.TouchableOpacity`
    padding: 8px;
    background-color: ${props => props.colors.gray600};
    border-radius: 4px;
    align-items: center;
    opacity: 0.7;
`;

const ModalButtonText = styled.Text<{ variant?: 'secondary' }>`
    color: ${props => props.variant === 'secondary' ? props.colors.gray100 : props.colors.white};
    font-size: 14px;
`;

const SaveButton = styled.TouchableOpacity<{ disabled?: boolean }>`
    padding: 8px;
    background-color: ${props => props.disabled ? props.colors.gray600 : props.colors.primary};
    border-radius: 4px;
    align-items: center;
    opacity: ${props => props.disabled ? 0.7 : 1};
`;

const SaveButtonText = styled.Text`
    color: ${props => props.colors.white};
    font-size: 14px;
`;

const FAB = styled.TouchableOpacity`
    position: absolute;
    bottom: 24px;
    right: 24px;
    padding: 16px;
    background-color: ${props => props.colors.primary};
    border-radius: 50px;
`;

const LoadingContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
`;

const EmptyContainer = styled.View`
    padding: 16px;
    align-items: center;
`;

const EmptyText = styled.Text`
    font-size: 14px;
    color: ${props => props.colors.gray300};
`;

const PlayerCard = styled.View<{ colors: any }>`
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background-color: ${({ colors }) => colors.gray700};
    border-radius: 8px;
    margin-bottom: 8px;
`;

const PlayerInfo = styled.View`
    flex: 1;
`;

const PlayerName = styled.Text<{ colors: any }>`
    color: ${({ colors }) => colors.text};
    font-size: 16px;
    font-weight: bold;
`;

const PlayersList = styled.FlatList`
    width: 100%;
`;

const CompetitionCard = styled.TouchableOpacity<{ colors: any }>`
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background-color: ${props => props.colors.gray800};
    border-radius: 8px;
    margin-bottom: 8px;
    border: 1px solid ${props => props.colors.gray600};
`;

const CompetitionInfo = styled.View`
    flex: 1;
`;

const CompetitionName = styled.Text`
    color: ${props => props.colors.gray100};
    font-size: 16px;
    font-weight: bold;
`;

const CompetitionDescription = styled.Text`
    color: ${props => props.colors.gray300};
    font-size: 14px;
    margin-top: 4px;
`;

const CompetitionDetails = styled.View`
    flex-direction: row;
    align-items: center;
    margin-top: 8px;
`;

const CompetitionDate = styled.View`
    flex-direction: row;
    align-items: center;
    margin-right: 16px;
`;

const CompetitionDateText = styled.Text`
    color: ${props => props.colors.gray300};
    font-size: 14px;
    margin-left: 4px;
`;

const CompetitionStatus = styled.View`
    flex-direction: row;
    align-items: center;
`;

const StatusBadge = styled.View`
    padding: 4px 8px;
    background-color: ${props => props.status === 'pending' ? props.colors.warning : props.status === 'in_progress' ? props.colors.primary : props.colors.success};
    border-radius: 4px;
    margin-left: 8px;
`;

const StatusText = styled.Text`
    color: ${props => props.colors.white};
    font-size: 12px;
`;

const Description = styled.Text<{ colors: any }>`
    color: ${props => props.colors.gray300};
    font-size: 14px;
    line-height: 20px;
`;

const ShowMoreContainer = styled.TouchableOpacity`
    flex-direction: row;
    align-items: center;
    margin-top: 8px;
`;

const ShowMoreText = styled.Text`
    color: ${props => props.colors.primary};
    font-size: 14px;
    margin-left: 4px;
`;

const StatsButton = styled.TouchableOpacity<{ pressed?: boolean; colors: any }>`
    flex-direction: row;
    align-items: center;
    justify-content: center;
    background-color: ${({ colors }) => colors.primary};
    padding: 12px 16px;
    border-radius: 8px;
    margin: 8px 16px;
`;

const StatsButtonText = styled.Text<{ colors: any }>`
    color: ${({ colors }) => colors.white};
    font-size: 16px;
    font-weight: bold;
    margin-left: 8px;
`;

const EmptyStateContainer = styled.View`
    padding: 16px;
    align-items: center;
`;

const EmptyStateText = styled.Text`
    font-size: 14px;
    color: ${props => props.colors.gray300};
`;

const PlayerItem = styled.TouchableOpacity<{ selected: boolean; colors: any }>`
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background-color: ${({ selected, colors }) => selected ? colors.primary : colors.gray700};
    border-radius: 8px;
    margin-bottom: 8px;
`;

const BottomSheetContent = styled.View`
    padding: 16px;
    background-color: ${props => props.colors.backgroundDark};
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
`;

const BottomSheetHandle = styled.View`
    width: 40px;
    height: 5px;
    border-radius: 3px;
    background-color: ${props => props.colors.gray500};
    align-self: center;
    margin-top: 8px;
    margin-bottom: 16px;
`;

export default function CommunityDetails() {
    const { colors } = useTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    const [community, setCommunity] = useState<Community | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [organizers, setOrganizers] = useState<CommunityOrganizer[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [loading, setLoading] = useState(true);
    const [showMembers, setShowMembers] = useState(false);
    const [showOrganizers, setShowOrganizers] = useState(false);
    const [showAddOrganizerModal, setShowAddOrganizerModal] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [newOrganizerEmail, setNewOrganizerEmail] = useState('');
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [isOrganizer, setIsOrganizer] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const rotateAnimMembers = useRef(new Animated.Value(0)).current;
    const rotateAnimOrganizers = useRef(new Animated.Value(0)).current;

    const rotateMembers = rotateAnimMembers.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg']
    });

    const rotateOrganizers = rotateAnimOrganizers.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg']
    });

    const toggleMembers = useCallback(() => {
        setShowMembers(prev => !prev);
        Animated.timing(rotateAnimMembers, {
            toValue: showMembers ? 0 : 1,
            duration: 300,
            useNativeDriver: true
        }).start();
    }, [showMembers]);

    const toggleOrganizers = useCallback(() => {
        setShowOrganizers(prev => !prev);
        Animated.timing(rotateAnimOrganizers, {
            toValue: showOrganizers ? 0 : 1,
            duration: 300,
            useNativeDriver: true
        }).start();
    }, [showOrganizers]);

    const openAddOrganizerSheet = useCallback(() => {
        console.log('Abrindo modal de organizadores');
        setShowAddOrganizerModal(true);
    }, []);

    const closeAddOrganizerSheet = useCallback(() => {
        console.log('Fechando modal de organizadores');
        setShowAddOrganizerModal(false);
    }, []);

    const openAddMemberSheet = useCallback(() => {
        console.log('Abrindo modal de membros');
        setShowAddMemberModal(true);
    }, []);

    const closeAddMemberSheet = useCallback(() => {
        console.log('Fechando modal de membros');
        setShowAddMemberModal(false);
    }, []);

    const handleAddOrganizer = async () => {
        if (!newOrganizerEmail || !user?.id) {
            return;
        }

        try {
            setLoading(true);
            await communityOrganizersService.addOrganizer(id, newOrganizerEmail, user.id);
            setNewOrganizerEmail('');
            closeAddOrganizerSheet();
            await loadData();
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível adicionar o organizador');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveOrganizer = async (userId: string) => {
        try {
            await communityOrganizersService.removeOrganizer(id, userId);
            const updatedOrganizers = await communityOrganizersService.listOrganizers(id);
            setOrganizers(updatedOrganizers);
            Alert.alert('Sucesso', 'Organizador removido com sucesso!');
        } catch (error) {
            console.error('Erro ao remover organizador:', error);
            Alert.alert('Erro', 'Não foi possível remover o organizador');
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            setRefreshing(true);
            console.log('Buscando comunidade...');
            const communityData = await communityService.getById(id);
            if (!communityData) throw new Error('Comunidade não encontrada');
            console.log('Comunidade encontrada:', communityData);
            setCommunity(communityData);

            console.log('Buscando membros...');
            const membersData = await communityMembersService.listMembers(id);
            console.log('Membros encontrados:', membersData);
            setMembers(membersData);

            console.log('Buscando organizadores...');
            const organizersData = await communityOrganizersService.listOrganizers(id);
            console.log('Organizadores encontrados:', organizersData);
            setOrganizers(organizersData);

            const { myPlayers, communityPlayers } = await playerService.list(false); // Especificando false para não buscar estatísticas
            console.log('Jogadores encontrados:', { myPlayers, communityPlayers });

            console.log('Buscando competições...');
            const competitionsData = await competitionService.listByCommunity(id);
            console.log('Competições encontradas:', competitionsData);
            // Ordena da mais nova para a mais antiga pelo created_at
            const sortedCompetitions = competitionsData.sort((a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setCompetitions(sortedCompetitions);
            setPlayers([...myPlayers, ...communityPlayers]);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            Alert.alert('Erro', 'Não foi possível carregar os dados da comunidade');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const loadOrganizers = async () => {
            try {
                const data = await communityOrganizersService.listOrganizers(id);
                setOrganizers(data);
            } catch (error) {
                console.error('Erro ao carregar organizadores:', error);
            }
        };

        loadOrganizers();
    }, [id]);

    useEffect(() => {
        console.log('Verificando se o usuário está logado:', {
            sessionExists: !!user,
            userId: user?.id
        });
        
        if (user?.id && community) {
            console.log('Verificação de criador:', {
                userId: user?.id,
                createdBy: community.created_by,
                isCriador: community.created_by === user?.id
            });
        }
    }, [community, user?.id]);

    useEffect(() => {
        if (user?.id && organizers.length > 0) {
            const userIsOrganizer = organizers.some(org => org.user_id === user?.id);
            setIsOrganizer(userIsOrganizer);
            console.log('Verificação de organizador:', {
                userId: user?.id,
                organizadores: organizers.map(org => org.user_id),
                isOrganizer: userIsOrganizer
            });
        }
    }, [organizers, user?.id]);

    useEffect(() => {
        console.log('=== INFORMAÇÕES DE DEBUG ===');
        console.log('Sessão:', user?.id);
        console.log('Comunidade:', community?.id, community?.name);
        console.log('Criador da comunidade:', community?.created_by);
        console.log('Usuário é criador:', community?.created_by === user?.id);
        console.log('Usuário é organizador:', isOrganizer);
        console.log('Membros:', members.length);
        console.log('Organizadores:', organizers.length);
        console.log('==========================');
    }, [community, user, isOrganizer, members.length, organizers.length]);

    useFocusEffect(
        useCallback(() => {
            console.log('Carregando dados da comunidade...');
            loadData();
        }, [])
    );

    const handleToggleMember = async (playerId: string, isCurrentMember: boolean) => {
        if (!community) return;
        
        try {
            setLoading(true);
            if (isCurrentMember) {
                await communityMembersService.removeMember(community.id, playerId);
            } else {
                await communityMembersService.addMember(community.id, playerId);
            }
            await loadData();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPlayer = (playerId: string) => {
        setSelectedPlayers(prev => {
            if (prev.includes(playerId)) {
                return prev.filter(id => id !== playerId);
            }
            return [...prev, playerId];
        });
    };

    const handleSelectAll = () => {
        const availablePlayers = players.filter(player => 
            !members.some(member => member.player_id === player.id)
        );
        
        if (selectedPlayers.length === availablePlayers.length) {
            setSelectedPlayers([]);
        } else {
            setSelectedPlayers(availablePlayers.map(player => player.id));
        }
    };

    const handleAddMembers = async () => {
        if (selectedPlayers.length === 0) {
            return;
        }

        try {
            setLoading(true);
            await communityMembersService.addMembers(id, selectedPlayers);
            setSelectedPlayers([]);
            closeAddMemberSheet();
            await loadData();
            Alert.alert('Sucesso', 'Membros adicionados com sucesso!');
        } catch (error) {
            console.error('Erro ao adicionar membros:', error);
            Alert.alert('Erro', 'Não foi possível adicionar os membros');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectMember = (memberId: string) => {
        setSelectedMembers(prev => {
            if (prev.includes(memberId)) {
                return prev.filter(id => id !== memberId);
            }
            return [...prev, memberId];
        });
    };

    const handleSelectAllMembers = () => {
        if (selectedMembers.length === members.length) {
            setSelectedMembers([]);
        } else {
            setSelectedMembers(members.map(member => member.player_id));
        }
    };

    const handleRemoveMembers = async () => {
        if (!community || selectedMembers.length === 0) return;

        try {
            setLoading(true);
            for (const memberId of selectedMembers) {
                await communityMembersService.removeMember(community.id, memberId);
            }
            setSelectedMembers([]);
            await loadData();
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível remover os membros');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        try {
            await communityMembersService.removeMember(id, memberId);
            const updatedMembers = await communityMembersService.listMembers(id);
            setMembers(updatedMembers);
            Alert.alert('Sucesso', 'Membro removido com sucesso!');
        } catch (error) {
            console.error('Erro ao remover membro:', error);
            Alert.alert('Erro', 'Não foi possível remover o membro');
        }
    };

    const renderMembers = () => (
        <>
            {selectedMembers.length > 0 && (
                <SelectAllHeader>
                    <SelectAllButton onPress={handleSelectAllMembers}>
                        <Feather 
                            name={selectedMembers.length === members.length ? "check-square" : "square"} 
                            size={24} 
                            color={colors.primary} 
                        />
                        <SelectAllText colors={colors}>Selecionar Todos</SelectAllText>
                    </SelectAllButton>
                </SelectAllHeader>
            )}
            {members.map(member => (
                <MemberCard key={member.id} colors={colors}>
                    <MemberInfo>
                        <MemberName colors={colors}>{member.players.name}</MemberName>
                    </MemberInfo>
                    <TouchableOpacity onPress={() => handleSelectMember(member.player_id)}>
                        <Feather 
                            name={selectedMembers.includes(member.player_id) ? "check-square" : "square"} 
                            size={24} 
                            color={selectedMembers.includes(member.player_id) ? colors.primary : colors.gray300} 
                        />
                    </TouchableOpacity>
                    {(community?.created_by === user?.id || isOrganizer) && (
                        <TouchableOpacity onPress={() => handleRemoveMember(member.player_id)}>
                            <Feather name="x" size={24} color={colors.error} />
                        </TouchableOpacity>
                    )}
                </MemberCard>
            ))}
            {selectedMembers.length > 0 && (
                <RemoveButton 
                    onPress={handleRemoveMembers}
                    disabled={loading}
                    colors={colors}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.white} />
                    ) : (
                        <RemoveButtonText colors={colors}>
                            Remover {selectedMembers.length} {selectedMembers.length === 1 ? 'membro' : 'membros'}
                        </RemoveButtonText>
                    )}
                </RemoveButton>
            )}
        </>
    );

    const renderOrganizers = () => (
        <>
            {organizers.map((organizer) => (
                <PlayerCard key={organizer.id} colors={colors}>
                    <PlayerInfo>
                        <PlayerName colors={colors}>
                            {organizer.user_profile?.name || organizer.user_profile?.email}
                            {organizer.is_creator ? " (Criador)" : ""}
                        </PlayerName>
                        <OrganizerEmail colors={colors}>{organizer.user_profile?.email}</OrganizerEmail>
                    </PlayerInfo>
                    {!organizer.is_creator && community?.created_by === user?.id && (
                        <TouchableOpacity onPress={() => handleRemoveOrganizer(organizer.user_id)}>
                            <Feather name="x" size={24} color={colors.error} />
                        </TouchableOpacity>
                    )}
                </PlayerCard>
            ))}
        </>
    );

    const renderContent = () => {
        if (loading) {
            return (
                <LoadingContainer>
                    <ActivityIndicator size="large" color={colors.primary} />
                </LoadingContainer>
            );
        }

        if (!community) {
            return (
                <EmptyContainer>
                    <EmptyText colors={colors}>Comunidade não encontrada</EmptyText>
                </EmptyContainer>
            );
        }

        console.log('Renderizando conteúdo da comunidade:', {
            id: community.id,
            name: community.name,
            createdBy: community.created_by,
            currentUserId: user?.id,
            isCreator: community.created_by === user?.id,
            isOrganizer,
            membersCount: members.length,
            organizersCount: organizers.length
        });

        return (
            <>
                <Section colors={colors}>
                    <TouchableOpacity 
                        onPress={() => router.push(`/comunidade/${id}/estatisticas`)}
                    >
                        <HeaderLeft>
                            <Feather name="bar-chart-2" size={24} color={colors.text} />
                            <SectionTitle colors={colors}>Estatísticas</SectionTitle>
                        </HeaderLeft>
                    </TouchableOpacity>
                </Section>

                {community.description && (
                    <Section colors={colors}>
                        <Description colors={colors}>{community.description}</Description>
                        {community.description.length > 100 && (
                            <ShowMoreContainer onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
                                <Animated.View style={{ transform: [{ rotate: '0deg' }] }}>
                                    <Feather 
                                        name={isDescriptionExpanded ? "chevron-up" : "chevron-down"} 
                                        size={24} 
                                        color={colors.text} 
                                    />
                                </Animated.View>
                                <ShowMoreText colors={colors}>
                                    {isDescriptionExpanded ? 'Ver menos' : 'Ver mais'}
                                </ShowMoreText>
                            </ShowMoreContainer>
                        )}
                    </Section>
                )}

                <Section colors={colors}>
                    <SectionHeader>
                        <HeaderLeft>
                            <SectionTitle colors={colors}>Membros ({members.length})</SectionTitle>
                        </HeaderLeft>
                        <HeaderRight>
                            {isOrganizer && (
                                <View style={{ flexDirection: 'row', marginLeft: 'auto' }}>
                                    <TouchableOpacity 
                                        onPress={openAddMemberSheet}
                                        style={{ marginRight: 8 }}
                                    >
                                        <Feather name="user-plus" size={20} color={colors.primary} />
                                    </TouchableOpacity>
                                </View>
                            )}
                            <TouchableOpacity onPress={toggleMembers}>
                                <Animated.View style={{ transform: [{ rotate: rotateMembers }] }}>
                                    <Feather name="chevron-down" size={24} color={colors.text} />
                                </Animated.View>
                            </TouchableOpacity>
                        </HeaderRight>
                    </SectionHeader>
                    {showMembers && renderMembers()}
                </Section>

                <Section colors={colors}>
                    <SectionHeader>
                        <HeaderLeft>
                            <SectionTitle colors={colors}>Organizadores ({organizers.length})</SectionTitle>
                        </HeaderLeft>
                        <HeaderRight>
                            {isOrganizer && (
                                <TouchableOpacity 
                                    onPress={openAddOrganizerSheet}
                                    style={{ marginRight: 8 }}
                                >
                                    <Feather name="user-plus" size={20} color={colors.primary} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={toggleOrganizers}>
                                <Animated.View style={{ transform: [{ rotate: rotateOrganizers }] }}>
                                    <Feather name="chevron-down" size={24} color={colors.text} />
                                </Animated.View>
                            </TouchableOpacity>
                        </HeaderRight>
                    </SectionHeader>
                    {showOrganizers && renderOrganizers()}
                </Section>

                {(competitions.length > 0 || (community?.created_by === user?.id || isOrganizer)) && (
                    <Section colors={colors}>
                        <SectionHeader>
                            <HeaderLeft>
                                <SectionTitle colors={colors}>Competições</SectionTitle>
                            </HeaderLeft>
                            <HeaderRight>
                                <TouchableOpacity 
                                    onPress={() => {
                                        console.log('Tentando criar nova competição');
                                        router.push(`/comunidade/${id}/competicao/nova`);
                                    }}
                                    style={{ marginRight: 8 }}
                                >
                                    <Feather name="plus-circle" size={24} color={colors.primary} />
                                </TouchableOpacity>
                            </HeaderRight>
                        </SectionHeader>

                        {competitions.length > 0 ? (
                            competitions.map(competition => (
                                <CompetitionCard 
                                    key={competition.id} 
                                    onPress={() => router.push(`/comunidade/${id}/competicao/${competition.id}`)}
                                    colors={colors}
                                >
                                    <CompetitionInfo>
                                        <CompetitionName colors={colors}>{competition.name}</CompetitionName>
                                        <CompetitionDescription colors={colors}>{competition.description}</CompetitionDescription>
                                        <CompetitionDetails>
                                            <CompetitionDate>
                                                <Feather name="calendar" size={14} color={colors.gray300} />
                                                <CompetitionDateText colors={colors}>
                                                    {new Date(competition.start_date).toLocaleDateString()}
                                                </CompetitionDateText>
                                            </CompetitionDate>
                                        </CompetitionDetails>
                                    </CompetitionInfo>
                                    <Feather name="chevron-right" size={16} color={colors.text} />
                                </CompetitionCard>
                            ))
                        ) : (
                            <EmptyStateContainer>
                                <EmptyStateText colors={colors}>
                                    Nenhuma competição criada ainda. Clique no ícone "+" para criar uma nova competição.
                                </EmptyStateText>
                            </EmptyStateContainer>
                        )}
                    </Section>
                )}
            </>
        );
    };

    const addOrganizerRef = useRef(null);
    const addMemberRef = useRef(null);

    return (
        <Container colors={colors}>
            <InternalHeader 
                title={community?.name || 'Carregando...'}
                onBack={() => router.back()}
            />
            <MainContent>
                <ScrollView>
                    {renderContent()}
                </ScrollView>
            </MainContent>

            <CustomModal
                visible={showAddOrganizerModal}
                onClose={closeAddOrganizerSheet}
                title="Adicionar Organizador"
                subtitle="Digite o email de um usuário já cadastrado no sistema."
                colors={colors}
            >
                <ModalInput
                    value={newOrganizerEmail}
                    onChangeText={setNewOrganizerEmail}
                    placeholder="Email do organizador"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    colors={colors}
                />
                <ModalButtonsContainer>
                    <ModalCancelButton 
                        onPress={() => {
                            closeAddOrganizerSheet();
                            setNewOrganizerEmail('');
                        }}
                        colors={colors}
                    >
                        <ModalButtonText colors={colors} variant="secondary">
                            Cancelar
                        </ModalButtonText>
                    </ModalCancelButton>
                    <SaveButton 
                        onPress={handleAddOrganizer}
                        disabled={newOrganizerEmail === '' || loading}
                        colors={colors}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <SaveButtonText colors={colors}>
                                Adicionar
                            </SaveButtonText>
                        )}
                    </SaveButton>
                </ModalButtonsContainer>
            </CustomModal>

            <CustomModal
                visible={showAddMemberModal}
                onClose={closeAddMemberSheet}
                title="Adicionar Membros"
                subtitle="Selecione os jogadores que deseja adicionar à comunidade."
                colors={colors}
            >
                <ModalInput
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    placeholder="Buscar jogadores..."
                    colors={colors}
                />
                <FlatList
                    data={players.filter(player => 
                        player.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                        !members.some(member => member.player_id === player.id)
                    )}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <PlayerItem
                            onPress={() => handleSelectPlayer(item.id)}
                            selected={selectedPlayers.includes(item.id)}
                            colors={colors}
                        >
                            <PlayerName colors={colors}>{item.name}</PlayerName>
                            <Feather
                                name={selectedPlayers.includes(item.id) ? "check-square" : "square"}
                                size={20}
                                color={selectedPlayers.includes(item.id) ? colors.primary : colors.gray400}
                            />
                        </PlayerItem>
                    )}
                    ListEmptyComponent={
                        <EmptyStateContainer>
                            <EmptyStateText colors={colors}>
                                {searchTerm ? "Nenhum jogador encontrado" : "Todos os jogadores já são membros"}
                            </EmptyStateText>
                        </EmptyStateContainer>
                    }
                    style={{ maxHeight: 200 }}
                />
                <ModalButtonsContainer>
                    <ModalCancelButton 
                        onPress={() => {
                            closeAddMemberSheet();
                            setSelectedPlayers([]);
                            setSearchTerm('');
                        }}
                        colors={colors}
                    >
                        <ModalButtonText colors={colors} variant="secondary">
                            Cancelar
                        </ModalButtonText>
                    </ModalCancelButton>
                    <SaveButton 
                        onPress={handleAddMembers}
                        disabled={selectedPlayers.length === 0 || loading}
                        colors={colors}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <SaveButtonText colors={colors}>
                                Adicionar
                            </SaveButtonText>
                        )}
                    </SaveButton>
                </ModalButtonsContainer>
            </CustomModal>

            <FAB onPress={() => router.push({
                pathname: '/comunidade/[id]/competicao/nova',
                params: { id: community.id }
            })} colors={colors}>
                <Feather name="plus" size={24} color={colors.gray100} />
            </FAB>
        </Container>
    );
}
