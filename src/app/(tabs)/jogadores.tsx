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
        console.log('Iniciando carregamento de jogadores...');
        setLoading(true);
        
        try {
            // Verificar se o usuário está autenticado
            const { data: userData, error: userError } = await supabase.auth.getUser();
            
            if (userError || !userData.user) {
                console.error('Erro de autenticação:', userError || 'Usuário não autenticado');
                setLoading(false);
                Alert.alert('Erro', 'Você precisa estar autenticado para ver os jogadores');
                return;
            }
            
            const userId = userData.user.id;
            console.log('Usuário autenticado:', userId);
            
            // Limpar estados atuais
            setMyPlayers([]);
            setCommunityPlayers([]);
            setOrganizedCommunityPlayers([]);
            
            // Buscar todos os jogadores do usuário (próprios e compartilhados)
            console.log('Buscando jogadores...');
            const { myPlayers: myPlayerList = [], communityPlayers: communityPlayerList = [] } = await playersService.listAll();
            
            console.log(`Encontrados ${myPlayerList.length} jogadores próprios`);
            console.log(`Encontrados ${communityPlayerList.length} jogadores da comunidade`);
            
            // Processar e organizar os jogadores
            const addedPlayerIds = new Set<string>();
            const ownPlayers: Player[] = [];
            const sharedPlayers: Player[] = [];
            const communityPlayers: Player[] = [];
            
            // Processar jogadores próprios
            myPlayerList.forEach((player: Player) => {
                if (!player?.id || addedPlayerIds.has(player.id)) return;
                
                player.isCreatedByOtherUser = false;
                player.sharedPlayer = false;
                ownPlayers.push(player);
                addedPlayerIds.add(player.id);
            });
            
            // Processar jogadores compartilhados e de comunidade
            communityPlayerList.forEach((player: Player) => {
                if (!player.id || addedPlayerIds.has(player.id)) return;
                
                // Jogadores compartilhados
                if (player.isCreatedByOtherUser && !player.communityPlayer) {
                    player.sharedPlayer = true;
                    sharedPlayers.push(player);
                }
                // Jogadores de comunidades
                else if (player.communityPlayer) {
                    communityPlayers.push(player);
                }
                
                addedPlayerIds.add(player.id);
            });
            
            // Garantir que o jogador do usuário está na primeira posição
            if (ownPlayers.length > 0) {
                const userPlayerIndex = ownPlayers.findIndex((p: Player) => p.id === userId);
                if (userPlayerIndex > 0) {
                    const [userPlayer] = ownPlayers.splice(userPlayerIndex, 1);
                    ownPlayers.unshift(userPlayer);
                }
            }
            
            console.log(`Organização final: ${ownPlayers.length} próprios, ${sharedPlayers.length} compartilhados, ${communityPlayers.length} de comunidades`);
            
            // Atualizar os estados com os novos dados
            setMyPlayers([...ownPlayers]);
            setCommunityPlayers([...sharedPlayers]);
            setOrganizedCommunityPlayers([...communityPlayers]);
            
            console.log('Jogadores carregados com sucesso');
        } catch (error) {
            console.error('Erro ao carregar jogadores:', error);
            Alert.alert('Erro', 'Não foi possível carregar os jogadores');
        } finally {
            setLoading(false);
            setRefreshing(false);
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

    const handleDelete = async (player: Player) => {
        try {
            // Usar o ID original do jogador (removendo o prefixo 'my-player-' se existir)
            const playerId = player.id?.replace(/^my-player-/, '');
            
            if (!playerId) {
                throw new Error('ID do jogador inválido');
            }
            
            console.log(`[handleDelete] Iniciando exclusão do jogador ID: ${playerId}`);
            
            // Mostrar confirmação antes de excluir
            const confirmDelete = await new Promise<boolean>((resolve) => {
                Alert.alert(
                    'Confirmar exclusão',
                    `Deseja realmente excluir o jogador ${player.name}?`,
                    [
                        {
                            text: 'Cancelar',
                            style: 'cancel',
                            onPress: () => resolve(false)
                        },
                        {
                            text: 'Excluir',
                            style: 'destructive',
                            onPress: () => resolve(true)
                        }
                    ]
                );
            });
            
            if (!confirmDelete) {
                console.log('[handleDelete] Exclusão cancelada pelo usuário');
                return;
            }
            
            setLoading(true);
            
            // Atualização otimista da UI
            const previousMyPlayers = [...myPlayers];
            const previousCommunityPlayers = [...communityPlayers];
            const previousOrganizedPlayers = [...organizedCommunityPlayers];
            
            // Remover o jogador da UI imediatamente
            setMyPlayers(prev => prev.filter(p => p.id !== player.id));
            setCommunityPlayers(prev => prev.filter(p => p.id !== player.id));
            setOrganizedCommunityPlayers(prev => prev.filter(p => p.id !== player.id));
            
            try {
                // Chamar o serviço para excluir o jogador
                await playersService.delete(playerId);
                console.log(`[handleDelete] Jogador ${playerId} excluído com sucesso`);
                
                // Recarregar a lista para garantir sincronização
                await loadPlayers();
                
                Alert.alert('Sucesso', 'Jogador excluído com sucesso');
            } catch (error) {
                console.error('[handleDelete] Erro ao excluir jogador:', error);
                
                // Reverter para o estado anterior em caso de erro
                setMyPlayers(previousMyPlayers);
                setCommunityPlayers(previousCommunityPlayers);
                setOrganizedCommunityPlayers(previousOrganizedPlayers);
                
                throw error;
            }
        } catch (error) {
            console.error('[handleDelete] Erro no processo de exclusão:', error);
            Alert.alert(
                'Erro', 
                error instanceof Error ? error.message : 'Não foi possível excluir o jogador'
            );
        } finally {
            setLoading(false);
        }
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
            <Pressable onPress={() => {
                // Usar o ID original do jogador (removendo o prefixo 'my-player-' se existir)
                const playerId = item.id?.replace(/^my-player-/, '');
                router.push(`/jogador/jogador/${playerId}/jogos`);
            }}>
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
                    onPress={() => {
                        // Usar o ID original do jogador (removendo o prefixo 'my-player-' se existir)
                        const playerId = item.id?.replace(/^my-player-/, '');
                        router.push(`/jogador/jogador/${playerId}/editar`);
                    }}
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
                    id: `my-player-${player.id}`, // Adiciona prefixo único para a seção
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
                    id: `community-${player.id}`, // Adiciona prefixo único para a seção
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
                    id: `organized-${player.id}`, // Adiciona prefixo único para a seção
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
