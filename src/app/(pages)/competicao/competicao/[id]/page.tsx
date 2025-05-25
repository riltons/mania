import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, ActivityIndicator, StatusBar, Platform, ScrollView, Alert } from "react-native";
import { useEffect, useState } from "react";
import { Competition, Game } from "@/types/database.types";
import { competitionService } from "@/services/competitionService";
import { gameService } from "@/services/gameService";
import { InternalHeader } from "@/components/InternalHeader";
import styled from "styled-components/native";
import { PageTransition } from "@/components/Transitions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTheme } from "styled-components/native";
import { Feather } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";

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
  color: ${({ theme }) => theme.colors.gray100};
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 16px;
`;

const InfoItem = styled.View`
  margin-bottom: 12px;
`;

const InfoLabel = styled.Text`
  color: ${({ theme }) => theme.colors.gray300};
  font-size: 14px;
  margin-bottom: 4px;
`;

const InfoValue = styled.Text`
  color: ${({ theme }) => theme.colors.gray100};
  font-size: 16px;
`;

const GamesList = styled.View`
  margin-top: 20px;
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
  color: ${({ theme }) => theme.colors.gray300};
  font-size: 14px;
`;

const DeleteButton = styled.TouchableOpacity`
  background-color: ${({ theme }) => theme.colors.error};
  padding: 8px;
  border-radius: 6px;
  align-items: center;
  justify-content: center;
  padding: 8px;
`;

const TeamsContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const TeamScore = styled.Text<{ winner: boolean }>`
  font-size: 24px;
  font-weight: bold;
  color: ${props => props.winner ? props.theme.colors.accent : props.theme.colors.textSecondary};
`;

const TeamPlayers = styled.Text`
  color: ${({ theme }) => theme.colors.gray100};
  font-size: 14px;
  text-align: center;
`;

const VsText = styled.Text`
  color: ${({ theme }) => theme.colors.gray300};
  font-size: 14px;
  margin: 0 8px;
`;

const StatusBarCustom = () => {
  const theme = useTheme();
  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(theme.colors.primary);
      StatusBar.setBarStyle('light-content');
      StatusBar.setTranslucent(false);
    }
  }, [theme]);
  
  return <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" translucent={false} />;
};

export default function CompetitionDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canDeleteGames, setCanDeleteGames] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) {
          setError('ID da competição não fornecido');
          return;
        }

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
        const { data: { user } } = await supabase.auth.getUser();
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

    fetchData();
  }, [id]);

  const handleDeleteGame = async (gameId: string, gameStatus: string) => {
    try {
      await gameService.deleteGame(gameId);
      // Atualizar a lista de jogos após a exclusão
      const updatedGames = await gameService.listByCompetition(id as string);
      setGames(updatedGames);
    } catch (err) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Erro ao excluir jogo');
    }
  };

  const showDeleteConfirmation = (gameId: string, gameStatus: string) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir este jogo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => handleDeleteGame(gameId, gameStatus)
        }
      ]
    );
  };

  return (
    <PageTransition>
      <Container>
        <StatusBarCustom />
        <InternalHeader title="Detalhes da Competição" />
        
        <Content>
          {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : error ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: theme.colors.error }}>{error}</Text>
            </View>
          ) : !competition ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: theme.colors.gray300 }}>Competição não encontrada</Text>
            </View>
          ) : (
            <>
              <CompetitionCard>
                <CompetitionName>{competition.name}</CompetitionName>
                
                <InfoItem>
                  <InfoLabel>Descrição</InfoLabel>
                  <InfoValue>{competition.description || 'Sem descrição disponível'}</InfoValue>
                </InfoItem>
                
                <InfoItem>
                  <InfoLabel>Data de Início</InfoLabel>
                  <InfoValue>
                    {format(new Date(competition.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </InfoValue>
                </InfoItem>
                
                <InfoItem>
                  <InfoLabel>Data de Término</InfoLabel>
                  <InfoValue>
                    {format(new Date(competition.end_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </InfoValue>
                </InfoItem>
              </CompetitionCard>

              <GamesList>
                {games.map(game => (
                  <GameCard key={game.id}>
                    <GameHeader>
                      <GameStatus>{game.status === 'pending' ? 'Pendente' : game.status === 'in_progress' ? 'Em andamento' : 'Finalizado'}</GameStatus>
                      {(canDeleteGames || (game.status === 'pending')) && (
                        <DeleteButton onPress={() => showDeleteConfirmation(game.id, game.status)}>
                          <Feather name="trash-2" size={16} color={theme.colors.gray100} />
                        </DeleteButton>
                      )}
                    </GameHeader>
                    <TeamsContainer>
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <TeamScore winner={game.team1_score > game.team2_score}>{game.team1_score}</TeamScore>
                        <TeamPlayers>{game.team1.join(' & ')}</TeamPlayers>
                      </View>
                      <VsText>vs</VsText>
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <TeamScore winner={game.team2_score > game.team1_score}>{game.team2_score}</TeamScore>
                        <TeamPlayers>{game.team2.join(' & ')}</TeamPlayers>
                      </View>
                    </TeamsContainer>
                  </GameCard>
                ))}
              </GamesList>
            </>
          )}
        </Content>
      </Container>
    </PageTransition>
  );
}