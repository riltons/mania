import React, { useEffect, useState } from 'react';
import { Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import styled from 'styled-components/native';
import { useTheme } from '@/contexts/ThemeProvider';
import { colors } from '@/styles/colors';
import { playersService } from '@/services/playersService';
import { PlayerAvatar } from '@/components/PlayerAvatar';

type Player = {
    id: string;
    name: string;
    avatar_url: string | null;
    created_by: string;
};

type PlayersListProps = {
    excludeIds?: string[];
    onSelectPlayer?: (playerId: string) => void;
};

export function PlayersList({ excludeIds = [], onSelectPlayer }: PlayersListProps) {
    const router = useRouter();
    const { colors } = useTheme();
    const [myPlayers, setMyPlayers] = useState<Player[]>([]);
    const [communityPlayers, setCommunityPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPlayers();
    }, []);

    const loadPlayers = async () => {
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
        }
    };

    const handlePlayerPress = (playerId: string) => {
        if (onSelectPlayer) {
            onSelectPlayer(playerId);
        } else {
            router.push(`/jogador/jogador/${playerId}/jogos`);
        }
    };

    if (loading) {
        return (
            <LoadingText>Carregando jogadores...</LoadingText>
        );
    }

    return (
        <Container>
            <Section>
                <SectionTitle>Meus Jogadores</SectionTitle>
                {myPlayers.length === 0 ? (
                    <EmptyText>Você ainda não criou nenhum jogador</EmptyText>
                ) : (
                    <PlayerList
                        data={myPlayers}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <PlayerCard onPress={() => handlePlayerPress(item.id)}>
                                <PlayerCardContent>
                                    <PlayerAvatar 
                                        avatarUrl={item.avatar_url} 
                                        name={item.name} 
                                        size={40} 
                                    />
                                    <PlayerName>{item.name}</PlayerName>
                                </PlayerCardContent>
                            </PlayerCard>
                        )}
                    />
                )}
            </Section>

            <Section>
                <SectionTitle>Jogadores das Comunidades</SectionTitle>
                {communityPlayers.length === 0 ? (
                    <EmptyText>Nenhum jogador disponível nas suas comunidades</EmptyText>
                ) : (
                    <PlayerList
                        data={communityPlayers}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <PlayerCard onPress={() => handlePlayerPress(item.id)}>
                                <PlayerCardContent>
                                    <PlayerAvatar 
                                        avatarUrl={item.avatar_url} 
                                        name={item.name} 
                                        size={40} 
                                    />
                                    <PlayerName>{item.name}</PlayerName>
                                </PlayerCardContent>
                            </PlayerCard>
                        )}
                    />
                )}
            </Section>
        </Container>
    );
}

const Container = styled.View`
    flex: 1;
    background-color: ${colors.background};
`;

const Section = styled.View`
    margin-bottom: 24px;
`;

const SectionTitle = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: ${colors.textPrimary};
    margin-bottom: 12px;
`;

const PlayerList = styled.FlatList`
    flex: 1;
`;

const PlayerCard = styled.TouchableOpacity`
    padding: 16px;
    background-color: ${colors.backgroundMedium};
    border-radius: 8px;
    margin-bottom: 8px;
`;

const PlayerCardContent = styled.View`
    flex-direction: row;
    align-items: center;
`;

const PlayerName = styled.Text`
    font-size: 16px;
    color: ${colors.textPrimary};
    margin-left: 12px;
`;

const LoadingText = styled.Text`
    color: ${colors.textPrimary};
    font-size: 16px;
    text-align: center;
    margin-top: 20px;
`;

const EmptyText = styled.Text`
    color: ${colors.textSecondary};
    font-size: 14px;
    text-align: center;
    margin-top: 12px;
`;
