import React, { useEffect, useState } from "react";
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

    const loadStatistics = async () => {
        try {
            setRefreshing(true);
            console.log('[Dashboard] Carregando estatísticas...');
            
            if (!isAuthenticated || !user?.id) {
                console.log('[Dashboard] Usuário não está autenticado');
                setRefreshing(false);
                return;
            }
            
            const userStats = await statisticsService.getUserStats();
            setStats(userStats);
            
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
                </Content>
            </ScrollContent>
        </Container>
    );
};

export default Dashboard;