import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import styled from 'styled-components/native';
import { Feather } from '@expo/vector-icons';

// Importações usando a nova estrutura de arquitetura
import { Competition } from '@/core/types';
import { competitionService } from '@/features/competitions/services';
import { CompetitionCard } from '@/features/competitions/components';
import { useAuth } from '@/features/auth/hooks';
import { FloatingButton } from '@/core/components/ui';
import { formatDateBR, formatDateWithTime } from '@/core/utils';
import { PageTransition } from '@/core/components/transitions';

// Interfaces para tipagem correta
interface ThemeProps {
  theme: {
    colors: {
      backgroundDark: string;
      text: string;
      textSecondary: string;
    }
  }
}

// Componentes estilizados
const Container = styled.View`
  flex: 1;
  background-color: ${(props: ThemeProps) => props.theme.colors.backgroundDark};
`;

const Content = styled.View`
  flex: 1;
  padding: 16px;
`;

const HeaderTitle = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: ${(props: ThemeProps) => props.theme.colors.text};
  margin-bottom: 16px;
`;

const EmptyStateContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  margin-top: 100px;
`;

const EmptyStateText = styled.Text`
  font-size: 16px;
  color: ${(props: ThemeProps) => props.theme.colors.textSecondary};
  text-align: center;
  margin-top: 16px;
`;

/**
 * CompetitionsPage - Página de listagem de competições
 * Utiliza os serviços e componentes da nova arquitetura
 */
export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();
  
  // Função para carregar as competições
  const loadCompetitions = async () => {
    try {
      setLoading(true);
      const data = await competitionService.listMyCompetitions();
      setCompetitions(data);
    } catch (error) {
      console.error('Erro ao carregar competições:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Carrega as competições ao montar o componente
  useEffect(() => {
    loadCompetitions();
  }, []);
  
  // Navega para a tela de criação de nova competição
  const handleCreateCompetition = () => {
    router.push('/competicao/nova');
  };
  
  // Navega para a tela de detalhes da competição
  const handleCompetitionPress = (id: string) => {
    router.push(`/competicao/competicao/${id}`);
  };
  
  // Renderiza cada item da lista
  const renderCompetitionItem = ({ item }: { item: Competition }) => (
    <CompetitionCard
      competition={item}
      onPress={() => handleCompetitionPress(item.id)}
      onDelete={(id) => {
        // Implementação da exclusão
      }}
      onEdit={(id) => {
        // Implementação da edição
      }}
    />
  );
  
  // Renderiza o estado vazio
  const renderEmptyState = () => (
    <EmptyStateContainer>
      <Feather name="award" size={64} color="#8257E5" />
      <EmptyStateText>
        Você ainda não possui competições.{'\n'}
        Crie uma nova competição para começar!
      </EmptyStateText>
    </EmptyStateContainer>
  );
  
  return (
    <PageTransition>
      <Container>
        <Content>
          <HeaderTitle>Minhas Competições</HeaderTitle>
          
          {loading ? (
            <ActivityIndicator size="large" color="#8257E5" />
          ) : (
            <FlatList
              data={competitions}
              keyExtractor={(item) => item.id}
              renderItem={renderCompetitionItem}
              ListEmptyComponent={renderEmptyState}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            />
          )}
          
          <FloatingButton
            icon="plus"
            onPress={handleCreateCompetition}
          />
        </Content>
      </Container>
    </PageTransition>
  );
}
