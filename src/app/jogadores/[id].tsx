import React, { useState, useEffect } from 'react';
import { Alert, View, ActivityIndicator, Platform } from 'react-native';
import styled from 'styled-components/native';
import { Player, playerService } from '@/services/playerService';
import { Header } from '@/components/Header';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TextInput } from '@/components/TextInput';
import { Button } from '@/components/Button';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeProvider';

export default function PlayerDetails() {
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
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (id) {
            loadPlayer();
        }
    }, [id]);

    const loadPlayer = async () => {
        try {
            setLoading(true);
            const playerData = await playerService.getById(id as string);
            setPlayer(playerData);
            setFormData({
                name: playerData.name || '',
                nickname: playerData.nickname || '',
                phone: playerData.phone || ''
            });
        } catch (error: any) {
            console.error('Erro ao carregar jogador:', error);
            Alert.alert('Erro', error.message || 'Erro ao carregar jogador');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);

            if (!formData.name.trim()) {
                Alert.alert('Erro', 'O nome é obrigatório');
                return;
            }

            if (!formData.phone.trim()) {
                Alert.alert('Erro', 'O celular é obrigatório');
                return;
            }

            await playerService.update(id as string, {
                name: formData.name.trim(),
                nickname: formData.nickname.trim(),
                phone: formData.phone.trim()
            });

            // Atualizar o jogador local
            const updatedPlayer = await playerService.getById(id as string);
            setPlayer(updatedPlayer);
            setIsEditing(false);
            
            Alert.alert('Sucesso', 'Jogador atualizado com sucesso');
        } catch (error: any) {
            console.error('Erro ao atualizar jogador:', error);
            Alert.alert('Erro', error.message || 'Erro ao atualizar jogador');
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
                // Na web, precisamos ativar base64 para processar a imagem corretamente
                base64: Platform.OS === 'web',
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
    
    const takePhoto = async () => {
        try {
            // Solicitar permissão para acessar a câmera
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            
            if (status !== 'granted') {
                Alert.alert('Permissão negada', 'Precisamos de permissão para acessar sua câmera');
                return;
            }
            
            // Abrir a câmera
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
                // Na web, precisamos ativar base64 para processar a imagem corretamente
                base64: Platform.OS === 'web',
            });
            
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedImage = result.assets[0];
                uploadImage(selectedImage.uri);
            }
        } catch (error) {
            console.error('Erro ao capturar foto:', error);
            Alert.alert('Erro', 'Não foi possível capturar a foto');
        }
    };

    const uploadImage = async (uri: string) => {
        try {
            setUploadingImage(true);
            
            // Chamar o serviço para fazer upload da imagem
            const avatarUrl = await playerService.uploadAvatar(id as string, uri);
            
            // Atualizar o estado do jogador com a nova URL da imagem
            setPlayer(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
            
            Alert.alert('Sucesso', 'Foto de perfil atualizada com sucesso');
        } catch (error: any) {
            console.error('Erro ao fazer upload da imagem:', error);
            Alert.alert('Erro', error.message || 'Não foi possível fazer upload da imagem');
        } finally {
            setUploadingImage(false);
        }
    };

    if (loading && !player) {
        return (
            <Container>
                <Header title="Detalhes do Jogador" />
                <LoadingContainer>
                    <ActivityIndicator size="large" color={colors.accent} />
                </LoadingContainer>
            </Container>
        );
    }

    return (
        <Container>
            <Header title="Detalhes do Jogador" />

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
                            <PhotoOptionsContainer>
                                <ChangePhotoButton onPress={pickImage}>
                                    <FontAwesome5 name="images" size={16} color={colors.textPrimary} />
                                    <ChangePhotoText>Galeria</ChangePhotoText>
                                </ChangePhotoButton>
                                <ChangePhotoButton onPress={takePhoto}>
                                    <FontAwesome5 name="camera" size={16} color={colors.textPrimary} />
                                    <ChangePhotoText>Câmera</ChangePhotoText>
                                </ChangePhotoButton>
                            </PhotoOptionsContainer>
                        </>
                    )}
                </AvatarContainer>

                {isEditing ? (
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
                            onChangeText={(text) => setFormData(prev => ({ ...prev, nickname: text }))}
                        />

                        <TextInput
                            label="Celular"
                            placeholder="Digite o celular do jogador"
                            value={formData.phone}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                            keyboardType="phone-pad"
                            maxLength={11}
                        />

                        <ButtonsContainer>
                            <CancelButton 
                                title="Cancelar" 
                                onPress={() => {
                                    setIsEditing(false);
                                    setFormData({
                                        name: player?.name || '',
                                        nickname: player?.nickname || '',
                                        phone: player?.phone || ''
                                    });
                                }} 
                            />
                            <SaveButton
                                title="Salvar"
                                onPress={handleSubmit}
                                loading={loading}
                            />
                        </ButtonsContainer>
                    </Form>
                ) : (
                    <PlayerInfoContainer>
                        <InfoItem>
                            <InfoLabel>Nome</InfoLabel>
                            <InfoValue>{player?.name}</InfoValue>
                        </InfoItem>
                        
                        {player?.nickname && (
                            <InfoItem>
                                <InfoLabel>Apelido</InfoLabel>
                                <InfoValue>{player.nickname}</InfoValue>
                            </InfoItem>
                        )}
                        
                        <InfoItem>
                            <InfoLabel>Celular</InfoLabel>
                            <InfoValue>{player?.phone}</InfoValue>
                        </InfoItem>

                        <EditButton
                            title="Editar Informações"
                            onPress={() => setIsEditing(true)}
                        />
                    </PlayerInfoContainer>
                )}
            </Content>
        </Container>
    );
}

const Container = styled.View`
    flex: 1;
    background-color: ${({ theme }) => theme.colors.backgroundDark};
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
    background-color: ${({ theme }) => theme.colors.backgroundLight};
    justify-content: center;
    align-items: center;
`;

const PhotoOptionsContainer = styled.View`
    flex-direction: row;
    justify-content: center;
    margin-top: 12px;
    gap: 12px;
`;

const ChangePhotoButton = styled.TouchableOpacity`
    flex-direction: row;
    align-items: center;
    padding: 8px 16px;
    background-color: ${({ theme }) => theme.colors.backgroundLight};
    border-radius: 20px;
`;

const ChangePhotoText = styled.Text`
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: 14px;
    margin-left: 8px;
`;

const PlayerInfoContainer = styled.View`
    background-color: ${({ theme }) => theme.colors.backgroundLight};
    border-radius: 12px;
    padding: 16px;
    margin-top: 20px;
`;

const InfoItem = styled.View`
    margin-bottom: 16px;
`;

const InfoLabel = styled.Text`
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 14px;
    margin-bottom: 4px;
`;

const InfoValue = styled.Text`
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: 16px;
    font-weight: 500;
`;

const EditButton = styled(Button)`
    margin-top: 16px;
`;

const ButtonsContainer = styled.View`
    flex-direction: row;
    justify-content: space-between;
    gap: 12px;
    margin-top: 16px;
`;

const CancelButton = styled(Button)`
    flex: 1;
    background-color: ${({ theme }) => theme.colors.backgroundLight};
`;

const SaveButton = styled(Button)`
    flex: 1;
`;