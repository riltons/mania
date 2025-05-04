import { View, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Modal, Text, Alert } from "react-native"
import styled from "styled-components/native"
import { colors } from "@/styles/colors"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { SlideTransition } from "@/components/Transitions"
import { Header } from "@/components/Header"
import { useCallback, useEffect, useState, useFocusEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Competition, competitionService } from "@/services/competitionService"
import { useRouter } from 'expo-router'
import { useTheme } from "@/contexts/ThemeProvider"
import { Feather } from "@expo/vector-icons"
import { communityService, Community } from "@/services/communityService"
import { ColorType } from "@/styles/themes"

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.backgroundDark};
`;

const ScrollContent = styled.ScrollView.attrs({
  contentContainerStyle: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 80,
  },
})`
  flex: 1;
`;

const CompetitionCard = styled.TouchableOpacity`
  background-color: ${({ theme }) => theme.colors.secondary};
  border-radius: 8px;
  margin-bottom: 16px;
  padding: 16px;
`;

const CompetitionHeader = styled.View`
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
`;

const CompetitionInfo = styled.View`
  flex: 1;
  margin-right: 12px;
`;

const CompetitionName = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.gray100};
  margin-bottom: 32px;
`;

const CompetitionDescription = styled.Text`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.gray300};
  margin-bottom: 16px;
`;

const CompetitionStatus = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 12px;
`;

const StatusText = styled.Text`
  font-size: 14px;
  font-weight: 500;
`;

const CompetitionStats = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
`;

const StatContainer = styled.View`
  flex-direction: row;
  align-items: center;
`;

const StatText = styled.Text`
  color: ${({ theme }) => theme.colors.gray300};
  font-size: 14px;
  margin-left: 6px;
`;

const SectionTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.gray100};
  margin-bottom: 16px;
`;

const ProgressBarContainer = styled.View`
  height: 4px;
  background-color: ${({ theme }) => theme.colors.gray700};
  border-radius: 2px;
  overflow: hidden;
  margin: 8px 0;
`;

const ProgressBarFill = styled.View<{ status: string }>`
  height: 100%;
  width: ${props => {
    switch (props.status) {
      case 'finished':
        return '100%';
      case 'in_progress':
        return '50%';
      default:
        return '20%';
    }
  }};
  background-color: ${({ status }) => {
    switch (status) {
      case 'finished':
        return '#22C55E'; 
      case 'in_progress':
        return '#8257E5'; 
      default:
        return '#FBA94C'; 
    }
  }};
`;

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const EmptyText = styled.Text`
  color: ${({ theme }) => theme.colors.gray300};
  font-size: 16px;
  text-align: center;
`;

const FAB = styled.TouchableOpacity`
  position: absolute;
  right: 20px;
  bottom: 20px;
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background-color: ${({ theme }) => theme.colors.primary};
  justify-content: center;
  align-items: center;
  elevation: 5;
`;

const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const ModalContainer = styled.View`
  width: 100%;
  background-color: ${({ theme }) => theme.colors.backgroundDark};
  border-radius: 8px;
  padding: 20px;
  max-height: 80%;
`;

const ModalHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.gray100};
`;

const FormGroup = styled.View`
  margin-bottom: 16px;
`;

const Label = styled.Text`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.gray100};
  margin-bottom: 8px;
`;

const Input = styled.TextInput`
  background-color: ${({ theme }) => theme.colors.gray800};
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.gray100};
`;

const SaveButton = styled.TouchableOpacity`
  background-color: ${({ theme }) => theme.colors.primary};
  padding: 16px;
  border-radius: 8px;
  align-items: center;
  margin-top: 16px;
`;

const SaveButtonText = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: bold;
`;

const CommunitySelector = styled.ScrollView.attrs({
  contentContainerStyle: {
    paddingBottom: 8,
  },
})`
  max-height: 150px;
  background-color: ${({ theme }) => theme.colors.gray800};
  border-radius: 8px;
  padding: 8px;
`;

const CommunityOption = styled.TouchableOpacity<{ isSelected: boolean }>`
  flex-direction: row;
  align-items: center;
  padding: 10px;
  background-color: ${({ isSelected, theme }) => isSelected ? theme.colors.gray700 : 'transparent'};
  border-radius: 4px;
  margin-bottom: 4px;
`;

const CommunityName = styled.Text`
  color: ${({ theme }) => theme.colors.gray100};
  font-size: 16px;
  margin-left: 8px;
`;

const Content = styled.View`
  flex: 1;
`;

const getStatusColor = (status: string, colors: ColorType) => {
  switch (status) {
    case 'pending':
      return colors.warning
    case 'in_progress':
      return colors.success
    case 'finished':
      return colors.primary
    default:
      return colors.textSecondary
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'in_progress':
      return 'Em Andamento';
    case 'finished':
      return 'Finalizado';
    default:
      return 'Desconhecido';
  }
}

const handleCardPress = (competition: Competition, router: any, communityId: string) => {
  router.push(`/comunidade/${communityId}/competicao/${competition.id}`);
};

export default function Competicoes() {
  const [competitions, setCompetitions] = useState<{
    created: Competition[],
    organized: Competition[]
  }>({ created: [], organized: [] })
  const [competitionStats, setCompetitionStats] = useState<{[key: string]: { totalPlayers: number, totalGames: number }}>({});
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const router = useRouter()
  const { colors } = useTheme()

  useEffect(() => {
    loadCompetitions()
    loadCommunities()
  }, [])
  
  const loadCommunities = async () => {
    try {
      const { created, organized } = await communityService.list(false);
      setCommunities([...created, ...organized]);
    } catch (error) {
      console.error('Erro ao carregar comunidades:', error);
    }
  }

  const loadCompetitions = async () => {
    try {
      setLoading(true);
      const comps = await competitionService.listMyCompetitions();

      // Busca estatísticas para cada competição
      const stats: {[key: string]: { totalPlayers: number, totalGames: number }} = {};
      
      const allCompetitions = [...comps.created, ...comps.organized];
      for (const comp of allCompetitions) {
        const { data: members } = await supabase
          .from('competition_members')
          .select('id')
          .eq('competition_id', comp.id);

        const { data: games } = await supabase
          .from('games')
          .select('id')
          .eq('competition_id', comp.id);

        stats[comp.id] = {
          totalPlayers: members?.length || 0,
          totalGames: games?.length || 0
        };
      }

      setCompetitionStats(stats);
      setCompetitions(comps);
    } catch (error) {
      console.error('Erro ao carregar competições:', error);
      if (error instanceof Error) {
        console.error('Detalhes do erro:', error.message);
        console.error('Stack trace:', error.stack);
      } else {
        console.error('Erro desconhecido:', error);
      }
    } finally {
      setLoading(false);
    }
  }

  const renderCompetitionCard = (competition: Competition) => (
    <CompetitionCard
      key={competition.id}
      onPress={() => handleCardPress(competition, router, competition.community_id)}
    >
      <CompetitionHeader>
        <CompetitionInfo>
          <CompetitionName>{competition.name}</CompetitionName>
          {competition.description && (
            <CompetitionDescription>{competition.description}</CompetitionDescription>
          )}
          <CompetitionStatus>
            <StatusText style={{ color: getStatusColor(competition.status, colors) }}>
              {getStatusText(competition.status)}
            </StatusText>
          </CompetitionStatus>
        </CompetitionInfo>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={colors.textPrimary}
        />
      </CompetitionHeader>

      <ProgressBarContainer>
        <ProgressBarFill 
          status={competition.status}
        />
      </ProgressBarContainer>

      <CompetitionStats>
        <StatContainer>
          <MaterialCommunityIcons name="account-group" size={16} color={colors.gray300} />
          <StatText>{competitionStats[competition.id]?.totalPlayers || 0} jogadores</StatText>
        </StatContainer>
        <StatContainer>
          <MaterialCommunityIcons name="gamepad-variant" size={16} color={colors.gray300} />
          <StatText>{competitionStats[competition.id]?.totalGames || 0} jogos</StatText>
        </StatContainer>
      </CompetitionStats>
    </CompetitionCard>
  );

  const handleCreateCompetition = async () => {
    if (!selectedCommunity) {
      Alert.alert('Erro', 'Selecione uma comunidade');
      return;
    }

    if (!formData.name.trim()) {
      Alert.alert('Erro', 'O nome da competição é obrigatório');
      return;
    }

    try {
      const result = await competitionService.create({
        name: formData.name.trim(),
        description: formData.description.trim(),
        communityId: selectedCommunity
      });
      
      console.log('[DEBUG] Resultado da criação de competição (competicoes.tsx):', JSON.stringify(result));
      
      // Verificar se há erro de limite de plano
      if (result && result.error && result.planLimit) {
        Alert.alert(
          'Limite de Competições',
          'Plano gratuito permite no máximo 2 competições ativas por comunidade. Faça upgrade para criar mais.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Ver Planos', onPress: () => router.push('/pricing?hideFree=true') }
          ]
        );
        return;
      }
      
      // Se não houver erro, continuar
      if (result && result.success) {
        setModalVisible(false);
        setFormData({ name: '', description: '' });
        setSelectedCommunity(null);
        loadCompetitions();
        Alert.alert('Sucesso', 'Competição criada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao criar competição:', error);
      Alert.alert('Erro', 'Não foi possível criar a competição');
    }
  };

  return (
    <Container>
      <Header title="COMPETIÇÕES" />
      <Content>
        {loading ? (
          <LoadingContainer>
            <ActivityIndicator size="large" color={colors.primary} />
          </LoadingContainer>
        ) : (
          <ScrollContent>
            <SectionTitle>Minhas Competições</SectionTitle>
            {competitions.created.length === 0 ? (
              <EmptyText>Você ainda não criou nenhuma competição</EmptyText>
            ) : (
              competitions.created.map(renderCompetitionCard)
            )}

            {competitions.organized.length > 0 && (
              <>
                <SectionTitle style={{ marginTop: 24 }}>Competições que Organizo</SectionTitle>
                {competitions.organized.map(renderCompetitionCard)}
              </>
            )}
          </ScrollContent>
        )}

        <FAB onPress={() => setModalVisible(true)}>
          <Feather name="plus" size={24} color="#fff" />
        </FAB>

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <ModalOverlay>
            <ModalContainer>
              <ModalHeader>
                <ModalTitle>Nova Competição</ModalTitle>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Feather name="x" size={24} color={colors.gray300} />
                </TouchableOpacity>
              </ModalHeader>

              <FormGroup>
                <Label>Comunidade</Label>
                <CommunitySelector>
                  {communities.map(community => (
                    <CommunityOption 
                      key={community.id}
                      onPress={() => setSelectedCommunity(community.id)}
                      isSelected={selectedCommunity === community.id}
                    >
                      <Feather 
                        name={selectedCommunity === community.id ? "check-circle" : "circle"} 
                        size={20} 
                        color={selectedCommunity === community.id ? colors.primary : colors.gray300} 
                      />
                      <CommunityName>{community.name}</CommunityName>
                    </CommunityOption>
                  ))}
                </CommunitySelector>
              </FormGroup>

              <FormGroup>
                <Label>Nome</Label>
                <Input
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  placeholder="Nome da competição"
                  placeholderTextColor={colors.gray300}
                />
              </FormGroup>

              <FormGroup>
                <Label>Descrição</Label>
                <Input
                  value={formData.description}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                  placeholder="Descrição da competição"
                  placeholderTextColor={colors.gray300}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  style={{ minHeight: 100 }}
                />
              </FormGroup>

              <SaveButton onPress={handleCreateCompetition}>
                <SaveButtonText>Criar Competição</SaveButtonText>
              </SaveButton>
            </ModalContainer>
          </ModalOverlay>
        </Modal>
      </Content>
    </Container>
  );
}