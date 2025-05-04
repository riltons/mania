import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { useTheme } from '@/contexts/ThemeProvider';
import { InternalHeader } from '@/components/InternalHeader';
import { activityService, Activity } from '@/services/activityService';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Container = styled.View`
    flex: 1;
    background-color: ${({ theme }) => theme.colors.backgroundDark};
`;

const LoadingContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
`;

const ActivityCard = styled.TouchableOpacity`
    background-color: ${({ theme }) => theme.colors.backgroundLight};
    border-radius: 8px;
    padding: 16px;
    margin: 8px 16px;
`;

const ActivityHeader = styled.View`
    flex-direction: row;
    align-items: center;
    margin-bottom: 12px;
    gap: 8px;
`;

const ActivityType = styled.View<{ type: Activity['type'] }>`
    background-color: ${({ theme, type }) => {
        if (!theme?.colors) return '#8257E5'; // Fallback color
        switch (type) {
            case 'game': return theme.colors.success;
            case 'competition': return theme.colors.primary;
            case 'community': return theme.colors.warning;
            case 'player': return theme.colors.info;
            default: return theme.colors.gray300;
        }
    }};
    padding: 4px 8px;
    border-radius: 4px;
`;

const ActivityTypeText = styled.Text`
    color: ${({ theme }) => theme?.colors?.white || '#FFFFFF'};
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
`;

const ActivityDescription = styled.Text`
    color: ${({ theme }) => theme?.colors?.textPrimary || '#E1E1E6'};
    font-size: 16px;
    line-height: 24px;
    margin-bottom: 8px;
    font-weight: 500;
`;

const ActivityDate = styled.Text`
    color: ${({ theme }) => theme?.colors?.gray300 || '#7C7C8A'};
    font-size: 14px;
`;

const PaginationContainer = styled.View`
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 16px;
    gap: 16px;
    background-color: ${({ theme }) => theme?.colors?.backgroundLight || '#202024'};
`;

const PaginationButton = styled.TouchableOpacity<{ disabled?: boolean }>`
    opacity: ${({ disabled }) => disabled ? 0.5 : 1};
`;

const PaginationText = styled.Text`
    color: ${({ theme }) => theme?.colors?.white || '#FFFFFF'};
    font-size: 14px;
`;

const EmptyContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    padding: 32px;
    background-color: ${({ theme }) => theme?.colors?.backgroundLight || '#202024'};
`;

const EmptyText = styled.Text`
    color: ${({ theme }) => theme?.colors?.gray300 || '#7C7C8A'};
    font-size: 16px;
    text-align: center;
`;

const HeaderSubtitle = styled.Text`
    color: ${({ theme }) => theme?.colors?.gray300 || '#7C7C8A'};
    font-size: 14px;
    text-align: center;
    margin-top: 8px;
    margin-bottom: 16px;
    padding-horizontal: 16px;
`;

const getTypeLabel = (type: Activity['type']) => {
    switch (type) {
        case 'game': return 'JOGO';
        case 'competition': return 'COMPETIÇÃO';
        case 'community': return 'COMUNIDADE';
        case 'player': return 'JOGADOR';
        default: return type.toUpperCase();
    }
};

export default function ActivityList() {
    const router = useRouter();
    const { colors, theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const loadActivities = async (page: number) => {
        try {
            setLoading(true);
            const result = await activityService.getUserActivities(page);
            setActivities(result.activities);
            setTotalPages(result.totalPages);
            setCurrentPage(result.currentPage);
        } catch (error) {
            console.error('Erro ao carregar atividades:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadActivities(1);
    }, []);

    const handleActivityPress = (activity: Activity) => {
        if (!activity.metadata) return;

        switch (activity.type) {
            case 'game':
                router.push(`/jogos/${activity.metadata.id}`);
                break;
            case 'competition':
                router.push(`/competicoes/${activity.metadata.id}`);
                break;
            case 'community':
                router.push(`/comunidades/${activity.metadata.id}`);
                break;
            case 'player':
                router.push(`/jogadores/${activity.metadata.id}`);
                break;
        }
    };

    if (loading) {
        return (
            <Container>
                <InternalHeader title="Atividades Recentes" />
                <LoadingContainer>
                    <ActivityIndicator size="large" color={colors?.primary || '#8257E5'} />
                </LoadingContainer>
            </Container>
        );
    }

    if (!activities.length) {
        return (
            <Container>
                <InternalHeader title="Atividades Recentes" />
                <EmptyContainer>
                    <EmptyText>Nenhuma atividade recente encontrada</EmptyText>
                </EmptyContainer>
            </Container>
        );
    }

    return (
        <Container>
            <InternalHeader title="Atividades Recentes" />
            <HeaderSubtitle>Acompanhe as últimas atividades do seu perfil</HeaderSubtitle>
            <FlatList
                data={activities}
                keyExtractor={(item) => item.id}
                renderItem={({ item: activity }) => (
                    <ActivityCard onPress={() => handleActivityPress(activity)}>
                        <ActivityHeader>
                            <ActivityType type={activity.type}>
                                <ActivityTypeText>{getTypeLabel(activity.type)}</ActivityTypeText>
                            </ActivityType>
                        </ActivityHeader>
                        <ActivityDescription>{activity.description}</ActivityDescription>
                        <ActivityDate>
                            {format(new Date(activity.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </ActivityDate>
                    </ActivityCard>
                )}
            />
            {totalPages > 1 && (
                <PaginationContainer>
                    <PaginationButton
                        disabled={currentPage === 1}
                        onPress={() => loadActivities(currentPage - 1)}
                    >
                        <Feather name="chevron-left" size={24} color={colors?.white || '#FFFFFF'} />
                    </PaginationButton>
                    <PaginationText>{`Página ${currentPage} de ${totalPages}`}</PaginationText>
                    <PaginationButton
                        disabled={currentPage === totalPages}
                        onPress={() => loadActivities(currentPage + 1)}
                    >
                        <Feather name="chevron-right" size={24} color={colors?.white || '#FFFFFF'} />
                    </PaginationButton>
                </PaginationContainer>
            )}
        </Container>
    );
}
