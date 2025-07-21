import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, Dimensions, RefreshControl, Alert, Text } from "react-native";
import styled from "styled-components/native";
import { useTheme } from "@/core/contexts/ThemeProvider";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { Header } from "@/core/components/layout/Header";
import { useRouter, Link } from "expo-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart } from "@/core/components/data-display/WebLineChart";
import { useAuth } from "@/features/auth/contexts/AuthProvider";
import { statisticsService } from "@/features/statistics/services/statisticsService";
import { rankingService } from "@/features/statistics/services/rankingService";
import { activityService } from "@/features/activities/services/activityService";
import { testRankingData } from "@/features/statistics/services/testRankingService";
import { mockRankingService, simpleRankingTest } from "@/features/statistics/services/simpleRankingTest";
import rankingServiceFixed from "@/features/statistics/services/rankingServiceFixed";
import { supabase } from "@/core/lib/supabase";
import { PlayerAvatar } from "@/core/components/data-display/PlayerAvatar";
import { DefaultTheme } from 'styled-components';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Stats {
    totalGames: number;
    totalCompetitions: number;
    totalPlayers: number;
    averageScore: number;
    totalCommunities: number;
}

interface Player {
    id: string;
    name: string;
    avatar_url?: string | null;
    wins: number;
    buchudas: number;
    buchudasDeRe: number;
    winRate: number;
    position: number;
}

interface Pair {
    id: string;
    player1: {
        id: string;
        name: string;
        avatar_url?: string | null;
    };
    player2: {
        id: string;
        name: string;
        avatar_url?: string | null;
    };
    wins: number;
    buchudas: number;
    buchudasDeRe: number;
    winRate: number;
}

interface Activity {
    id: string;
    type: 'game' | 'competition' | 'player' | 'community';
    description: string;
    created_at: Date;
}

const Container = styled.View`
    flex: 1;
    background-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.backgroundDark};
`;

const ScrollContent = styled.ScrollView`
    flex: 1;
`;

const Content = styled.View`
    flex: 1;
    padding-bottom: 20px;
`;

const WelcomeContainer = styled.View`
    padding: 20px 20px;
    margin-bottom: 10px;
`;

const WelcomeText = styled.Text`
    font-size: 28px;
    font-weight: bold;
    color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textPrimary};
`;

const WelcomeSubtext = styled.Text`
    font-size: 16px;
    color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textSecondary};
    margin-top: 4px;
`;

const StatisticsContainer = styled.View`
    flex-direction: row;
    flex-wrap: wrap;
    padding: 0 20px;
    justify-content: space-between;
`;

const StatCardWrapper = styled.View`
    width: 48%;
    margin-bottom: 16px;
`;

const StatCard = styled.TouchableOpacity`
    background-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.backgroundMedium};
    border-radius: 16px;
    padding: 20px;
    width: 100%;
    align-items: center;
    elevation: 3;
    border: 1px solid ${({ theme }: { theme: DefaultTheme }) => theme.colors.tertiary}40;
`;

const StatIcon = styled.View`
    width: 40px;
    height: 40px;
    border-radius: 20px;
    background-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.primary}20;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
`;

const StatValue = styled.Text`
    font-size: 24px;
    font-weight: bold;
    color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textPrimary};
    margin-top: 8px;
`;

const StatLabel = styled.Text`
    font-size: 14px;
    color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textSecondary};
    text-align: center;
`;

const ChartContainer = styled.View`
    background-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.backgroundMedium};
    border-radius: 16px;
    padding: 20px;
    margin: 0 20px 20px;
    border: 1px solid ${({ theme }: { theme: DefaultTheme }) => theme.colors.tertiary}40;
    align-items: center;
`;

const ChartTitle = styled.Text`
    font-size: 16px;
    font-weight: bold;
    color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textPrimary};
    margin-bottom: 16px;
`;

const SectionContainer = styled.View`
    padding: 0 20px;
    margin-bottom: 20px;
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
    color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textPrimary};
`;

const SeeAllButton = styled.TouchableOpacity`
    padding: 8px 16px;
    background-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.primary};
    border-radius: 8px;
`;

const SeeAllButtonText = styled.Text`
    color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.white};
    font-size: 14px;
    font-weight: bold;
`;

const PlayerCard = styled.TouchableOpacity`
    flex-direction: row;
    align-items: center;
    background-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.backgroundMedium};
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    border: 1px solid ${({ theme }: { theme: DefaultTheme }) => theme.colors.tertiary}40;
`;

const PlayerInfo = styled.View`
    flex: 1;
    margin-left: 12px;
`;

const PlayerName = styled.Text`
    font-size: 16px;
    font-weight: bold;
    color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textPrimary};
`;

const PlayerStats = ({ children }: { children: React.ReactNode }) => {
    const { colors } = useTheme();
    return (
        <View style={{ marginTop: 4 }}>
            <Text style={{ color: colors.textSecondary }}>
                {children}
            </Text>
        </View>
    );
};

const ActivityCard = styled.TouchableOpacity`
    flex-direction: row;
    align-items: center;
    background-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.backgroundMedium};
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    border: 1px solid ${({ theme }: { theme: DefaultTheme }) => theme.colors.tertiary}40;
`;

const ActivityInfo = styled.View`
    flex: 1;
    margin-left: 12px;
`;

const ActivityText = styled.Text`
    font-size: 14px;
    color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textPrimary};
`;

const ActivityTime = styled.Text`
    font-size: 12px;
    color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textSecondary};
    margin-top: 4px;
`;

const Dashboard: React.FC = () => {
    const { colors } = useTheme();
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<Stats>({
        totalGames: 0,
        totalCompetitions: 0,
        totalPlayers: 0,
        averageScore: 0,
        totalCommunities: 0
    });

    const [topPlayers, setTopPlayers] = useState<Player[]>([]);
    const [topPairs, setTopPairs] = useState<Pair[]>([]);
    const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
    const [monthlyGamesData, setMonthlyGamesData] = useState<{
        labels: string[];
        datasets: Array<{
            data: number[];
        }>;
    }>({
        labels: [],
        datasets: [{
            data: []
        }]
    });

    const loadStatistics = async () => {
        try {
            setRefreshing(true);
            console.log('[Dashboard] Carregando estatísticas...');
            
            if (!isAuthenticated || !user?.id) {
                console.log('[Dashboard] Usuário não está autenticado');
                setRefreshing(false);
                return;
            }
            
            // Executar teste de dados para debug
            console.log('[Dashboard] Executando teste de dados...');
            await testRankingData();
            
            // Executar teste simples
            console.log('[Dashboard] Executando teste simples...');
            await simpleRankingTest();
            
            // Carregar estatísticas básicas
            const userStats = await statisticsService.getUserStats();
            setStats(userStats);
            
            // Carregar dados de jogos por mês para o gráfico
            try {
                const monthlyData = await statisticsService.getMonthlyGamesData();
                console.log('[Dashboard] Dados de jogos por mês carregados:', monthlyData);
                
                if (monthlyData.labels.length > 0) {
                    setMonthlyGamesData({
                        labels: monthlyData.labels,
                        datasets: [{
                            data: monthlyData.data
                        }]
                    });
                }
            } catch (monthlyError) {
                console.error('[Dashboard] Erro ao carregar dados de jogos por mês:', monthlyError);
            }
            
            // Carregar atividades recentes
            try {
                const activities = await activityService.getRecentActivities();
                setRecentActivities(activities);
            } catch (activityError) {
                console.error('[Dashboard] Erro ao carregar atividades recentes:', activityError);
            }
            
            // Carregar ranking de jogadores
            try {
                console.log('[Dashboard] Iniciando carregamento de top jogadores...');
                
                // Verificar se usuário está autenticado
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    console.log('[Dashboard] Usuário não autenticado, usando dados de teste');
                    const rankings = await mockRankingService.getTopPlayers();
                    console.log('[Dashboard] Usando dados mock para demonstração:', rankings.length);
                    setTopPlayers(rankings.slice(0, 5));
                    return;
                }
                
                // Sistema de fallback: original -> fixed -> mock
                console.log('[Dashboard] Tentando usar rankingService original...');
                let rankings;
                try {
                    rankings = await rankingService.getTopPlayers();
                    console.log('[Dashboard] rankingService original funcionou!');
                } catch (originalError) {
                    console.log('[Dashboard] rankingService original falhou, tentando fixed...');
                    console.error('[Dashboard] Erro original:', originalError);
                    try {
                        rankings = await rankingServiceFixed.getTopPlayers();
                        console.log('[Dashboard] rankingServiceFixed funcionou!');
                    } catch (fixedError) {
                        console.log('[Dashboard] rankingServiceFixed falhou, usando mock...');
                        console.error('[Dashboard] Erro fixed:', fixedError);
                        rankings = await mockRankingService.getTopPlayers();
                    }
                }
                console.log('[Dashboard] Top jogadores carregados:', rankings.length);
                console.log('[Dashboard] Dados dos rankings:', rankings);
                
                const sortedRankings = [...rankings].sort((a, b) => {
                    if (b.wins !== a.wins) return b.wins - a.wins;
                    return b.winRate - a.winRate;
                });
                
                const topPlayers = sortedRankings
                    .slice(0, 4)
                    .map((player, index) => ({
                        ...player,
                        position: index + 1
                    }));
                
                console.log('[Dashboard] Top players processados:', topPlayers);
                setTopPlayers(topPlayers);
            } catch (playerError) {
                console.error('[Dashboard] Erro ao carregar top jogadores:');
                console.error('[Dashboard] Tipo do erro:', typeof playerError);
                console.error('[Dashboard] Erro completo:', playerError);
                console.error('[Dashboard] Stack trace:', (playerError as any)?.stack);
                console.error('[Dashboard] Mensagem:', (playerError as any)?.message);
            }
            
            // Carregar ranking de duplas
            try {
                console.log('[Dashboard] Iniciando carregamento de top duplas...');
                
                // Verificar se usuário está autenticado
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    console.log('[Dashboard] Usuário não autenticado, usando dados de teste para duplas');
                    const rankings = await mockRankingService.getTopPairs();
                    console.log('[Dashboard] Usando dados mock para duplas:', rankings.length);
                    const top4Pairs = rankings.slice(0, 4).map((pair: any) => ({
                        id: pair.id,
                        player1: {
                            id: pair.player1.id,
                            name: pair.player1.name,
                            avatar_url: pair.player1.avatar_url
                        },
                        player2: {
                            id: pair.player2.id,
                            name: pair.player2.name,
                            avatar_url: pair.player2.avatar_url
                        },
                        wins: pair.wins,
                        buchudas: pair.buchudas,
                        buchudasDeRe: pair.buchudasDeRe,
                        winRate: pair.winRate
                    }));
                    setTopPairs(top4Pairs);
                    return;
                }
                
                // Sistema de fallback para usuários autenticados
                console.log('[Dashboard] Tentando usar rankingService.getTopPairs original...');
                let rankings;
                try {
                    rankings = await rankingService.getTopPairs();
                    console.log('[Dashboard] rankingService.getTopPairs funcionou!');
                } catch (originalError) {
                    console.log('[Dashboard] rankingService.getTopPairs falhou, tentando fixed...');
                    console.error('[Dashboard] Erro original:', originalError);
                    try {
                        rankings = await rankingServiceFixed.getTopPairs();
                        console.log('[Dashboard] rankingServiceFixed.getTopPairs funcionou!');
                    } catch (fixedError) {
                        console.log('[Dashboard] rankingServiceFixed.getTopPairs falhou, usando mock...');
                        console.error('[Dashboard] Erro fixed:', fixedError);
                        rankings = await mockRankingService.getTopPairs();
                    }
                }
                console.log('[Dashboard] Top duplas carregadas:', rankings.length);
                console.log('[Dashboard] Dados das duplas:', rankings);
                
                const top4Pairs = rankings.slice(0, 4).map(pair => ({
                    id: pair.id,
                    player1: {
                        id: pair.player1.id,
                        name: pair.player1.name,
                        avatar_url: pair.player1.avatar_url
                    },
                    player2: {
                        id: pair.player2.id,
                        name: pair.player2.name,
                        avatar_url: pair.player2.avatar_url
                    },
                    wins: pair.wins,
                    buchudas: pair.buchudas,
                    buchudasDeRe: pair.buchudasDeRe,
                    winRate: pair.winRate
                }));
                console.log('[Dashboard] Top pairs processadas:', top4Pairs);
                setTopPairs(top4Pairs);
            } catch (pairError) {
                console.error('[Dashboard] Erro ao carregar top duplas:');
                console.error('[Dashboard] Tipo do erro:', typeof pairError);
                console.error('[Dashboard] Erro completo:', pairError);
                console.error('[Dashboard] Stack trace:', (pairError as any)?.stack);
                console.error('[Dashboard] Mensagem:', (pairError as any)?.message);
            }
            
        } catch (error) {
            console.error('[Dashboard] Erro ao carregar estatísticas:', error);
            Alert.alert('Erro', 'Não foi possível carregar as estatísticas.');
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (!authLoading && isAuthenticated && user?.id) {
            loadStatistics();
        }
    }, [user?.id, authLoading, isAuthenticated]);

    const onRefresh = async () => {
        await loadStatistics();
    };

    return (
        <Container>
            <Header isDashboard />
            <ScrollContent 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                }
            >
                <Content>
                    <WelcomeContainer>
                        <WelcomeText>{isAuthenticated && user ? `Olá, ${user.user_metadata.name || user.email}!` : 'Olá!'}</WelcomeText>
                        <WelcomeSubtext>
                            {isAuthenticated 
                                ? "Confira as estatísticas das suas comunidades" 
                                : "Faça login para ver suas estatísticas"}
                        </WelcomeSubtext>
                    </WelcomeContainer>

                    <StatisticsContainer>
                        <StatCardWrapper>
                            <StatCard onPress={() => router.push("/jogos")}>
                                <StatIcon>
                                    <MaterialCommunityIcons name="cards-playing-outline" size={24} color={colors.primary} />
                                </StatIcon>
                                <StatValue>{stats.totalGames}</StatValue>
                                <StatLabel>Jogos</StatLabel>
                            </StatCard>
                        </StatCardWrapper>

                        <StatCardWrapper>
                            <StatCard onPress={() => router.push("/competicoes")}>
                                <StatIcon>
                                    <MaterialCommunityIcons name="trophy-outline" size={24} color={colors.primary} />
                                </StatIcon>
                                <StatValue>{stats.totalCompetitions}</StatValue>
                                <StatLabel>Competições</StatLabel>
                            </StatCard>
                        </StatCardWrapper>

                        <StatCardWrapper>
                            <StatCard onPress={() => router.push("/jogadores")}>
                                <StatIcon>
                                    <MaterialCommunityIcons name="account-group-outline" size={24} color={colors.primary} />
                                </StatIcon>
                                <StatValue>{stats.totalPlayers}</StatValue>
                                <StatLabel>Jogadores</StatLabel>
                            </StatCard>
                        </StatCardWrapper>

                        <StatCardWrapper>
                            <StatCard onPress={() => router.push("/comunidades")}>
                                <StatIcon>
                                    <MaterialCommunityIcons name="home-group" size={24} color={colors.primary} />
                                </StatIcon>
                                <StatValue>{stats.totalCommunities}</StatValue>
                                <StatLabel>Comunidades</StatLabel>
                            </StatCard>
                        </StatCardWrapper>
                    </StatisticsContainer>

                    {/* Gráfico de Jogos por Mês */}
                    <ChartContainer>
                        <ChartTitle>Jogos por Mês</ChartTitle>
                        <LineChart
                            data={monthlyGamesData.labels.length > 0 ? monthlyGamesData : {
                                labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
                                datasets: [{ data: [0, 0, 0, 0, 0, 0] }]
                            }}
                            width={Math.max(Dimensions.get("window").width - 80, 0)}
                            height={220}
                            chartConfig={{
                                backgroundColor: colors.backgroundMedium,
                                backgroundGradientFrom: colors.backgroundMedium,
                                backgroundGradientTo: colors.backgroundMedium,
                                decimalPlaces: 0,
                                color: (opacity = 1) => colors.primary,
                                labelColor: (opacity = 1) => colors.textSecondary,
                                style: {
                                    borderRadius: 16
                                },
                                propsForDots: {
                                    r: 6,
                                    strokeWidth: 2,
                                    stroke: colors.primary
                                }
                            }}
                            bezier
                            style={{
                                marginVertical: 8,
                                borderRadius: 16
                            }}
                        />
                    </ChartContainer>

                    {/* Top Jogadores */}
                    <SectionContainer>
                        <SectionHeader>
                            <SectionTitle>Top Jogadores</SectionTitle>
                            <SeeAllButton onPress={() => router.push('/(pages)/top-jogadores')}>
                                <SeeAllButtonText>Ver todas</SeeAllButtonText>
                            </SeeAllButton>
                        </SectionHeader>

                        {topPlayers.length === 0 ? (
                            <View style={{
                                backgroundColor: colors.backgroundMedium,
                                padding: 20,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: `${colors.tertiary}40`,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 12
                            }}>
                                <MaterialCommunityIcons 
                                    name="information-outline" 
                                    size={32} 
                                    color={colors.textSecondary}
                                    style={{ marginBottom: 8 }}
                                />
                                <Text style={{
                                    color: colors.textSecondary,
                                    textAlign: 'center',
                                    fontSize: 14
                                }}>
                                    Nenhum jogo registrado ainda. Comece a jogar para ver as estatísticas dos jogadores!
                                </Text>
                            </View>
                        ) : (
                            topPlayers.map((player, index) => (
                                <PlayerCard key={player.id} onPress={() => router.push(`/(pages)/jogador/jogador/${player.id}/jogos`)}>
                                    <MaterialCommunityIcons 
                                        name={index === 0 ? "crown" : "star"} 
                                        size={24} 
                                        color={index === 0 ? "#FFD700" : colors.textSecondary} 
                                    />
                                    <PlayerAvatar 
                                        avatarUrl={player.avatar_url} 
                                        name={player.name} 
                                        size={40} 
                                    />
                                    <PlayerInfo>
                                        <PlayerName>{player.name}</PlayerName>
                                        <PlayerStats>
                                            {player.wins} vitória{player.wins !== 1 ? 's' : ''} • {player.buchudas} buchuda{player.buchudas !== 1 ? 's' : ''} • {player.winRate.toFixed(2)}% aproveitamento
                                        </PlayerStats>
                                    </PlayerInfo>
                                </PlayerCard>
                            ))
                        )}
                    </SectionContainer>

                    {/* Top Duplas */}
                    <SectionContainer>
                        <SectionHeader>
                            <SectionTitle>Top Duplas</SectionTitle>
                            <SeeAllButton onPress={() => router.push('/(pages)/top-duplas')}>
                                <SeeAllButtonText>Ver todas</SeeAllButtonText>
                            </SeeAllButton>
                        </SectionHeader>

                        {topPairs.length === 0 ? (
                            <View style={{
                                backgroundColor: colors.backgroundMedium,
                                padding: 20,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: `${colors.tertiary}40`,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 12
                            }}>
                                <MaterialCommunityIcons 
                                    name="account-multiple-remove" 
                                    size={32} 
                                    color={colors.textSecondary}
                                    style={{ marginBottom: 8 }}
                                />
                                <Text style={{
                                    color: colors.textSecondary,
                                    textAlign: 'center',
                                    fontSize: 14
                                }}>
                                    Nenhuma dupla registrada ainda. Crie jogos em dupla para ver as estatísticas!
                                </Text>
                            </View>
                        ) : (
                            topPairs.map((pair, index) => (
                                <PlayerCard key={pair.id}>
                                    <MaterialCommunityIcons 
                                        name={index === 0 ? "crown" : "account-multiple"} 
                                        size={24} 
                                        color={index === 0 ? "#FFD700" : colors.textSecondary} 
                                    />
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                                        <PlayerAvatar 
                                            avatarUrl={pair.player1.avatar_url} 
                                            name={pair.player1.name} 
                                            size={32} 
                                        />
                                        <PlayerAvatar 
                                            avatarUrl={pair.player2.avatar_url} 
                                            name={pair.player2.name} 
                                            size={32}
                                            style={{ marginLeft: -8 }}
                                        />
                                    </View>
                                    <PlayerInfo>
                                        <PlayerName>{pair.player1.name} & {pair.player2.name}</PlayerName>
                                        <PlayerStats>
                                            {pair.wins} vitória{pair.wins !== 1 ? 's' : ''} • {pair.buchudas} buchuda{pair.buchudas !== 1 ? 's' : ''} • {pair.winRate.toFixed(2)}% aproveitamento
                                        </PlayerStats>
                                    </PlayerInfo>
                                </PlayerCard>
                            ))
                        )}
                    </SectionContainer>

                    {/* Atividades Recentes */}
                    <SectionContainer>
                        <SectionHeader>
                            <SectionTitle>Atividades Recentes</SectionTitle>
                        </SectionHeader>

                        {recentActivities.length === 0 ? (
                            <View style={{
                                backgroundColor: colors.backgroundMedium,
                                padding: 20,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: `${colors.tertiary}40`,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 12
                            }}>
                                <MaterialCommunityIcons 
                                    name="clock-outline" 
                                    size={32} 
                                    color={colors.textSecondary}
                                    style={{ marginBottom: 8 }}
                                />
                                <Text style={{
                                    color: colors.textSecondary,
                                    textAlign: 'center',
                                    fontSize: 14
                                }}>
                                    Nenhuma atividade recente encontrada.
                                </Text>
                            </View>
                        ) : (
                            recentActivities.slice(0, 5).map((activity) => (
                                <ActivityCard key={activity.id}>
                                    <MaterialCommunityIcons 
                                        name={
                                            activity.type === 'game' ? 'cards-playing-outline' :
                                            activity.type === 'competition' ? 'trophy-outline' :
                                            activity.type === 'player' ? 'account-outline' :
                                            'home-group'
                                        }
                                        size={24} 
                                        color={colors.primary} 
                                    />
                                    <ActivityInfo>
                                        <ActivityText>{activity.description}</ActivityText>
                                        <ActivityTime>
                                            {format(new Date(activity.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                        </ActivityTime>
                                    </ActivityInfo>
                                </ActivityCard>
                            ))
                        )}
                    </SectionContainer>
                </Content>
            </ScrollContent>
        </Container>
    );
};

export default Dashboard;