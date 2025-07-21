import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, ActivityIndicator, StatusBar, Platform, ScrollView, Alert, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import { competitionService } from "@/features/competitions/services";
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
  padding: 20px;
`;

const CompetitionCard = styled.View`
  background-color: ${({ theme }) => theme.colors.backgroundMedium};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
`;

const CompetitionName = styled.Text`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 16px;
`;

const InfoItem = styled.View`
  margin-bottom: 12px;
`;

const InfoLabel = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  margin-bottom: 4px;
`;

const InfoValue = styled.Text`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 16px;
`;

const GamesSectionTitle = styled.Text`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 20px;
  font-weight: bold;
  margin-top: 24px;
  margin-bottom: 16px;
`;

const GamesCount = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  margin-bottom: 12px;
`;

const GamesList = styled.View`
  margin-top: 8px;
`;

const GameCard = styled.View`
  background-color: ${({ theme }) => theme.colors.backgroundMedium};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
`;

const GameHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const GameStatus = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
`;

const DeleteButton = styled.TouchableOpacity`
  background-color: ${({ theme }) => theme.colors.error};
  padding: 4px;
  border-radius: 4px;
`;

const TeamsContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

interface TeamScoreProps {
  winner: boolean;
}

const TeamScore = styled.Text<TeamScoreProps>`
  font-size: 24px;
  font-weight: bold;
  color: ${props => props.winner ? props.theme.colors.primary : props.theme.colors.textSecondary};
`;

const TeamPlayers = styled.Text`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  text-align: center;
  margin-top: 4px;
`;

const VsText = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 16px;
  font-weight: bold;
  margin: 0 8px;
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

export default function CompetitionDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [competition, setCompetition] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canDeleteGames, setCanDeleteGames] = useState(false);
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
        const competitionData = await competitionService.getById(id as string);
        
        if (!competitionData) {
          setError('Competição não encontrada');
          return;
        }

        setCompetition(competitionData);
        
        // Carregar estatísticas da competição
        const statsData = await competitionService.getCompetitionStats(id as string);
        setStats(statsData);

        // Verificar se o usuário é criador da comunidade
        const { data: { user } } = await supabase.auth.getUser();
        if (user && competitionData.community_id) {
          const { data: community } = await supabase
            .from('communities')
            .select('created_by')
            .eq('id', competitionData.community_id)
            .single();
          
          setCanDeleteGames(community?.created_by === user.id);
        }
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

  return (
    <Container>
      <InternalHeader title={competition?.name || 'Detalhes da Competição'} />
      <Content>
        <CompetitionCard>
          <CompetitionName>{competition.name}</CompetitionName>
          
          <InfoItem>
            <InfoLabel>Status</InfoLabel>
            <InfoValue>{getStatusText(competition.status)}</InfoValue>
          </InfoItem>
          
          <InfoItem>
            <InfoLabel>Descrição</InfoLabel>
            <InfoValue>{competition.description || 'Sem descrição disponível'}</InfoValue>
          </InfoItem>
          
          <InfoItem>
            <InfoLabel>Data de Criação</InfoLabel>
            <InfoValue>
              {format(new Date(competition.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </InfoValue>
          </InfoItem>
          
          {competition.start_date && (
            <InfoItem>
              <InfoLabel>Data de Início</InfoLabel>
              <InfoValue>
                {format(new Date(competition.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </InfoValue>
            </InfoItem>
          )}
          
          {stats && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.primary }}>{stats.totalPlayers || 0}</Text>
                <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>Jogadores</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.primary }}>{stats.totalGames || 0}</Text>
                <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>Jogos</Text>
              </View>
            </View>
          )}
        </CompetitionCard>

        <GamesSectionTitle>Ações</GamesSectionTitle>
        
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
        
        <ActionButton onPress={handleViewRanking}>
          <Feather name="award" size={24} color={theme.colors.primary} />
          <ActionButtonText>Ver Ranking</ActionButtonText>
        </ActionButton>
      </Content>
    </Container>
  );
}