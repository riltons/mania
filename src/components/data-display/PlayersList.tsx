import React, { useEffect, useState, useCallback } from 'react';
import { Alert, TouchableOpacity, RefreshControl, FlatList, View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/core/contexts/ThemeProvider';
import { playersService } from '@/features/players/services/playersService';
import { PlayerAvatar } from '@/components/data-display/PlayerAvatar';
import { MaterialIcons } from '@expo/vector-icons';
import { Player } from '@/features/players/services/playerService';

type PlayersListProps = {
    excludeIds?: string[];
    onSelectPlayer?: (playerId: string) => void;
    selectionMode?: boolean;
};

export function PlayersList({ excludeIds = [], onSelectPlayer }: PlayersListProps) {
    const router = useRouter();
    const theme = useTheme();
    const [myPlayers, setMyPlayers] = useState<Player[]>([]);
    const [communityPlayers, setCommunityPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    const loadPlayers = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        setRefreshing(true);
        
        try {
            console.log('PlayersList: Iniciando carregamento de jogadores...');
            
            // Verificar se o serviço está disponível
            if (!playersService) {
                console.error('PlayersList: Serviço de jogadores não está disponível');
                Alert.alert('Erro', 'Serviço de jogadores não disponível');
                return;
            }
            
            // Usar o método listAll para garantir que todos os jogadores sejam carregados
            const data = await playersService.listAll();
            console.log('PlayersList: Dados recebidos do serviço:', JSON.stringify(data));
            
            // Verificar se os dados retornados são válidos
            if (!data || typeof data !== 'object') {
                console.error('PlayersList: Dados inválidos retornados pelo serviço');
                Alert.alert('Erro', 'Dados inválidos retornados pelo serviço');
                return;
            }
            
            // Garantir que temos arrays válidos mesmo se os dados estiverem vazios
            const rawMyPlayers = Array.isArray(data.myPlayers) ? data.myPlayers : [];
            const rawCommunityPlayers = Array.isArray(data.communityPlayers) ? data.communityPlayers : [];
            
            console.log(`PlayersList: Dados brutos: ${rawMyPlayers.length} jogadores próprios e ${rawCommunityPlayers.length} da comunidade`);
            
            // Filtrar jogadores excluídos
            const filteredMyPlayers = excludeIds.length > 0
                ? rawMyPlayers.filter(player => !excludeIds.includes(player.id))
                : rawMyPlayers;
            
            const filteredCommunityPlayers = excludeIds.length > 0
                ? rawCommunityPlayers.filter(player => !excludeIds.includes(player.id))
                : rawCommunityPlayers;

            console.log(`PlayersList: Após filtragem: ${filteredMyPlayers.length} jogadores próprios e ${filteredCommunityPlayers.length} da comunidade`);
            
            // Verificar a estrutura dos dados para diagnóstico
            if (filteredMyPlayers.length > 0) {
                const firstPlayer = filteredMyPlayers[0];
                console.log('PlayersList: Estrutura do primeiro jogador próprio:', 
                    JSON.stringify({
                        id: firstPlayer.id,
                        name: firstPlayer.name,
                        isPrimary: firstPlayer.isPrimary,
                        avatar_url: firstPlayer.avatar_url ? '[PRESENTE]' : '[AUSENTE]',
                        phone: firstPlayer.phone ? '[PRESENTE]' : '[AUSENTE]'
                    })
                );
            }

            // Adaptando os tipos para o componente de forma mais segura
            setMyPlayers(filteredMyPlayers);
            setCommunityPlayers(filteredCommunityPlayers);
            
            console.log(`PlayersList: Estados atualizados com ${filteredMyPlayers.length} jogadores próprios e ${filteredCommunityPlayers.length} da comunidade`);
        } catch (error) {
            console.error('PlayersList: Erro ao carregar jogadores:', error);
            Alert.alert('Erro', 'Erro ao carregar jogadores. Tente novamente.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [excludeIds]);
    
    // Verificar estado após renderização
    useEffect(() => {
        console.log(`PlayersList: Estado atual - ${myPlayers.length} jogadores próprios e ${communityPlayers.length} da comunidade`);
    }, [myPlayers, communityPlayers]);
    
    // Atualiza a lista quando o componente é montado
    useEffect(() => {
        console.log('PlayersList: Componente montado, carregando jogadores...');
        loadPlayers();
    }, [loadPlayers]);
    
    // Adicionar um efeito para recarregar quando o componente recebe props atualizadas
    useEffect(() => {
        console.log('PlayersList: Propriedades atualizadas, recarregando jogadores...');
        loadPlayers(false);
    }, [excludeIds]);
    
    // Função para atualizar a lista quando o usuário puxar para baixo
    const onRefresh = useCallback(() => {
        loadPlayers(false);
    }, [loadPlayers]);

    const handlePlayerPress = (playerId: string) => {
        if (onSelectPlayer) {
            onSelectPlayer(playerId);
        } else {
            router.push(`/jogador/jogador/${playerId}/jogos`);
        }
    };

    const renderPlayerItem = useCallback(({ item }: { item: Player }) => {
        console.log('PlayersList: Renderizando jogador:', JSON.stringify(item));
        
        // Verificando todos os campos necessários para renderização
        const playerName = item?.name || 'Nome indisponível';
        const avatarUrl = item?.avatar_url;
        const nickname = item?.nickname;
        const phone = item?.phone;
        const isPrimary = item?.isPrimary;
        
        console.log(`PlayersList: Dados para renderização - Nome: ${playerName}, Avatar: ${!!avatarUrl}, Nickname: ${!!nickname}, Phone: ${!!phone}, Principal: ${!!isPrimary}`);
        
        return (
            <TouchableOpacity 
                style={[styles.playerCard, { backgroundColor: theme.colors.card }]}
                onPress={() => handlePlayerPress(item.id)}
            >
                <View style={styles.playerCardContent}>
                    <PlayerAvatar 
                        avatarUrl={avatarUrl} 
                        name={playerName} 
                        size={40} 
                    />
                    <View style={styles.playerInfo}>
                        <Text style={[styles.playerName, { color: theme.colors.text }]}>{playerName}</Text>
                        {nickname && (
                            <Text style={[styles.playerNickname, { color: theme.colors.textSecondary }]}>
                                @{nickname}
                            </Text>
                        )}
                        {phone && (
                            <Text style={[styles.playerPhone, { color: theme.colors.textSecondary }]}>
                                {phone}
                            </Text>
                        )}
                    </View>
                    {isPrimary && (
                        <View style={[styles.primaryBadge, { backgroundColor: theme.colors.backgroundLight }]}>
                            <MaterialIcons name="star" size={16} color="#FFD700" />
                            <Text style={[styles.primaryText, { color: theme.colors.accent }]}>Principal</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    }, [theme]);

    if (loading && !refreshing) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginBottom: 16 }} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                    Carregando jogadores...
                </Text>
            </View>
        );
    }
    
    // Se não houver nenhum jogador (próprio ou compartilhado), mostra uma mensagem simplificada
    const totalPlayers = myPlayers.length + communityPlayers.length;
    if (totalPlayers === 0 && !loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary, marginBottom: 20 }]}>
                    Nenhum jogador encontrado
                </Text>
                <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: theme.colors.primary }]} 
                    onPress={() => loadPlayers(true)}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
                        <Text style={{ color: '#FFFFFF', marginLeft: 8, fontWeight: '500' }}>Atualizar Lista</Text>
                    </View>
                </TouchableOpacity>
            </View>
        );
    }

    const navigateToCreatePlayer = () => {
        console.log('PlayersList: Navegando para criar novo jogador');
        router.push('/players/create' as any);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background, position: 'relative' }]}>
            <ScrollView 
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        colors={[theme.colors.primary]}
                        tintColor={theme.colors.primary}
                    />
                }
                style={{ flex: 1 }}
            >
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Meus Jogadores
                        </Text>
                        <TouchableOpacity 
                            style={[styles.refreshButton, { backgroundColor: theme.colors.backgroundLight }]} 
                            onPress={() => loadPlayers(false)}
                        >
                            <MaterialIcons name="refresh" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>
                    
                    {myPlayers.length === 0 ? (
                        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                            Você ainda não criou nenhum jogador
                        </Text>
                    ) : (
                        <>
                            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                                {myPlayers.length} jogadores próprios encontrados
                            </Text>
                            <FlatList
                                data={myPlayers}
                                keyExtractor={(item) => item.id}
                                renderItem={renderPlayerItem}
                                scrollEnabled={false}
                            />
                        </>
                    )}
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Jogadores das Comunidades
                        </Text>
                        <TouchableOpacity 
                            style={[styles.refreshButton, { backgroundColor: theme.colors.backgroundLight }]} 
                            onPress={() => loadPlayers(false)}
                        >
                            <MaterialIcons name="refresh" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>
                    
                    {communityPlayers.length === 0 ? (
                        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                            Nenhum jogador disponível nas suas comunidades
                        </Text>
                    ) : (
                        <>
                            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                                {communityPlayers.length} jogadores compartilhados encontrados
                            </Text>
                            <FlatList
                                data={communityPlayers}
                                keyExtractor={(item) => item.id}
                                renderItem={renderPlayerItem}
                                scrollEnabled={false}
                            />
                        </>
                    )}
                </View>
            </ScrollView>
            
            {/* Botão flutuante para criar novo jogador */}
            <TouchableOpacity 
                style={[styles.floatingButton, { backgroundColor: theme.colors.primary }]}
                onPress={navigateToCreatePlayer}
            >
                <MaterialIcons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    floatingButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    refreshButton: {
        padding: 8,
        borderRadius: 4,
    },
    actionButton: {
        padding: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    playerCard: {
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    playerCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    playerInfo: {
        marginLeft: 12,
        flex: 1,
    },
    playerName: {
        fontSize: 16,
        fontWeight: '500',
    },
    playerNickname: {
        fontSize: 14,
        marginTop: 2,
    },
    playerPhone: {
        fontSize: 13,
        marginTop: 2,
    },
    primaryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        borderRadius: 12,
        marginLeft: 10,
    },
    primaryText: {
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 4,
    },
    emptyText: {
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 10,
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 20,
    },
});
