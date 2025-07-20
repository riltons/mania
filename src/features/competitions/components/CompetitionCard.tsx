import React from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import styled from 'styled-components/native';
import { Feather } from '@expo/vector-icons';

import { Competition } from '@/core/types';
import { Card } from '@/core/components/ui';
import { formatDateBR } from '@/core/utils';

// Interface para tipar corretamente as props com tema
interface ThemeProps {
  theme: {
    colors: {
      text: string;
      textSecondary: string;
      primary: string;
      error: string;
      warning: string;
    }
  }
}

// Interface para tipar as props do componente
interface CompetitionCardProps {
  competition: Competition;
  onPress: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

// Componentes estilizados
const CardContent = styled.View`
  flex-direction: column;
`;

const Title = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: ${(props: ThemeProps) => props.theme.colors.text};
`;

const Description = styled.Text`
  font-size: 14px;
  color: ${(props: ThemeProps) => props.theme.colors.textSecondary};
  margin-top: 4px;
`;

const DateText = styled.Text`
  font-size: 12px;
  color: ${(props: ThemeProps) => props.theme.colors.textSecondary};
  margin-top: 8px;
`;

const ActionButtons = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  margin-top: 8px;
`;

const ActionButton = styled(TouchableOpacity)`
  padding: 4px;
  margin-left: 12px;
`;

/**
 * CompetitionCard - Componente que exibe uma competição em formato de cartão
 * 
 * Implementa a lógica avançada de exclusão/inativação:
 * - Competições com jogos finalizados: Apenas permite inativação (ícone de archive)
 * - Competições sem jogos finalizados: Permite exclusão completa (ícone de delete)
 */
export const CompetitionCard: React.FC<CompetitionCardProps> = ({
  competition,
  onPress,
  onDelete,
  onEdit,
}) => {
  // Função para confirmar a exclusão ou inativação
  const handleDeletePress = () => {
    if (competition.has_finished_games) {
      // Competição tem jogos finalizados, apenas podemos inativar
      Alert.alert(
        'Inativar competição',
        'Esta competição possui jogos finalizados e não pode ser excluída completamente. Deseja inativá-la?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Inativar', 
            onPress: () => onDelete(competition.id),
            style: 'destructive'
          },
        ]
      );
    } else {
      // Competição não tem jogos finalizados, podemos excluir
      Alert.alert(
        'Excluir competição',
        'Tem certeza que deseja excluir esta competição? Esta ação não pode ser desfeita.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Excluir', 
            onPress: () => onDelete(competition.id),
            style: 'destructive'
          },
        ]
      );
    }
  };

  // Função para editar a competição
  const handleEditPress = () => {
    onEdit(competition.id);
  };

  return (
    <Card onPress={() => onPress(competition.id)}>
      <CardContent>
        <Title>{competition.name}</Title>
        <Description>{competition.description}</Description>
        <DateText>Criado em: {formatDateBR(competition.created_at)}</DateText>
        
        <ActionButtons>
          {/* Botão de editar (lápis roxo) */}
          <ActionButton onPress={handleEditPress}>
            <Feather name="edit" size={20} color="#8257E5" />
          </ActionButton>
          
          {/* Botão de excluir/inativar com ícone dinâmico */}
          <ActionButton onPress={handleDeletePress}>
            {competition.has_finished_games ? (
              // Ícone de arquivar (laranja) para competições com jogos finalizados
              <Feather name="archive" size={20} color="#FBA94C" />
            ) : (
              // Ícone de lixeira (vermelho) para competições sem jogos finalizados
              <Feather name="trash-2" size={20} color="#FF3333" />
            )}
          </ActionButton>
        </ActionButtons>
      </CardContent>
    </Card>
  );
};
