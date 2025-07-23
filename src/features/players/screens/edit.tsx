import React, { useState, useEffect } from 'react';
import { Alert, View, Image, TouchableOpacity, ActivityIndicator, Platform, ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { DefaultTheme } from 'styled-components';
import { Player } from '@/features/players/types/Player';
import { playersService } from '@/features/players/services/playersService';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { PlayerAvatar } from '@/components/data-display/PlayerAvatar';
import { FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '@/core/contexts/ThemeProvider';
import { InternalHeader } from '@/components/layout/InternalHeader';

/**
 * Normaliza um número de telefone brasileiro para o formato padrão
 * Remove todos os caracteres não numéricos e garante que o número esteja no formato correto
 * 
 * Regras para telefones brasileiros válidos:
 * 1. Deve ter exatamente 11 dígitos (incluindo DDD e o 9)
 * 2. O terceiro dígito deve ser 9 (padrão de celulares no Brasil)
 * 3. O DDD deve estar entre 11 e 99
 * 
 * @param phone Número de telefone a ser normalizado
 * @returns Número de telefone normalizado (apenas dígitos)
 */
const normalizePhoneNumber = (phone: string): string => {
  // Remove todos os caracteres não numéricos
  return phone.replace(/\D/g, '');
};

interface ThemeProps {
  theme: DefaultTheme;
}

export default function EditPlayer() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { colors } = useTheme();
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [player, setPlayer] = useState<Player | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        nickname: '',
        phone: ''
    });

    // Carrega os dados do jogador quando a tela é montada ou o ID muda
    useEffect(() => {
        if (id) {
            loadPlayer();
        }
    }, [id]);

    /**
     * Carrega os dados do jogador a partir do ID
     * Formata o telefone para exibição na interface
     */
    const loadPlayer = async () => {
        try {
            setLoading(true);
            const playerData = await playersService.getById(id as string);
            if (playerData) {
                setPlayer(playerData);
                
                // Formata o telefone para exibição se existir
                let formattedPhone = playerData.phone || '';
                if (formattedPhone) {
                    // Normaliza o telefone usando a função centralizada
                    const phoneDigits = normalizePhoneNumber(formattedPhone);
                    
                    if (phoneDigits.length === 11) {
                        // Formata como (XX) XXXXX-XXXX
                        formattedPhone = `(${phoneDigits.slice(0, 2)}) ${phoneDigits.slice(2, 7)}-${phoneDigits.slice(7, 11)}`;
                    }
                }
                
                setFormData({
                    name: playerData.name || '',
                    nickname: playerData.nickname || '',
                    phone: formattedPhone
                });
            } else {
                throw new Error('Jogador não encontrado');
            }
        } catch (error: any) {
            console.error('Erro ao carregar jogador:', error);
            Alert.alert('Erro', error.message || 'Erro ao carregar jogador');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    /**
     * Submete o formulário de edição do jogador
     * Valida os campos obrigatórios e o formato do telefone brasileiro
     */
    const handleSubmit = async () => {
        try {
            setLoading(true);

            // Validação do campo de nome
            if (!formData.name.trim()) {
                Alert.alert('Erro', 'O nome é obrigatório');
                setLoading(false);
                return;
            }

            // Validação do campo de telefone
            if (!formData.phone.trim()) {
                Alert.alert('Erro', 'O celular é obrigatório');
                setLoading(false);
                return;
            }
            
            /**
             * Normalização e validação do telefone brasileiro
             * 
             * Regras:
             * 1. Deve ter exatamente 11 dígitos (incluindo DDD e o 9)
             * 2. O terceiro dígito deve ser 9 (padrão de celulares no Brasil)
             * 3. O DDD deve estar entre 11 e 99
             */
            
            // Normaliza o telefone usando a função centralizada
            const normalizedPhone = normalizePhoneNumber(formData.phone);
            
            // Valida a quantidade de dígitos (DDD + 9 + 8 dígitos = 11)
            if (normalizedPhone.length !== 11) {
                Alert.alert(
                    'Formato de telefone inválido', 
                    'O telefone deve ter 11 dígitos no formato (XX) 9XXXX-XXXX, incluindo o DDD e o 9 inicial'
                );
                setLoading(false);
                return;
            }
            
            // Valida o terceiro dígito (deve ser 9 para celulares brasileiros)
            if (normalizedPhone[2] !== '9') {
                Alert.alert(
                    'Formato de telefone inválido', 
                    'O terceiro dígito do telefone deve ser 9 (padrão brasileiro para celulares)'
                );
                setLoading(false);
                return;
            }
            
            // Valida o DDD (deve estar entre 11 e 99)
            const ddd = parseInt(normalizedPhone.substring(0, 2));
            if (ddd < 11 || ddd > 99) {
                Alert.alert(
                    'DDD inválido', 
                    'O DDD informado não é válido. Deve ser um valor entre 11 e 99'
                );
                setLoading(false);
                return;
            }
            
            // Enviar dados para o servidor
            await playersService.update(id as string, {
                name: formData.name.trim(),
                nickname: formData.nickname.trim(),
                phone: normalizedPhone
            });
            
            // Atualiza o jogador local para refletir as alterações imediatamente
            const updatedPlayer = await playersService.getById(id as string);
            setPlayer(updatedPlayer);
            
            // Mostra mensagem de sucesso e volta para a tela anterior
            // Quando voltar, a tela de jogadores vai recarregar automaticamente
            // devido ao useFocusEffect implementado lá
            Alert.alert('Sucesso', 'Jogador atualizado com sucesso', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Erro ao atualizar jogador:', error);
            Alert.alert('Erro', error.message || 'Não foi possível atualizar o jogador');
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        try {
            // Solicitar permissão para acessar a galeria
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (status !== 'granted') {
                Alert.alert('Permissão negada', 'Precisamos de permissão para acessar suas fotos');
                return;
            }
            
            // Abrir o seletor de imagens
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });
            
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedImage = result.assets[0];
                uploadImage(selectedImage.uri);
            }
        } catch (error) {
            console.error('Erro ao selecionar imagem:', error);
            Alert.alert('Erro', 'Não foi possível selecionar a imagem');
        }
    };

    /**
     * Método para fazer upload do avatar do jogador
     * 
     * Implementação temporária que simula o upload e atualização do avatar
     * Até que o método real no serviço esteja disponível
     * 
     * @param playerId ID do jogador
     * @param uri URI da imagem selecionada
     * @returns URL pública do avatar após o upload
     */
    const uploadAvatar = async (playerId: string, uri: string): Promise<string> => {
        try {
            console.log(`Iniciando upload de avatar para o jogador ${playerId}...`);
            
            // Simulação de upload - em um cenário real, isso enviaria a imagem para o servidor
            // e retornaria a URL da imagem
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simula tempo de upload
            
            // Em um cenário real, esta URL viria do servidor após o upload
            const mockAvatarUrl = `https://example.com/avatars/${playerId}.jpg?t=${Date.now()}`;
            
            // Atualiza o jogador com a nova URL do avatar no banco de dados
            await playersService.update(playerId, { avatar_url: mockAvatarUrl });
            
            console.log('Avatar atualizado com sucesso:', mockAvatarUrl);
            return mockAvatarUrl;
        } catch (error: any) {
            console.error('Erro ao fazer upload do avatar:', error);
            Alert.alert('Erro', error.message || 'Erro ao fazer upload do avatar');
            throw error;
        }
    };

    /**
     * Faz o upload da imagem selecionada como avatar do jogador
     * 
     * Esta função é chamada após o usuário selecionar uma imagem
     * e tenta usar o método uploadAvatar do serviço ou a implementação local
     * 
     * @param uri URI da imagem selecionada
     */
    const uploadImage = async (uri: string) => {
        try {
            setUploadingImage(true);
            
            let avatarUrl = '';
            
            // Verifica se o serviço tem o método uploadAvatar
            // Usando uma abordagem de tipagem segura
            const playerServiceWithAvatar = playersService as unknown as {
                uploadAvatar: (playerId: string, uri: string) => Promise<string>
            };
            
            if ('uploadAvatar' in playersService) {
                // Usa o método do serviço
                console.log('Usando método uploadAvatar do serviço');
                avatarUrl = await playerServiceWithAvatar.uploadAvatar(id as string, uri);
            } else {
                // Usa a implementação local
                console.log('Usando implementação local de uploadAvatar');
                avatarUrl = await uploadAvatar(id as string, uri);
            }
            
            // Atualizar o jogador local com a nova URL do avatar
            if (player) {
                setPlayer({
                    ...player,
                    avatar_url: avatarUrl
                });
            }
            
            Alert.alert('Sucesso', 'Avatar atualizado com sucesso');
        } catch (error: any) {
            console.error('Erro ao fazer upload do avatar:', error);
            Alert.alert('Erro', error.message || 'Erro ao fazer upload do avatar');
        } finally {
            setUploadingImage(false);
        }
    };

    if (loading && !player) {
        return (
            <Container>
                <InternalHeader title="Editar Jogador" />
                <LoadingContainer>
                    <ActivityIndicator size="large" color={colors.accent} />
                </LoadingContainer>
            </Container>
        );
    }

    return (
        <Container>
            <InternalHeader title="Editar Jogador" />

            <Content>
                <AvatarContainer>
                    {uploadingImage ? (
                        <UploadingContainer>
                            <ActivityIndicator size="large" color={colors.accent} />
                        </UploadingContainer>
                    ) : (
                        <>
                            <PlayerAvatar 
                                avatarUrl={player?.avatar_url} 
                                name={player?.name} 
                                size={120} 
                            />
                            <ChangePhotoButton onPress={pickImage}>
                                <FontAwesome5 name="camera" size={16} color={colors.textPrimary} />
                                <ChangePhotoText>Alterar foto</ChangePhotoText>
                            </ChangePhotoButton>
                        </>
                    )}
                </AvatarContainer>

                <Form>
                    <TextInput
                        label="Nome"
                        placeholder="Digite o nome do jogador"
                        value={formData.name}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                    />

                    <TextInput
                        label="Apelido"
                        placeholder="Digite o apelido do jogador"
                        value={formData.nickname}
                        onChangeText={(text: string) => setFormData(prev => ({ ...prev, nickname: text }))}
                    />

                    <TextInput
                        label="Celular"
                        placeholder="(99) 99999-9999"
                        value={formData.phone}
                        onChangeText={(text: string) => {
                            // Normaliza o telefone usando a função centralizada
                            const digitsOnly = normalizePhoneNumber(text);
                            
                            // Aplica máscara de formatação para telefone brasileiro
                            let formattedPhone = digitsOnly;
                            
                            if (digitsOnly.length > 0) {
                                // Formata o DDD com parênteses
                                formattedPhone = `(${digitsOnly.slice(0, Math.min(2, digitsOnly.length))}`;
                                
                                if (digitsOnly.length > 2) {
                                    // Adiciona o fechamento do parêntese e espaço após o DDD
                                    formattedPhone += ') ';
                                    
                                    // Adiciona o 9 e os próximos dígitos
                                    if (digitsOnly.length <= 7) {
                                        // Adiciona os primeiros dígitos sem hífen
                                        formattedPhone += digitsOnly.slice(2);
                                    } else {
                                        // Adiciona hífen após o quinto dígito (contando com DDD)
                                        formattedPhone += digitsOnly.slice(2, 7) + '-' + digitsOnly.slice(7, 11);
                                    }
                                }
                            }
                            
                            setFormData({ ...formData, phone: formattedPhone });
                        }}
                        keyboardType="phone-pad"
                        maxLength={15}
                    />

                    <Button
                        title="Salvar Alterações"
                        onPress={handleSubmit}
                        loading={loading}
                    />
                </Form>
            </Content>
        </Container>
    );
}

const Container = styled.View`
    flex: 1;
    background-color: ${({ theme }: ThemeProps) => theme.colors.backgroundDark};
`;

const Content = styled.ScrollView`
    flex: 1;
    padding: 20px;
`;

const Form = styled.View`
    gap: 16px;
    margin-top: 20px;
`;

const LoadingContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
`;

const AvatarContainer = styled.View`
    align-items: center;
    margin-bottom: 20px;
`;

const UploadingContainer = styled.View`
    width: 120px;
    height: 120px;
    border-radius: 60px;
    background-color: ${({ theme }: ThemeProps) => theme.colors.backgroundLight};
    justify-content: center;
    align-items: center;
`;

const ChangePhotoButton = styled.TouchableOpacity`
    flex-direction: row;
    align-items: center;
    margin-top: 12px;
    padding: 8px 16px;
    background-color: ${({ theme }: ThemeProps) => theme.colors.backgroundLight};
    border-radius: 20px;
`;

const ChangePhotoText = styled.Text`
    color: ${({ theme }: ThemeProps) => theme.colors.textPrimary};
    font-size: 14px;
    margin-left: 8px;
`;
