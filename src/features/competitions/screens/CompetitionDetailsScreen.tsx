import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import { competitionService } from "@/features/competitions/services";
import { gameService } from "@/features/games/services";
import { InternalHeader } from "@/core/components/layout/InternalHeader";
import styled from "styled-components/native";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTheme } from "styled-components/native";
import { Feather } from "@expo/vector-icons";
import { supabase } from "@/core/lib/supabase";

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.backgroundDark};
`;

const Content = styled.ScrollView`
  flex: 1;
  padding: 16px;
`;

const SectionTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 16px;
`;

const StatusBadge = styled.View`
  position: absolute;
  top: 16px;
  right: 16px;
  background-color: ${({ theme }) => theme.colors.success};
  padding: 4px 8px;
  border-radius: 4px;
`;

const StatusText = styled.Text`
  color: white;
  font-size: 12px;
  font-weight: bold;
`;

const RankingButton = styled.TouchableOpacity`
  background-color: ${({ theme }) => theme.colors.primary};
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const RankingButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: bold;
  margin-left: 8px;
`;

const GameCard = styled.View`
  background-color: ${({ theme }) => theme.colors.backgroundMedium};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`;

const GameTeamsContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const TeamContainer = styled.View`
  flex: 1;
  align-items: center;
`;

const TeamScore = styled.Text<{ winner: boolean }>`
  font-size: 32px;
  font-weight: bold;
  color: ${({ winner, theme }) => winner ? theme.colors.primary : theme.colors.textPrimary};
`;

const TeamNames = styled.Text`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  text-align: center;
  margin-top: 8px;
`;

const VersusText = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 18px;
  margin: 0 8px;
`;

const GameStatusBadge = styled.View`
  background-color: ${({ theme }) => theme.colors.success};
  padding: 4px 8px;
  border-radius: 4px;
  align-self: center;
  margin-top: 8px;
`;

const ActionButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.backgroundMedium};
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 12px;
`;

const ActionButtonText = styled.Text`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-left: 12px;
`;

interface CompetitionDetailsScreenProps {
  id: string;
}

export default function CompetitionDetailsScreen({ id }: CompetitionDetailsScreenProps) {
  const router = useRouter();
  const [competition, setCompetition] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const theme = useTheme();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) {
          setError('ID da competição não fornecido');
          return;
        }

        console.log('Carregando competição:', id);
        const [competitionData, gamesData] = await Promise.all([
          competitionService.getById(id as string),
          gameService.listByCompetition(id as string)
        ]);
        
        if (!competitionData) {
          setError('Competição não encontrada');
          return;
        }

        setCompetition(competitionData);
        setGames(gamesData || []);
        
        // Carregar estatísticas da competição
        const statsData = await competitionService.getCompetitionStats(id as string);
        setStats(statsData);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError(err instanceof Error ? err.message : 'Falha ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleAddPlayer = () => {
    if (!competition) return;
    router.push(`/competicoes/${competition.id}/adicionar-jogador`);
  };

  const handleCreateGame = () => {
    if (!competition) return;
    router.push(`/competicoes/${competition.id}/novo-jogo`);
  };

  const handleViewGames = () => {
    if (!competition) return;
    router.push(`/competicoes/${competition.id}/jogos`);
  };

  const handleViewPlayers = () => {
    if (!competition) return;
    router.push(`/competicoes/${competition.id}/jogadores`);
  };

  const handleViewRanking = () => {
    if (!competition) return;
    router.push(`/competicoes/${competition.id}/ranking`);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em Andamento';
      case 'finished': return 'Finalizada';
      default: return status;
    }
  };

  const getPlayerNames = (playerIds: string[]) => {
    if (!playerIds || playerIds.length === 0) return '';
    // Aqui você pode implementar a lógica para buscar os nomes dos jogadores
    // Por enquanto, vamos retornar apenas os IDs
    return playerIds.join('\n');
  };

  if (loading) {
    return (
      <Container>
        <InternalHeader title="Carregando..." />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <InternalHeader title="Erro" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: theme.colors.error, marginBottom: 10 }}>{error}</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 10, backgroundColor: theme.colors.primary, borderRadius: 5 }}>
            <Text style={{ color: theme.colors.white }}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </Container>
    );
  }

  const isFinished = competition.status === 'finished';

  return (
    <Container>
      <InternalHeader title={competition?.name || 'Detalhes da Competição'} />
      <Content>
        <View style={{ marginBottom: 16 }}>
          <SectionTitle>Detalhes</SectionTitle>
          {isFinished && (
            <StatusBadge>
              <StatusText>Finalizado</StatusText>
            </StatusBadge>
          )}
        </View>

        {isFinished && (
          <RankingButton onPress={handleViewRanking}>
            <Feather name="award" size={20} color="white" />
            <RankingButtonText>Ver Classificação</RankingButtonText>
          </RankingButton>
        )}

        <SectionTitle>Jogos</SectionTitle>
        
        {games.length === 0 ? (
          <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', marginVertical: 20 }}>
            Nenhum jogo registrado nesta competição.
          </Text>
        ) : (
          games.map((game) => (
            <GameCard key={game.id}>
              <GameTeamsContainer>
                <TeamContainer>
                  <TeamScore winner={game.team1_score > game.team2_score}>
                    {game.team1_score}
                  </TeamScore>
                  <TeamNames>
                    {getPlayerNames(game.team1)}
                  </TeamNames>
                </TeamContainer>
                
                <VersusText>X</VersusText>
                
                <TeamContainer>
                  <TeamScore winner={game.team2_score > game.team1_score}>
                    {game.team2_score}
                  </TeamScore>
                  <TeamNames>
                    {getPlayerNames(game.team2)}
                  </TeamNames>
                </TeamContainer>
              </GameTeamsContainer>
              
              {game.status === 'finished' && (
                <GameStatusBadge>
                  <StatusText>Finalizado</StatusText>
                </GameStatusBadge>
              )}
            </GameCard>
          ))
        )}

        {!isFinished && (
          <>
            <SectionTitle style={{ marginTop: 24 }}>Ações</SectionTitle>
            
            <ActionButton onPress={handleAddPlayer}>
              <Feather name="user-plus" size={24} color={theme.colors.primary} />
              <ActionButtonText>Adicionar Jogador</ActionButtonText>
            </ActionButton>
            
            <ActionButton onPress={handleCreateGame}>
              <Feather name="plus-circle" size={24} color={theme.colors.primary} />
              <ActionButtonText>Novo Jogo</ActionButtonText>
            </ActionButton>
            
            <ActionButton onPress={handleViewGames}>
              <Feather name="list" size={24} color={theme.colors.primary} />
              <ActionButtonText>Ver Jogos</ActionButtonText>
            </ActionButton>
            
            <ActionButton onPress={handleViewPlayers}>
              <Feather name="users" size={24} color={theme.colors.primary} />
              <ActionButtonText>Ver Jogadores</ActionButtonText>
            </ActionButton>
          </>
        )}
      </Content>
    </Container>
  );
}