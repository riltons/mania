import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';

// Import de serviços da nova estrutura
import { supabase } from '@/core/lib/supabase';
import { competitionService } from '@/features/competitions/services';
import { gameService } from '@/features/games/services';
import { InternalHeader } from '@/core/components/layout';
import { Button } from '@/core/components/ui';
import { AlertModal, CustomModal } from '@/core/components/feedback';
import { PlayersList } from '@/core/components/data-display';

// Tipagem adequada
interface ThemeProps {
  theme: {
    colors: {
      background: string;
      text: string;
      primary: string;
      secondary: string;
      danger: string;
      warning: string;
      textPrimary: string;
      textSecondary: string;
    }
  }
}

// Exemplo adaptado da página de competição
export default function CompetitionPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [competition, setCompetition] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [canDeleteGames, setCanDeleteGames] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (!id) {
          throw new Error('ID da competição não encontrado');
        }

        // Usando serviço da feature de competições
        const competitionData = await competitionService.getById(id);
        setCompetition(competitionData);

        if (competitionData?.community_id) {
          const { data: community, error: communityError } = await supabase
            .from('communities')
            .select('created_by')
            .eq('id', competitionData.community_id)
            .single();
          
          // Verificando permissões para deleção de jogos
          const { data: { user } } = await supabase.auth.getUser();
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

  // Usando serviço da feature de jogos
  const handleDeleteGame = async (gameId: string, gameStatus: string) => {
    try {
      await gameService.delete(gameId);
      // Atualiza a lista de jogos após deleção
      setGames(games.filter(game => game.id !== gameId));
      Alert.alert('Sucesso', 'Jogo excluído com sucesso');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível excluir o jogo');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <InternalHeader title="Carregando..." />
        <ActivityIndicator size="large" color="#8257E5" />
      </View>
    );
  }

  if (error || !competition) {
    return (
      <View style={styles.container}>
        <InternalHeader title="Erro" />
        <Text style={styles.errorText}>{error || 'Competição não encontrada'}</Text>
        <Button title="Tentar novamente" onPress={() => {}} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <InternalHeader title={competition.name || 'Competição'} />
      
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Detalhes da Competição</Text>
        <Text style={styles.description}>{competition.description || 'Sem descrição'}</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Jogos</Text>
          {games.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum jogo registrado.</Text>
          ) : (
            games.map((game) => (
              <View key={game.id} style={styles.gameCard}>
                <Text style={styles.gameText}>
                  {game.team1_players.map((p: any) => p.name).join(' e ')} 
                  {' '} {game.team1_score} x {game.team2_score} {' '}
                  {game.team2_players.map((p: any) => p.name).join(' e ')}
                </Text>
                
                {canDeleteGames && game.status !== 'finished' && (
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteGame(game.id, game.status)}
                  >
                    <Feather name="trash-2" size={20} color="#FF3333" />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f1f1f',
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    color: '#4f4f4f',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1f1f1f',
  },
  gameCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  gameText: {
    fontSize: 16,
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3333',
    textAlign: 'center',
    margin: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#4f4f4f',
    marginVertical: 20,
  },
});
