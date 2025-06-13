import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { View, Alert, ActivityIndicator } from "react-native";
import styled from "styled-components/native";
import { Feather } from '@expo/vector-icons';

// Importações da core
import { InternalHeader } from "@/core/components/navigation";
import { PageTransition } from "@/core/components/transitions";
import { FloatingButton } from "@/core/components/ui";
import { formatDate } from "@/core/utils/date";
import { ThemeProps } from "@/core/types/theme";

// Importações de features
import { Competition, Game } from "@/core/types/database.types";
import { competitionService } from "@/features/competitions/services";
import { gameService } from "@/features/games/services";
import { CompetitionDetailsCard } from "@/features/competitions/components";
import { GameItem } from "@/features/games/components";
import { supabase } from "@/core/lib/supabase";
import { useAuth } from "@/features/auth/hooks";

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }: ThemeProps) => theme.colors.backgroundDark};
`;

const Content = styled.ScrollView`
  flex: 1;
  padding: 20px;
`;

const SectionTitle = styled.Text`
  color: ${({ theme }: ThemeProps) => theme.colors.text};
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 12px;
  margin-top: 8px;
`;

const EmptyGames = styled.View`
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const EmptyText = styled.Text`
  color: ${({ theme }: ThemeProps) => theme.colors.textSecondary};
  font-size: 16px;
  text-align: center;
  margin-top: 8px;
`;

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

export default function CompetitionDetailsPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canDeleteGames, setCanDeleteGames] = useState(false);
  
  const handleBack = () => {
    router.back();
  };

  const fetchData = async () => {
    try {
      if (!id) {
        setError('ID da competição não fornecido');
        return;
      }

      setLoading(true);
      
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

      // Verificar se o usuário é criador da comunidade
      if (user) {
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

  useEffect(() => {
    fetchData();
  }, [id, user]);

  const handleDeleteGame = async (gameId: string) => {
    try {
      await gameService.deleteGame(gameId);
      // Atualiza a lista de jogos após deletar
      setGames(games.filter(game => game.id !== gameId));
      Alert.alert("Sucesso", "Jogo removido com sucesso");
    } catch (error) {
      console.error("Erro ao deletar jogo:", error);
      Alert.alert("Erro", "Não foi possível remover o jogo");
    }
  };

  const handleAddGame = () => {
    if (competition) {
      router.push({
        pathname: '/jogos/novo',
        params: { competition_id: competition.id }
      });
    }
  };

  if (loading) {
    return (
      <Container>
        <InternalHeader title="Competição" onBack={handleBack} />
        <LoadingContainer>
          <ActivityIndicator size="large" color="#6366f1" />
        </LoadingContainer>
      </Container>
    );
  }

  if (error || !competition) {
    return (
      <Container>
        <InternalHeader title="Competição" onBack={handleBack} />
        <Content>
          <EmptyText>{error || "Não foi possível carregar a competição"}</EmptyText>
        </Content>
      </Container>
    );
  }

  return (
    <PageTransition>
      <Container>
        <InternalHeader 
          title="Detalhes da Competição" 
          onBack={handleBack} 
        />
        <Content>
          <CompetitionDetailsCard competition={competition} />
          
          <SectionTitle>Jogos</SectionTitle>
          {games.length === 0 ? (
            <EmptyGames>
              <Feather name="info" size={24} color="#9ca3af" />
              <EmptyText>Nenhum jogo registrado nesta competição</EmptyText>
            </EmptyGames>
          ) : (
            games.map(game => (
              <GameItem 
                key={game.id} 
                game={game} 
                canDelete={canDeleteGames} 
                onDelete={() => handleDeleteGame(game.id)}
                onPress={() => router.push(`/jogos/${game.id}`)}
              />
            ))
          )}
        </Content>

        {canDeleteGames && (
          <FloatingButton 
            icon="plus" 
            position={{ right: 20, bottom: 20 }}
            onPress={handleAddGame}
          />
        )}
      </Container>
    </PageTransition>
  );
}
