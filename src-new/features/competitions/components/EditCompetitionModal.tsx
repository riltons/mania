import React, { useEffect, useState } from 'react';
import { View, Modal, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import styled from 'styled-components/native';

import { ThemeProps } from '@/core/types/theme';
import { Competition } from '@/core/types/database.types';
import { competitionService } from '@/features/competitions/services';

const Container = styled(View)<ThemeProps>`
  flex: 1;
  background-color: ${({ theme }: ThemeProps) => theme.colors.backgroundMedium}99;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const ModalContainer = styled(View)<ThemeProps>`
  background-color: ${({ theme }: ThemeProps) => theme.colors.backgroundLight};
  border-radius: 10px;
  padding: 20px;
  width: 100%;
  max-width: 400px;
`;

const ModalTitle = styled(Text)<ThemeProps>`
  font-size: 20px;
  font-weight: bold;
  color: ${({ theme }: ThemeProps) => theme.colors.textPrimary};
  margin-bottom: 16px;
`;

const Input = styled(TextInput)<ThemeProps>`
  background-color: ${({ theme }: ThemeProps) => theme.colors.backgroundDark};
  color: ${({ theme }: ThemeProps) => theme.colors.textPrimary};
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  font-size: 16px;
`;

const ButtonContainer = styled(View)`
  flex-direction: row;
  justify-content: flex-end;
  margin-top: 16px;
`;

const ButtonText = styled(Text)<ThemeProps & { primary?: boolean }>`
  color: ${({ theme, primary }: ThemeProps & { primary?: boolean }) => 
    primary ? theme.colors.textPrimary : theme.colors.primary};
  font-size: 16px;
  font-weight: bold;
`;

const Button = styled(TouchableOpacity)`
  padding: 10px 16px;
  margin-left: 10px;
`;

const CommunityName = styled(Text)<ThemeProps>`
  font-size: 16px;
  color: ${({ theme }: ThemeProps) => theme.colors.textSecondary};
  margin-bottom: 16px;
`;

interface EditCompetitionModalProps {
  visible: boolean;
  competition: Competition;
  onClose: () => void;
  onCompetitionUpdated: () => void;
}

export const EditCompetitionModal: React.FC<EditCompetitionModalProps> = ({
  visible,
  competition,
  onClose,
  onCompetitionUpdated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && competition) {
      setName(competition.name || '');
      setDescription(competition.description || '');
    }
  }, [visible, competition]);

  const handleUpdateCompetition = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Por favor, informe um nome para a competição.');
      return;
    }

    try {
      setLoading(true);
      await competitionService.update(competition.id, {
        name: name.trim(),
        description: description.trim(),
      });
      
      Alert.alert('Sucesso', 'Competição atualizada com sucesso!');
      onCompetitionUpdated();
    } catch (error) {
      console.error('Erro ao atualizar competição:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a competição. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Container>
        <ModalContainer>
          <ModalTitle>Editar Competição</ModalTitle>
          
          {competition?.community?.name && (
            <CommunityName>
              Comunidade: {competition.community.name}
            </CommunityName>
          )}
          
          <Input
            placeholder="Nome da competição"
            value={name}
            onChangeText={(text: string) => setName(text)}
            placeholderTextColor="#999"
          />
          
          <Input
            placeholder="Descrição (opcional)"
            value={description}
            onChangeText={(text: string) => setDescription(text)}
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          
          <ButtonContainer>
            <Button onPress={onClose}>
              <ButtonText>Cancelar</ButtonText>
            </Button>
            <Button onPress={handleUpdateCompetition} disabled={loading}>
              <ButtonText primary>{loading ? 'Salvando...' : 'Salvar'}</ButtonText>
            </Button>
          </ButtonContainer>
        </ModalContainer>
      </Container>
    </Modal>
  );
};
