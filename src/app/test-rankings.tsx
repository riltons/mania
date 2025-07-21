import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { mockRankingService } from '@/features/statistics/services/simpleRankingTest';

export default function TestRankings() {
    const [topPlayers, setTopPlayers] = useState<any[]>([]);
    const [topPairs, setTopPairs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTestData();
    }, []);

    const loadTestData = async () => {
        try {
            console.log('[TestRankings] Carregando dados de teste...');
            
            // Carregar jogadores
            const players = await mockRankingService.getTopPlayers();
            console.log('[TestRankings] Jogadores carregados:', players);
            setTopPlayers(players.slice(0, 5));
            
            // Carregar duplas
            const pairs = await mockRankingService.getTopPairs();
            console.log('[TestRankings] Duplas carregadas:', pairs);
            setTopPairs(pairs.slice(0, 4));
            
            setLoading(false);
        } catch (error) {
            console.error('[TestRankings] Erro ao carregar dados:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' }}>
                <Text style={{ color: 'white', fontSize: 18 }}>Carregando dados de teste...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#1a1a1a', padding: 20 }}>
            <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
                Teste dos Rankings
            </Text>
            
            {/* Top Jogadores */}
            <View style={{ marginBottom: 30 }}>
                <Text style={{ color: '#FFD700', fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}>
                    🏆 Top Jogadores ({topPlayers.length})
                </Text>
                {topPlayers.map((player, index) => (
                    <View key={player.id} style={{ 
                        backgroundColor: '#2a2a2a', 
                        padding: 15, 
                        marginBottom: 10, 
                        borderRadius: 8,
                        flexDirection: 'row',
                        alignItems: 'center'
                    }}>
                        <Text style={{ color: '#FFD700', fontSize: 16, fontWeight: 'bold', width: 30 }}>
                            #{index + 1}
                        </Text>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                                {player.name}
                            </Text>
                            <Text style={{ color: '#888', fontSize: 14 }}>
                                {player.wins}V - {player.losses}D | {player.winRate.toFixed(1)}% | {player.points} pts
                            </Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Top Duplas */}
            <View>
                <Text style={{ color: '#FFD700', fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}>
                    👥 Top Duplas ({topPairs.length})
                </Text>
                {topPairs.map((pair, index) => (
                    <View key={pair.id} style={{ 
                        backgroundColor: '#2a2a2a', 
                        padding: 15, 
                        marginBottom: 10, 
                        borderRadius: 8,
                        flexDirection: 'row',
                        alignItems: 'center'
                    }}>
                        <Text style={{ color: '#FFD700', fontSize: 16, fontWeight: 'bold', width: 30 }}>
                            #{index + 1}
                        </Text>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                                {pair.player1.name} & {pair.player2.name}
                            </Text>
                            <Text style={{ color: '#888', fontSize: 14 }}>
                                {pair.wins}V - {pair.losses}D | {pair.winRate.toFixed(1)}% | {pair.buchudas} buchudas
                            </Text>
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}
