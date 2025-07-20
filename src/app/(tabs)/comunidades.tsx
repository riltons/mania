import React, { useState, useCallback, useEffect } from 'react';
import { Alert, Modal as RNModal, ActivityIndicator, Pressable, View, ScrollView, RefreshControl, Text, Switch } from 'react-native';
import styled from 'styled-components/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Community, communityService } from '@/features/communities/services/communityService';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Header } from '@/core/components/layout/Header';
import { useTheme } from '@/core/contexts/ThemeProvider';

interface ThemeProps {
    theme: { colors: any };
}

const Container = styled.View<ThemeProps>`
    flex: 1;
    background-color: ${({ theme }: ThemeProps) => theme.colors.backgroundDark};
`;

const ScrollContent = styled.ScrollView.attrs({
    contentContainerStyle: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 80,
    },
})`
    flex: 1;
`;

const CommunityCard = styled(Pressable)<ThemeProps>`
    background-color: ${({ theme }: ThemeProps) => theme.colors.secondary};
    border-radius: 8px;
    margin-bottom: 16px;
    padding: 16px;
`;

const CommunityHeader = styled.View`
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
`;

const CommunityInfo = styled.View`
    flex: 1;
    margin-right: 12px;
`;

const CommunityTitle = styled.Text<ThemeProps>`
    color: ${({ theme }: ThemeProps) => theme.colors.textPrimary};
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 4px;
`;

const CommunityDescription = styled.Text<ThemeProps>`
    color: ${({ theme }: ThemeProps) => theme.colors.textSecondary};
    font-size: 14px;
    margin-bottom: 8px;
`;

const CommunityStats = styled.View`
    flex-direction: row;
    align-items: center;
    margin-top: 8px;
`;

const StatContainer = styled.View`
    flex-direction: row;
    align-items: center;
    margin-right: 16px;
`;

const StatText = styled.Text<ThemeProps>`
    color: ${({ theme }: ThemeProps) => theme.colors.textTertiary};
    font-size: 14px;
    margin-left: 4px;
`;

const EmptyContainer = styled.View`
    flex: 1;
    align-items: center;
    justify-content: center;
    padding: 20px;
`;

const EmptyText = styled.Text<ThemeProps>`
    color: ${({ theme }: ThemeProps) => theme.colors.textSecondary};
    font-size: 16px;
    text-align: center;
    margin-top: 12px;
`;

const LoadingContainer = styled.View`
    flex: 1;
    align-items: center;
    justify-content: center;
`;

const FloatingButton = styled(Pressable)<ThemeProps>`
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    border-radius: 28px;
    background-color: ${({ theme }: ThemeProps) => theme.colors.accent};
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.Text<ThemeProps>`
    font-size: 20px;
    font-weight: bold;
    color: ${({ theme }: ThemeProps) => theme.colors.textPrimary};
    margin: 16px 0;
`;

const SectionContainer = styled.View`
    margin-bottom: 24px;
`;

export default function Comunidades() {
    const [createdCommunities, setCreatedCommunities] = useState<Community[]>([]);
    const [organizedCommunities, setOrganizedCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showDisabled, setShowDisabled] = useState(false);
    const router = useRouter();
    const { theme, colors } = useTheme();

    const loadCommunities = useCallback(async () => {
        try {
            const { created, organized } = await communityService.list(showDisabled);
            setCreatedCommunities(created || []);
            setOrganizedCommunities(organized || []);
        } catch (error) {
            console.error('Erro ao carregar comunidades:', error);
            Alert.alert('Erro', 'Não foi possível carregar as comunidades');
            setCreatedCommunities([]);
            setOrganizedCommunities([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [showDisabled]);

    useFocusEffect(
        useCallback(() => {
            loadCommunities();
        }, [loadCommunities])
    );

    useEffect(() => {
        loadCommunities();
    }, [showDisabled]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadCommunities();
    };

    const renderCommunityCard = (community: Community) => (
        <CommunityCard
            key={community.id}
            onPress={() => router.push(`/comunidade/${community.id}`)}
            style={{ opacity: community.disabled ? 0.5 : 1 }}
        >
            <CommunityHeader>
                <CommunityInfo>
                    <CommunityTitle>{community.name}</CommunityTitle>
                    {community.description && (
                        <CommunityDescription>{community.description}</CommunityDescription>
                    )}
                    {community.disabled && (
                        <Text style={{ color: colors.accent, fontSize: 12, fontWeight: 'bold', marginTop: 4 }}>
                            DESABILITADA
                        </Text>
                    )}
                </CommunityInfo>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable 
                        onPress={() => router.push(`/comunidade/${community.id}/editar`)}
                        style={{ padding: 8, marginRight: 4 }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <MaterialCommunityIcons name="pencil" size={20} color={colors.textPrimary} />
                    </Pressable>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
                </View>
            </CommunityHeader>
            
            <CommunityStats>
                <StatContainer>
                    <MaterialCommunityIcons name="account-group" size={20} color={colors.textTertiary} />
                    <StatText>{community.members_count || 0} membros</StatText>
                </StatContainer>
                <StatContainer>
                    <MaterialCommunityIcons name="trophy" size={20} color={colors.textTertiary} />
                    <StatText>{community.competitions_count || 0} competições</StatText>
                </StatContainer>
            </CommunityStats>
        </CommunityCard>
    );

    if (loading) {
        return (
            <Container>
                <Header title="Comunidades" />
                <LoadingContainer>
                    <ActivityIndicator size="large" color={colors.accent} />
                </LoadingContainer>
            </Container>
        );
    }

    const hasNoCommunities = createdCommunities.length === 0 && organizedCommunities.length === 0;

    return (
        <Container>
            <Header title="Comunidades" />
            <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 20, marginBottom: 8 }}>
                <Text style={{ color: colors.textPrimary, marginRight: 8 }}>Mostrar desabilitadas</Text>
                <Switch
                    value={showDisabled}
                    onValueChange={setShowDisabled}
                    trackColor={{ false: colors.textSecondary, true: colors.accent }}
                    thumbColor={showDisabled ? colors.backgroundLight : colors.backgroundLight}
                />
            </View>
            <ScrollContent
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[colors.accent]}
                    />
                }
            >
                {hasNoCommunities ? (
                    <EmptyContainer>
                        <MaterialCommunityIcons name="account-group" size={48} color={colors.textSecondary} />
                        <EmptyText>Nenhuma comunidade encontrada</EmptyText>
                    </EmptyContainer>
                ) : (
                    <>
                        <SectionContainer>
                            <SectionTitle>Minhas Comunidades</SectionTitle>
                            {createdCommunities.length === 0 ? (
                                <EmptyText>Você ainda não criou nenhuma comunidade</EmptyText>
                            ) : (
                                createdCommunities.map(renderCommunityCard)
                            )}
                        </SectionContainer>

                        {organizedCommunities.length > 0 && (
                            <SectionContainer>
                                <SectionTitle>Comunidades que Organizo</SectionTitle>
                                {organizedCommunities.map(renderCommunityCard)}
                            </SectionContainer>
                        )}
                    </>
                )}
            </ScrollContent>

            <FloatingButton
                onPress={() => router.push('/comunidade/nova')}
            >
                <MaterialCommunityIcons name="plus" size={24} color={colors.backgroundLight} />
            </FloatingButton>
        </Container>
    );
}