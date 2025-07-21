import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import styled from 'styled-components/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { InternalHeader } from '@/core/components/navigation';
import { ThemeProps } from '@/core/types/theme';
import { Competition } from '@/core/types/database.types';
import { competitionService } from '@/features/competitions/services';
import { communityService } from '@/features/communities/services';
import { CompetitionCard } from '@/features/competitions/components';
import { CreateCompetitionModal } from '@/features/competitions/components';
import { EditCompetitionModal } from '@/features/competitions/components';
import { FloatingButton } from '@/core/components/ui';
import { useAuth } from '@/features/auth/contexts/AuthProvider';
import { useFocusEffect } from '@react-navigation/native';

const Container = styled(View)<ThemeProps>`
  flex: 1;
  background-color: ${({ theme }: ThemeProps) => theme.colors.backgroundDark};
`;

const ScrollContent = styled(ScrollView)<ThemeProps>`
  flex: 1;
  padding: 20px;
  padding-bottom: 80px;
`;

const SectionTitle = styled(Text)<ThemeProps>`
  font-size: 18px;
  font-weight: bold;
  color: ${({ theme }: ThemeProps) => theme.colors.textPrimary};
  margin-bottom: 16px;
`;

const EmptyStateContainer = styled(View)`
  align-items: center;
  justify-content: center;
  padding: 40px 0;
`;

const EmptyStateText = styled(Text)<ThemeProps>`
  font-size: 16px;
  color: ${({ theme }: ThemeProps) => theme.colors.textSecondary};
  text-align: center;
  margin-top: 16px;
`;

export default function Competicoes() {
  const [competitions, setCompetitions] = useState<{
    created: Competition[],
    organized: Competition[]
  }>({ created: [], organized: [] });
  
  const [competitionStats, setCompetitionStats] = useState<{[key: string]: { 
    totalPlayers: number, 
    totalGames: number,
    hasFinishedGames: boolean,
    hasOnlyPendingOrInProgress: boolean
  }}>({});
  
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  // Carrega as competições quando a tela é montada
  useEffect(() => {
    if (isAuthenticated) {
      loadCompetitions();
    }
  }, [isAuthenticated]);
  
  // Recarrega as competições quando a tela recebe foco
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        console.log('Competicoes: Tela recebeu foco, recarregando competições...');
        loadCompetitions();
      }
      return () => {};
    }, [isAuthenticated])
  );

  const loadCompetitions = async () => {
    try {
      console.log('Competicoes: Iniciando carregamento de competições...');
      setLoading(true);
      
      // Verifica se o usuário está autenticado
      if (!isAuthenticated || !user) {
        console.log('Competicoes: Usuário não autenticado, não é possível carregar competições');
        return;
      }
      
      console.log('Competicoes: Buscando competições do usuário...');
      const comps = await competitionService.listMyCompetitions();
      console.log(`Competicoes: Encontradas ${comps.created.length} competições criadas e ${comps.organized.length} organizadas`);
      
      // Busca estatísticas para cada competição
      const stats: {[key: string]: { 
        totalPlayers: number, 
        totalGames: number,
        hasFinishedGames: boolean,
        hasOnlyPendingOrInProgress: boolean
      }} = {};
      
      const allCompetitions = [...comps.created, ...comps.organized];
      
      // Se não houver competições, não precisa buscar estatísticas
      if (allCompetitions.length > 0) {
        console.log(`Competicoes: Buscando estatísticas para ${allCompetitions.length} competições...`);
        
        for (const comp of allCompetitions) {
          try {
            // Implementação temporária de getCompetitionStats caso não exista no serviço
            let compStats;
            if (typeof competitionService.getCompetitionStats === 'function') {
              compStats = await competitionService.getCompetitionStats(comp.id);
            } else {
              // Estatísticas padrão caso o método não exista
              compStats = {
                totalPlayers: 0,
                totalGames: 0,
                hasFinishedGames: false,
                hasOnlyPendingOrInProgress: true
              };
            }
            stats[comp.id] = compStats;
          } catch (statsError) {
            console.error(`Erro ao buscar estatísticas para competição ${comp.id}:`, statsError);
            // Usa estatísticas padrão em caso de erro
            stats[comp.id] = {
              totalPlayers: 0,
              totalGames: 0,
              hasFinishedGames: false,
              hasOnlyPendingOrInProgress: true
            };
          }
        }
      }
      
      setCompetitions(comps);
      setCompetitionStats(stats);
      console.log('Competicoes: Carregamento concluído com sucesso');
    } catch (error) {
      console.error('Erro ao carregar competições:', error);
      Alert.alert('Erro', 'Não foi possível carregar as competições. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompetitionPress = (competition: Competition) => {
    router.push(`/(pages)/competicoes/${competition.id}`);
  };

  const handleEditCompetition = (competition: Competition) => {
    setEditingCompetition(competition);
    setEditModalVisible(true);
  };

  const handleCompetitionUpdate = async () => {
    setEditModalVisible(false);
    await loadCompetitions();
  };

  const handleDeleteCompetition = async (competitionId: string) => {
    const stats = competitionStats[competitionId];
    
    // Se tem jogos finalizados, apenas inativa
    if (stats?.hasFinishedGames) {
      Alert.alert(
        'Inativar Competição',
        'Esta competição possui jogos finalizados e só pode ser inativada para preservar o histórico. Deseja inativar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Inativar', 
            style: 'destructive',
            onPress: async () => {
              try {
                await competitionService.toggleActive(competitionId, false);
                loadCompetitions();
              } catch (error) {
                console.error('Erro ao inativar competição:', error);
                Alert.alert('Erro', 'Não foi possível inativar a competição.');
              }
            }
          }
        ]
      );
    } else {
      // Se não tem jogos finalizados, permite exclusão
      Alert.alert(
        'Excluir Competição',
        'Tem certeza que deseja excluir esta competição? Esta ação não pode ser desfeita.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Excluir', 
            style: 'destructive',
            onPress: async () => {
              try {
                await competitionService.delete(competitionId);
                loadCompetitions();
              } catch (error) {
                console.error('Erro ao excluir competição:', error);
                Alert.alert('Erro', 'Não foi possível excluir a competição.');
              }
            }
          }
        ]
      );
    }
  };

  const handleCreateCompetition = () => {
    setCreateModalVisible(true);
  };

  const handleCompetitionCreated = () => {
    setCreateModalVisible(false);
    loadCompetitions();
  };

  return (
    <Container>
      <InternalHeader title="Competições" showBackButton={false} />
      
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#8257E5" />
        </View>
      ) : (
        <ScrollContent>
          {competitions.created.length > 0 && (
            <>
              <SectionTitle>Minhas Competições</SectionTitle>
              {competitions.created.map(competition => (
                <CompetitionCard 
                  key={competition.id}
                  competition={competition}
                  stats={competitionStats[competition.id]}
                  onPress={() => handleCompetitionPress(competition)}
                  onEdit={() => handleEditCompetition(competition)}
                  onDelete={() => handleDeleteCompetition(competition.id)}
                />
              ))}
            </>
          )}

          {competitions.organized.length > 0 && (
            <>
              <SectionTitle>Competições da Comunidade</SectionTitle>
              {competitions.organized.map(competition => (
                <CompetitionCard 
                  key={competition.id}
                  competition={competition}
                  stats={competitionStats[competition.id]}
                  onPress={() => handleCompetitionPress(competition)}
                  onEdit={() => handleEditCompetition(competition)}
                  onDelete={() => handleDeleteCompetition(competition.id)}
                />
              ))}
            </>
          )}

          {competitions.created.length === 0 && competitions.organized.length === 0 && (
            <EmptyStateContainer>
              <MaterialCommunityIcons name="trophy-outline" size={64} color="#8257E5" />
              <EmptyStateText>Você ainda não tem competições. Crie uma nova competição para começar!</EmptyStateText>
            </EmptyStateContainer>
          )}
        </ScrollContent>
      )}

      <FloatingButton 
        icon="plus" 
        onPress={handleCreateCompetition}
        accessibilityLabel="Criar nova competição"
      />

      <CreateCompetitionModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCompetitionCreated={handleCompetitionCreated}
      />

      {editingCompetition && (
        <EditCompetitionModal
          visible={editModalVisible}
          competition={editingCompetition}
          onClose={() => setEditModalVisible(false)}
          onCompetitionUpdated={handleCompetitionUpdate}
        />
      )}
    </Container>
  );
}
