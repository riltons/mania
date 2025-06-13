import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import styled from 'styled-components/native';
import { Feather } from '@expo/vector-icons';
import { TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

import { Competition } from '@/core/types/database.types';
import { formatDate } from '@/core/utils/date';
import { ThemeProps } from '@/core/types/theme';
import { useAuth } from '@/features/auth/hooks';
import { competitionService } from '@/features/competitions/services';

interface CompetitionDetailsCardProps {
  competition: Competition;
  onUpdate?: () => void;
}

const Container = styled.View`
  background-color: ${({ theme }: ThemeProps) => theme.colors.backgroundMedium};
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
  margin-bottom: 24px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  elevation: 3;
`;

const CompetitionName = styled.Text`
  color: ${({ theme }: ThemeProps) => theme.colors.text};
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 16px;
`;

const InfoItem = styled.View`
  margin-bottom: 12px;
`;

const InfoLabel = styled.Text`
  color: ${({ theme }: ThemeProps) => theme.colors.textSecondary};
  font-size: 14px;
  margin-left: 8px;
`;

const InfoValue = styled.Text`
  color: ${({ theme }: ThemeProps) => theme.colors.text};
  font-size: 16px;
  font-weight: 500;
`;

const Row = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
`;

const ActionButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  background-color: ${({ theme }: ThemeProps) => theme.colors.backgroundLight};
`;

const ButtonText = styled.Text`
  color: ${({ theme }: ThemeProps) => theme.colors.text};
  font-size: 14px;
  margin-left: 8px;
`;

const StatusContainer = styled.View`
  padding: 6px 12px;
  border-radius: 20px;
  background-color: ${({ theme, active }: { theme: any; active: boolean }) => 
    active ? theme.colors.successLight : theme.colors.warningLight};
  align-self: flex-start;
  margin-bottom: 10px;
`;

const StatusText = styled.Text`
  color: ${({ theme, active }: { theme: any; active: boolean }) => 
    active ? theme.colors.success : theme.colors.warning};
  font-size: 14px;
  font-weight: 500;
`;

export const CompetitionDetailsCard: React.FC<CompetitionDetailsCardProps> = ({ 
  competition, 
  onUpdate 
}) => {
  const { user } = useAuth();
  const router = useRouter();
  
  const handleEdit = () => {
    router.push({
      pathname: '/competicoes/editar',
      params: { id: competition.id }
    });
  };
  
  const handleToggleStatus = async () => {
    try {
      const newStatus = !competition.is_active;
      const action = newStatus ? 'ativar' : 'desativar';
      
      Alert.alert(
        `${action.charAt(0).toUpperCase() + action.slice(1)} competição`,
        `Tem certeza que deseja ${action} esta competição?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sim',
            onPress: async () => {
              await competitionService.update(competition.id, {
                ...competition,
                is_active: newStatus
              });
              
              if (onUpdate) {
                onUpdate();
              }
              
              Alert.alert(
                'Sucesso',
                `Competição ${newStatus ? 'ativada' : 'desativada'} com sucesso!`
              );
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erro ao alterar status da competição:', error);
      Alert.alert('Erro', 'Não foi possível alterar o status da competição');
    }
  };
  
  const isOwner = user && competition.created_by === user.id;

  return (
    <Container>
      <StatusContainer active={competition.is_active}>
        <StatusText active={competition.is_active}>
          {competition.is_active ? 'Ativa' : 'Inativa'}
        </StatusText>
      </StatusContainer>
      
      <CompetitionName>{competition.name}</CompetitionName>
      
      <InfoItem>
        <InfoLabel>Descrição</InfoLabel>
        <InfoValue>{competition.description || 'Sem descrição'}</InfoValue>
      </InfoItem>
      
      <InfoItem>
        <InfoLabel>Data de Início</InfoLabel>
        <InfoValue>{formatDate(competition.start_date)}</InfoValue>
      </InfoItem>
      
      {competition.end_date && (
        <InfoItem>
          <InfoLabel>Data de Término</InfoLabel>
          <InfoValue>{formatDate(competition.end_date)}</InfoValue>
        </InfoItem>
      )}
      
      <InfoItem>
        <InfoLabel>Criado em</InfoLabel>
        <InfoValue>{formatDate(competition.created_at)}</InfoValue>
      </InfoItem>
      
      {isOwner && (
        <Row>
          <ActionButton onPress={handleEdit}>
            <Feather name="edit-2" size={16} color="#9ca3af" />
            <ButtonText>Editar</ButtonText>
          </ActionButton>
          
          <ActionButton onPress={handleToggleStatus}>
            <Feather 
              name={competition.is_active ? "slash" : "check-circle"} 
              size={16} 
              color={competition.is_active ? "#ef4444" : "#10b981"} 
            />
            <ButtonText>
              {competition.is_active ? "Desativar" : "Ativar"}
            </ButtonText>
          </ActionButton>
        </Row>
      )}
    </Container>
  );
};
