import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Activity, activityService } from '@/services/activityService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/styles/colors';

export function RecentActivities() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRecentActivities();
    }, []);

    async function loadRecentActivities() {
        try {
            const data = await activityService.getRecentActivities();
            setActivities(data);
        } catch (error) {
            console.error('Erro ao carregar atividades recentes:', error);
        } finally {
            setLoading(false);
        }
    }

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
                    <View style={styles.activityContent}>
                        <Text style={styles.description}>{item.description}</Text>
                        <Text style={styles.time}>
                            {item.time.toLocaleDateString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            })}
                        </Text>
                    </View>
                </View>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Carregando atividades recentes...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Atividades Recentes</Text>
            <FlatList
                data={activities}
                renderItem={renderActivity}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    list: {
        gap: 16,
    },
    activityCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    date: {
        fontSize: 14,
        color: '#666',
    },
    scoreContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 8,
    },
    teamContainer: {
        alignItems: 'center',
        flex: 1,
    },
    teamName: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    score: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    vs: {
        fontSize: 16,
        color: '#666',
        marginHorizontal: 16,
    },
    specialEvent: {
        color: '#e63946',
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 8,
    },
});