import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import styled from 'styled-components/native';
import { useTheme } from '@/core/contexts/ThemeProvider';
import { colors } from '@/styles/colors';
import { playersService, Player as PlayerType } from '@/features/players/services/playersService';
import { PlayerItem } from '@/components/data-display/PlayerItem';

// Usamos o tipo Player importado do serviço
type Player = PlayerType;

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
                            <PlayerItem 
                                player={item} 
                                onPress={handlePlayerPress} 
                            />
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
                            <PlayerItem 
                                player={item} 
                                onPress={handlePlayerPress} 
                            />
                        )}
                    />
                )}
            </Section>
        </Container>
    );
}

const Container = styled.View`
    flex: 1;
    background-color: ${({ theme }: { theme: any }) => theme.colors.background};
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

