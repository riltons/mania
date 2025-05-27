import React, { useEffect, useState, useCallback } from 'react';
import { Alert, TouchableOpacity, RefreshControl, FlatList, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/core/contexts/ThemeProvider';
import { playersService } from '@/features/players/services/playersService';
import { PlayerAvatar } from '@/components/data-display/PlayerAvatar';
import { MaterialIcons } from '@expo/vector-icons';

type Player = {
    id: string;
    name: string;
    avatar_url: string | null;
    created_by: string;
    isMine?: boolean;
    isPrimary?: boolean;
    phone?: string;
    nickname?: string | null;
    created_at?: string;
};

type PlayersListProps = {
    excludeIds?: string[];
    onSelectPlayer?: (playerId: string) => void;
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
            const data = await playersService.list();
            
            // Filtrar jogadores excluídos
            const filteredMyPlayers = excludeIds.length > 0
                ? data.myPlayers.filter(player => !excludeIds.includes(player.id))
                : data.myPlayers;
            
            const filteredCommunityPlayers = excludeIds.length > 0
                ? data.communityPlayers.filter(player => !excludeIds.includes(player.id))
                : data.communityPlayers;

            setMyPlayers(filteredMyPlayers);
            setCommunityPlayers(filteredCommunityPlayers);
        } catch (error) {
            Alert.alert('Erro', 'Erro ao carregar jogadores');
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [excludeIds]);
    
    // Atualiza a lista quando o componente é montado
    useEffect(() => {
        loadPlayers();
    }, [loadPlayers]);
    
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

    const renderPlayerItem = useCallback(({ item }: { item: Player }) => (
        <TouchableOpacity 
            style={[styles.playerCard, { backgroundColor: theme.colors.card }]}
            onPress={() => handlePlayerPress(item.id)}
        >
            <View style={styles.playerCardContent}>
                <PlayerAvatar 
                    avatarUrl={item.avatar_url} 
                    name={item.name} 
                    size={40} 
                />
                <View style={styles.playerInfo}>
                    <Text style={[styles.playerName, { color: theme.colors.text }]}>{item.name}</Text>
                    {item.nickname && (
                        <Text style={[styles.playerNickname, { color: theme.colors.textSecondary }]}>
                            @{item.nickname}
                        </Text>
                    )}
                    {item.phone && (
                        <Text style={[styles.playerPhone, { color: theme.colors.textSecondary }]}>
                            {item.phone}
                        </Text>
                    )}
                </View>
                {item.isPrimary && (
                    <View style={[styles.primaryBadge, { backgroundColor: theme.colors.backgroundLight }]}>
                        <MaterialIcons name="star" size={16} color="#FFD700" />
                        <Text style={[styles.primaryText, { color: theme.colors.accent }]}>Principal</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    ), [theme]);

    if (loading && !refreshing) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                    Carregando jogadores...
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                colors={['#007AFF']}
                tintColor="#007AFF"
            >
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Meus Jogadores
                        </Text>
                        <TouchableOpacity 
                            style={styles.refreshButton} 
                            onPress={() => loadPlayers(false)}
                        >
                            <MaterialIcons name="refresh" size={20} color="#007AFF" />
                        </TouchableOpacity>
                    </View>
                    
                    {myPlayers.length === 0 ? (
                        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                            Você ainda não criou nenhum jogador
                        </Text>
                    ) : (
                        <FlatList
                            data={myPlayers}
                            keyExtractor={(item) => item.id}
                            renderItem={renderPlayerItem}
                            scrollEnabled={false}
                        />
                    )}
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Jogadores das Comunidades
                        </Text>
                        <TouchableOpacity 
                            style={styles.refreshButton} 
                            onPress={() => loadPlayers(false)}
                        >
                            <MaterialIcons name="refresh" size={20} color="#007AFF" />
                        </TouchableOpacity>
                    </View>
                    
                    {communityPlayers.length === 0 ? (
                        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                            Nenhum jogador disponível nas suas comunidades
                        </Text>
                    ) : (
                        <FlatList
                            data={communityPlayers}
                            keyExtractor={(item) => item.id}
                            renderItem={renderPlayerItem}
                            scrollEnabled={false}
                        />
                    )}
                </View>
            </RefreshControl>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
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
        padding: 5,
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
