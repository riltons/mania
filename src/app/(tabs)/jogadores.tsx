import React, { useState, useEffect, useCallback } from 'react';
import { Alert, FlatList, RefreshControl, ActivityIndicator, View, TouchableOpacity, Text, Pressable } from 'react-native';
import styled from 'styled-components/native';
import { MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { PlayerAvatar } from '@/components/data-display/PlayerAvatar';
import { supabase } from '@/core/lib/supabase';
import { playersService, Player } from '@/features/players/services/playersService';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Header } from '@/components/layout/Header';
import { useTheme } from 'styled-components/native';
import theme from '@/theme';

// Importando o tipo do tema
import type { DefaultTheme } from 'styled-components/native';

// Definindo as props para os componentes estilizados
interface StyledProps {
  theme: DefaultTheme;
  section?: 'myPlayers' | 'communityPlayers';
  emptyMessage?: string;
}

// Estendendo o módulo styled-components para incluir o tema personalizado
declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      background: string;
      backgroundDark: string;
      backgroundMedium: string;
      card: string;
      text: string;
      textPrimary: string;
      textSecondary: string;
      success: string;
      backgroundLight: string;
      accent: string;
      primary: string;
      white: string;
      tertiary: string;
    };
    spacing: {
      small: number;
      medium: number;
      large: number;
    };
    borderRadius: {
      small: number;
      medium: number;
      large: number;
    };
  }
}

const Container = styled.View<StyledProps>`
    flex: 1;
    background-color: ${(props: StyledProps) => props.theme.colors.background};
`;

const Content = styled.View<StyledProps>`
    flex: 1;
    padding: 16px;
    background-color: ${(props: StyledProps) => props.theme.colors.background};
`;

const LoadingContainer = styled.View<StyledProps>`
    flex: 1;
    justify-content: center;
    align-items: center;
    background-color: ${(props: StyledProps) => props.theme.colors.background};
`;

const EmptyState = styled.View<StyledProps>`
    flex: 1;
    justify-content: center;
    align-items: center;
    padding: 20px;
    background-color: ${(props: StyledProps) => props.theme.colors.background};
`;

const PlayerCard = styled.View<StyledProps>`
    background-color: ${(props: StyledProps) => props.theme.colors.card};
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 12px;
`;

const PlayerHeader = styled.View`
    flex-direction: row;
    align-items: flex-start;
    margin-bottom: 16px;
    width: 100%;
`;

const Avatar = styled.View<StyledProps>`
    width: 60px;
    height: 60px;
    border-radius: 30px;
    background-color: ${(props: StyledProps) => props.theme.colors.accent}20;
    justify-content: center;
    align-items: center;
    margin-right: 15px;
`;

const PlayerInfo = styled.View`
    flex: 1;
    justify-content: center;
    flex-shrink: 1;
`;

const PlayerNameContainer = styled.View`
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 8px;
`;

const PlayerName = styled.Text<StyledProps>`
    font-size: 16px;
    font-weight: 600;
    color: ${(props: StyledProps) => props.theme.colors.text};
    margin-right: 8px;
`;

const PlayerNickname = styled.Text<StyledProps>`
    font-size: 14px;
    color: ${(props: StyledProps) => props.theme.colors.textSecondary};
    margin-top: 2px;
    margin-bottom: 8px;
`;

const PlayerPhone = styled.Text<StyledProps>`
    font-size: 14px;
    color: ${(props: StyledProps) => props.theme.colors.textSecondary};
    margin-top: 2px;
`;

const LinkedUserBadge = styled.View<StyledProps>`
    flex-direction: row;
    align-items: center;
    background-color: ${(props: StyledProps) => props.theme.colors.success}20;
    padding: 2px 8px;
    border-radius: 10px;
    margin-left: 8px;
`;

const LinkedUserText = styled.Text<StyledProps>`
    font-size: 12px;
    color: ${(props: StyledProps) => props.theme.colors.success};
    margin-left: 4px;
`;

const StatsContainer = styled.View<StyledProps>`
    flex-direction: row;
    justify-content: space-between;
    margin-top: 10px;
    padding-top: 10px;
    border-top-width: 1px;
    border-top-color: ${(props: StyledProps) => props.theme.colors.backgroundLight}40;
`;

const StatItem = styled.View`
    align-items: center;
    flex: 1;
    padding: 0 5px;
    min-width: 0;
`;

const StatValue = styled.Text<StyledProps>`
    font-size: 16px;
    font-weight: bold;
    color: ${(props: StyledProps) => props.theme.colors.text};
    margin-bottom: 4px;
`;

const StatLabel = styled.Text<StyledProps>`
    font-size: 12px;
    color: ${(props: StyledProps) => props.theme.colors.textSecondary};
    text-align: center;
`;

const ActionsContainer = styled.View`
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    margin-top: 12px;
    width: 100%;
    padding-top: 8px;
    border-top-width: 1px;
    border-top-color: #e9ecef;
`;

const ActionButton = styled.Pressable`
    padding: 10px;
    margin-left: 10px;
    border-radius: 20px;
    background-color: #e9ecef;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    min-height: 40px;
`;

const SectionTitle = styled.Text<StyledProps>`
    font-size: 18px;
    font-weight: 700;
    color: ${(props: StyledProps) => props.theme.colors.text};
    margin: 20px 0 10px 0;
`;

const EmptyStateText = styled.Text<StyledProps>`
    font-size: 16px;
    color: ${(props: StyledProps) => props.theme.colors.textSecondary};
    text-align: center;
    margin: 24px 0;
`;

const FAB = styled.Pressable<StyledProps>`
    position: absolute;
    right: 20px;
    bottom: 20px;
    width: 56px;
    height: 56px;
    border-radius: 28px;
    background-color: ${(props: StyledProps) => props.theme.colors.accent};
    justify-content: center;
    align-items: center;
    elevation: 4;
`;

interface SectionItem extends Partial<Player> {
    id?: string;
    sectionTitle?: string;
    emptyMessage?: string;
    section?: 'myPlayers' | 'communityPlayers' | 'organizedCommunityPlayers';
    [key: string]: any; 
}

// Componente principal
function JogadoresScreen() {
    // Obtendo o tema atual
    const theme = useTheme();
    const router = useRouter();
    const [myPlayers, setMyPlayers] = useState<Player[]>([]);
    const [communityPlayers, setCommunityPlayers] = useState<Player[]>([]);
    const [organizedCommunityPlayers, setOrganizedCommunityPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadPlayers = async () => {
        try {
            console.log('Iniciando carregamento de jogadores...');
            
            // Verificar a sessão atual
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            console.log('Sessão no componente Jogadores:', sessionData.session);
            
            // Verificar se o usuário está autenticado
            const { data: userData, error: userError } = await supabase.auth.getUser();
            console.log('Usuário no componente Jogadores:', userData.user);
            
            if (userError || !userData.user) {
                console.error('Erro de autenticação no componente Jogadores:', userError || 'Usuário não autenticado');
                Alert.alert('Erro', 'Você precisa estar autenticado para ver os jogadores');
                return;
            }
            
            console.log('Chamando playersService.list()...');
            const result = await playersService.list();
            console.log('Resultado do playersService.list():', result);
            
            // Processar os jogadores retornados pelo serviço
            if (result && result.data) {
                // Separar jogadores próprios, compartilhados e de comunidades organizadas
                const ownPlayers = result.data.filter(player => !player.isCreatedByOtherUser);
                const sharedPlayers = result.data.filter(player => player.isCreatedByOtherUser && !player.communityPlayer);
                const organizedPlayers = result.data.filter(player => player.communityPlayer);
                
                console.log(`Encontrados ${ownPlayers.length} jogadores próprios, ${sharedPlayers.length} jogadores compartilhados e ${organizedPlayers.length} jogadores de comunidades organizadas`);
                
                setMyPlayers(ownPlayers);
                setCommunityPlayers(sharedPlayers);
                setOrganizedCommunityPlayers(organizedPlayers);
            } else {
                console.log('Nenhum jogador encontrado ou resultado inválido');
                setMyPlayers([]);
                setCommunityPlayers([]);
                setOrganizedCommunityPlayers([]);
            }
        } catch (error) {
            console.error('Erro ao carregar jogadores:', error);
            Alert.alert('Erro', 'Não foi possível carregar os jogadores');
        } finally {
            setLoading(false);
            console.log('Finalizado carregamento de jogadores');
        }
    };

    useEffect(() => {
        loadPlayers();
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadPlayers();
        }, [])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        loadPlayers().finally(() => setRefreshing(false));
    };

    const handleDelete = (player: Player) => {
        Alert.alert(
            'Confirmar exclusão',
            `Deseja realmente excluir o jogador ${player.name}?`,
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await playersService.delete(player.id);
                            Alert.alert('Sucesso', 'Jogador excluído com sucesso');
                            loadPlayers();
                        } catch (error) {
                            console.error('Erro ao excluir jogador:', error);
                            Alert.alert('Erro', 'Não foi possível excluir o jogador');
                        }
                    }
                }
            ]
        );
    };

    const renderPlayerItem = ({
        item,
        isMyPlayer
    }: {
        item: Player & { section?: string };
        isMyPlayer: boolean;
    }) => (
        <View style={{
            backgroundColor: '#f8f9fa',
            borderRadius: 8,
            padding: 15,
            marginBottom: 12
        }}>
            {/* Área de informações do jogador */}
            <Pressable onPress={() => router.push(`/jogador/jogador/${item.id}/jogos`)}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: 16,
                    width: '100%'
                }}>
                    <PlayerAvatar 
                        avatarUrl={item.avatar_url} 
                        name={item.name} 
                        size={50} 
                    />
                    <View style={{
                        flex: 1,
                        justifyContent: 'center',
                        marginLeft: 15
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            marginBottom: 8
                        }}>
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: '#212529',
                                marginRight: 8
                            }}>{item.name}</Text>
                            {item.isLinkedUser && (
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: '#28a74520',
                                    padding: 2,
                                    paddingHorizontal: 8,
                                    borderRadius: 10,
                                    marginLeft: 8
                                }}>
                                    <MaterialCommunityIcons
                                        name="account-check"
                                        size={16}
                                        color="#28a745"
                                    />
                                    <Text style={{
                                        fontSize: 12,
                                        color: '#28a745',
                                        marginLeft: 4
                                    }}>Vinculado</Text>
                                </View>
                            )}
                        </View>
                        {item.nickname && (
                            <Text style={{
                                fontSize: 14,
                                color: '#6c757d',
                                marginTop: 2,
                                marginBottom: 8
                            }}>@{item.nickname}</Text>
                        )}
                        {item.phone && (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <MaterialCommunityIcons name="phone" size={16} color="#6c757d" style={{ marginRight: 6 }} />
                                <Text style={{
                                    fontSize: 14,
                                    color: '#6c757d',
                                    marginTop: 2
                                }}>{item.phone}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Pressable>

            {/* Área de ações */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end',
                marginTop: 12,
                width: '100%',
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: '#e9ecef'
            }}>
                {/* Botão de edição */}
                <Pressable 
                    onPress={() => router.push(`/jogador/jogador/${item.id}/editar`)}
                    style={{
                        padding: 10,
                        marginLeft: 10,
                        borderRadius: 20,
                        backgroundColor: '#e9ecef',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 40,
                        minHeight: 40
                    }}
                >
                    <Feather name="edit-2" size={20} color="#007bff" />
                </Pressable>
                
                {/* Botão de exclusão (apenas para jogadores do usuário) */}
                {isMyPlayer && (
                    <Pressable 
                        onPress={() => handleDelete(item)}
                        style={{
                            padding: 10,
                            marginLeft: 10,
                            borderRadius: 20,
                            backgroundColor: '#e9ecef',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 40,
                            minHeight: 40
                        }}
                    >
                        <Feather name="trash-2" size={20} color="#dc3545" />
                    </Pressable>
                )}
            </View>
        </View>
    );

    const renderSectionHeader = (title: string) => (
        <SectionTitle>{title}</SectionTitle>
    );

    const renderItem = ({ item }: { item: SectionItem }) => {
        if ('sectionTitle' in item && item.sectionTitle) {
            return <SectionTitle>{item.sectionTitle}</SectionTitle>;
        }

        if ('emptyMessage' in item && item.emptyMessage) {
            return <EmptyStateText>{item.emptyMessage}</EmptyStateText>;
        }

        return renderPlayerItem({
            item: item as Player,
            isMyPlayer: item.section === 'myPlayers'
        });
    };

    // Preparar dados para a FlatList
    const sections: SectionItem[] = [];
    
    // Seção "Meus Jogadores"
    sections.push({ 
        id: 'my-players-header', 
        sectionTitle: 'Meus Jogadores' 
    });
    
    if (!myPlayers || myPlayers.length === 0) {
        sections.push({ 
            id: 'no-my-players', 
            emptyMessage: 'Você ainda não criou nenhum jogador' 
        });
    } else {
        myPlayers.forEach((player, index) => {
            if (player && player.id) {
                sections.push({ 
                    ...player, 
                    id: player.id || `my-player-${index}`, 
                    section: 'myPlayers' as const 
                });
            }
        });
    }

    // Seção "Jogadores das Comunidades"
    sections.push({ 
        id: 'community-players-header', 
        sectionTitle: 'Jogadores das Comunidades' 
    });
    
    if (!communityPlayers || communityPlayers.length === 0) {
        sections.push({ 
            id: 'no-community-players', 
            emptyMessage: 'Nenhum jogador disponível nas suas comunidades' 
        });
    } else {
        communityPlayers.forEach((player, index) => {
            if (player && player.id) {
                sections.push({ 
                    ...player, 
                    id: player.id || `community-player-${index}`, 
                    section: 'communityPlayers' as const 
                });
            }
        });
    }
    
    // Seção "Jogadores das Comunidades que Organizo"
    sections.push({ 
        id: 'organized-community-players-header', 
        sectionTitle: 'Jogadores das Comunidades que Organizo' 
    });
    
    if (!organizedCommunityPlayers || organizedCommunityPlayers.length === 0) {
        sections.push({ 
            id: 'no-organized-community-players', 
            emptyMessage: 'Nenhum jogador disponível nas comunidades que você organiza' 
        });
    } else {
        organizedCommunityPlayers.forEach((player, index) => {
            if (player && player.id) {
                sections.push({ 
                    ...player, 
                    id: player.id || `organized-community-player-${index}`, 
                    section: 'organizedCommunityPlayers' as const 
                });
            }
        });
    }

    if (loading) {
        return (
            <Container>
                <Header />
                <LoadingContainer>
                    <ActivityIndicator size="large" color={theme.colors.accent} />
                </LoadingContainer>
            </Container>
        );
    }

    return (
        <Container>
            <Header title="JOGADORES" />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 8 }}>
                <TouchableOpacity 
                    onPress={() => router.push('/jogadores/compartilhados')}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: theme.colors.accent + '20',
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 8
                    }}
                >
                    <MaterialCommunityIcons name="account-multiple" size={18} color={theme.colors.accent} />
                    <Text style={{ marginLeft: 6, color: theme.colors.accent, fontWeight: '500' }}>
                        Jogadores Compartilhados
                    </Text>
                </TouchableOpacity>
            </View>
            <Content>
                <FlatList<SectionItem>
                    data={sections}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => item.id || `section-${index}`}
                    contentContainerStyle={{ padding: 12 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[theme.colors.accent]}
                        />
                    }
                />

                <FAB onPress={() => router.push('/jogadores/new')}>
                    <Feather name="plus" size={24} color="white" />
                </FAB>
            </Content>
        </Container>
    );
}

// Exportação padrão
export default function Jogadores() {
    return (
        <JogadoresScreen />
    );
}
