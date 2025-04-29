import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { Activity, activityService } from '@/services/activityService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/styles/colors';
import { Text } from 'react-native';

export default function ActivitiesPage() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const ITEMS_PER_PAGE = 20;

    async function loadActivities(pageNumber: number = 1, shouldRefresh: boolean = false) {
        try {
            if (shouldRefresh) {
                setRefreshing(true);
            }

            if (pageNumber === 1) {
                setLoading(true);
            }

            const data = await activityService.getRecentActivities(pageNumber, ITEMS_PER_PAGE);
            
            if (data.length < ITEMS_PER_PAGE) {
                setHasMore(false);
            }

            if (pageNumber === 1) {
                setActivities(data);
            } else {
                setActivities(prev => [...prev, ...data]);
            }
        } catch (error) {
            console.error('Erro ao carregar atividades:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        loadActivities();
    }, []);

    const handleRefresh = () => {
        setPage(1);
        setHasMore(true);
        loadActivities(1, true);
    };

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadActivities(nextPage);
        }
    };

    function renderActivity({ item }: { item: Activity }) {
        const getIcon = (type: Activity['type']) => {
            switch (type) {
                case 'game':
                    return 'cards-playing-outline';
                case 'competition':
                    return 'trophy-outline';
                case 'community':
                    return 'account-group';
                case 'player':
                    return 'account-star';
                default:
                    return 'information';
            }
        };

        return (
            <View style={styles.activityCard}>
                <View style={styles.activityHeader}>
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons 
                            name={getIcon(item.type)} 
                            size={24} 
                            color={colors.primary} 
                        />
                    </View>
                    <Text style={styles.activityTitle}>{item.title}</Text>
                </View>
                <Text style={styles.activityDescription}>{item.description}</Text>
                <Text style={styles.activityTimestamp}>
                    {new Date(item.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </Text>
            </View>
        );
    }

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={activities}
                renderItem={renderActivity}
                keyExtractor={(item) => item.id.toString()}
                onRefresh={handleRefresh}
                refreshing={refreshing}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.1}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Nenhuma atividade encontrada</Text>
                    </View>
                }
                ListFooterComponent={
                    loading && activities.length > 0 ? (
                        <View style={styles.footerLoader}>
                            <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    activityCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    activityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8
    },
    iconContainer: {
        marginRight: 12
    },
    activityTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1
    },
    activityDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8
    },
    activityTimestamp: {
        fontSize: 12,
        color: '#999'
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 24
    },
    emptyText: {
        fontSize: 16,
        color: '#666'
    },
    footerLoader: {
        paddingVertical: 16,
        alignItems: 'center'
    }
});