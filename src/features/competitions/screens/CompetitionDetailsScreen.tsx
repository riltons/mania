import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, ActivityIndicator, StatusBar, Platform, ScrollView, Alert, TouchableOpacity } from "react-native";
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

interface CompetitionDetailsScreenProps {
  id: string;
}

export default function CompetitionDetailsScreen({ id }: CompetitionDetailsScreenProps) {
  const router = useRouter();
  const [competition, setCompetition] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canDeleteGames, setCanDeleteGames] = useState(false);
  const [playerNames, setPlayerNames] = useState<{[key: string]: string}>({});
  const theme = useTheme();
  
  // Função para voltar à tela anterior
  const handleBack = () => {
    router.back();
  };

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

        // Coletar todos os IDs de jogadores para buscar seus nomes
        const playerIds = new Set<string>();
        gamesData?.forEach(game => {
          game.team1?.forEach((playerId: string) => playerIds.add(playerId));
          game.team2?.forEach((playerId: string) => playerIds.add(playerId));
        });
        
        // Buscar nomes de todos os jogadores
        if (playerIds.size > 0) {
          const { data: playersData } = await supabase
            .from('players')
            .select('id, name')
            .in('id', Array.from(playerIds));
          
          if (playersData) {
            const namesMap: {[key: string]: string} = {};
            playersData.forEach(player => {
              namesMap[player.id] = player.name;
            });
            setPlayerNames(namesMap);
          }
        }

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

  // Função para formatar os nomes dos jogadores de um time
  const formatTeamNames = (teamIds: string[]) => {
    if (!teamIds || teamIds.length === 0) return 'Time';
    
    return teamIds
      .map(id => playerNames[id] || 'Jogador')
      .join(' / ');
  };

  if (loading) {
    return (
      <Container>
        <StatusBarCustom />
        <InternalHeader 
          title="Carregando..." 
        />
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ flex: 1, justifyContent: 'center' }} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <StatusBarCustom />
        <InternalHeader 
          title="Erro" 
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: theme.colors.error, marginBottom: 10 }}>{error}</Text>
          <TouchableOpacity onPress={handleBack} style={{ padding: 10, backgroundColor: theme.colors.primary, borderRadius: 5 }}>
            <Text style={{ color: theme.colors.white }}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <StatusBarCustom />
      <InternalHeader 
        title={competition?.name || 'Detalhes da Competição'} 
      />
      <Content>
        <CompetitionCard>
          <CompetitionName>{competition.name}</CompetitionName>
          
          <InfoItem>
            <InfoLabel>Descrição</InfoLabel>
            <InfoValue>{competition.description || 'Sem descrição disponível'}</InfoValue>
          </InfoItem>
          
          {competition.start_date && (
            <InfoItem>
              <InfoLabel>Data de Início</InfoLabel>
              <InfoValue>
                {format(new Date(competition.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </InfoValue>
            </InfoItem>
          )}
          
          {competition.end_date && (
            <InfoItem>
              <InfoLabel>Data de Término</InfoLabel>
              <InfoValue>
                {format(new Date(competition.end_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </InfoValue>
            </InfoItem>
          )}
        </CompetitionCard>

        <GamesSectionTitle>Jogos da Competição</GamesSectionTitle>
        <GamesCount>{games.length} {games.length === 1 ? 'jogo registrado' : 'jogos registrados'}</GamesCount>
        
        <GamesList>
          {games.length > 0 ? (
            games.map((game) => (
              <GameCard key={game.id}>
                <GameHeader>
                  <GameStatus>
                    {game.status === 'finished' ? 'Finalizado' : 'Em andamento'}
                  </GameStatus>
                  {canDeleteGames && (
                    <DeleteButton onPress={() => showDeleteConfirmation(game.id, game.status)}>
                      <Feather name="trash-2" size={16} color={theme.colors.white} />
                    </DeleteButton>
                  )}
                </GameHeader>
                
                <TeamsContainer>
                  <View style={{ alignItems: 'center' }}>
                    <TeamScore winner={game.team1_score > game.team2_score}>
                      {game.team1_score}
                    </TeamScore>
                    <TeamPlayers>
                      {formatTeamNames(game.team1)}
                    </TeamPlayers>
                  </View>
                  
                  <VsText>VS</VsText>
                  
                  <View style={{ alignItems: 'center' }}>
                    <TeamScore winner={game.team2_score > game.team1_score}>
                      {game.team2_score}
                    </TeamScore>
                    <TeamPlayers>
                      {formatTeamNames(game.team2)}
                    </TeamPlayers>
                  </View>
                </TeamsContainer>
              </GameCard>
            ))
          ) : (
            <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', marginTop: 20 }}>
              Nenhum jogo encontrado para esta competição.
            </Text>
          )}
        </GamesList>
      </Content>
    </Container>
  );
}