import React, { useEffect, useState } from 'react';
import { View, Modal, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import styled from 'styled-components/native';
import { Feather } from '@expo/vector-icons';

import { ThemeProps } from '@/core/types/theme';
import { competitionService } from '@/features/competitions/services';
import { communityService } from '@/features/communities/services';
import { useAuth } from '@/features/auth/hooks';

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

const CommunitySection = styled(View)`
  margin-bottom: 16px;
`;

const SectionTitle = styled(Text)<ThemeProps>`
  font-size: 16px;
  color: ${({ theme }: ThemeProps) => theme.colors.textPrimary};
  margin-bottom: 8px;
`;

const CommunityOption = styled(TouchableOpacity)<{ isSelected: boolean, theme: any }>`
  flex-direction: row;
  align-items: center;
  padding: 10px;
  background-color: ${({ isSelected, theme }) => 
    isSelected ? `${theme.colors.primary}44` : 'transparent'};
  border-radius: 8px;
  margin-bottom: 8px;
`;

const CommunityName = styled(Text)<ThemeProps>`
  font-size: 16px;
  color: ${({ theme }: ThemeProps) => theme.colors.textPrimary};
  margin-left: 8px;
`;

interface CreateCompetitionModalProps {
  visible: boolean;
  onClose: () => void;
  onCompetitionCreated: () => void;
}

export const CreateCompetitionModal: React.FC<CreateCompetitionModalProps> = ({
  visible,
  onClose,
  onCompetitionCreated,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [communities, setCommunities] = useState<any[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCommunities();
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedCommunity(null);
  };

  const loadCommunities = async () => {
    try {
      const { created, organized } = await communityService.list(false);
      setCommunities([...created, ...organized]);
    } catch (error) {
      console.error('Erro ao carregar comunidades:', error);
      Alert.alert('Erro', 'Não foi possível carregar as comunidades. Por favor, tente novamente.');
    }
  };

  const handleCreateCompetition = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Por favor, informe um nome para a competição.');
      return;
    }

    if (!selectedCommunity) {
      Alert.alert('Erro', 'Por favor, selecione uma comunidade para a competição.');
      return;
    }

    try {
      setLoading(true);
      await competitionService.create({
        name: name.trim(),
        description: description.trim(),
        community_id: selectedCommunity,
        created_by: user?.id || '',
        is_active: true,
      });
      
      Alert.alert('Sucesso', 'Competição criada com sucesso!');
      resetForm();
      onCompetitionCreated();
    } catch (error) {
      console.error('Erro ao criar competição:', error);
      Alert.alert('Erro', 'Não foi possível criar a competição. Por favor, tente novamente.');
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
          <ModalTitle>Nova Competição</ModalTitle>
          
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
          
          <CommunitySection>
            <SectionTitle>Selecione uma comunidade:</SectionTitle>
            {communities.map(community => (
              <CommunityOption
                key={community.id}
                isSelected={selectedCommunity === community.id}
                onPress={() => setSelectedCommunity(community.id)}
              >
                <Feather
                  name={selectedCommunity === community.id ? 'check-circle' : 'circle'}
                  size={20}
                  color={selectedCommunity === community.id ? '#8257E5' : '#999'}
                />
                <CommunityName>{community.name}</CommunityName>
              </CommunityOption>
            ))}
          </CommunitySection>
          
          <ButtonContainer>
            <Button onPress={onClose}>
              <ButtonText>Cancelar</ButtonText>
            </Button>
            <Button onPress={handleCreateCompetition} disabled={loading}>
              <ButtonText primary>{loading ? 'Criando...' : 'Criar'}</ButtonText>
            </Button>
          </ButtonContainer>
        </ModalContainer>
      </Container>
    </Modal>
  );
};
