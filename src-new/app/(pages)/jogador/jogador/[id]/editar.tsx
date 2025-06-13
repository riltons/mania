import React, { useState, useEffect } from 'react';
import { Alert, ActivityIndicator, TouchableOpacity, Image, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import styled from 'styled-components/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { InternalHeader } from '@/components/InternalHeader';
import { playerService } from '@/services/playerService';
import { Feather } from '@expo/vector-icons';
import { TextInput } from 'react-native-paper';
import { useTheme } from 'styled-components/native';

export default function EditarJogador() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { colors } = useTheme();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        nickname: ''
    });
    const [image, setImage] = useState<string | null>(null);
    const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadPlayer();
    }, [id]);

    const loadPlayer = async () => {
        if (!id || typeof id !== 'string') {
            Alert.alert('Erro', 'ID do jogador inválido');
            router.back();
            return;
        }

        try {
            setLoading(true);
            const player = await playerService.getById(id);
            
            if (!player) {
                Alert.alert('Erro', 'Jogador não encontrado');
                router.back();
                return;
            }

            setFormData({
                name: player.name || '',
                phone: player.phone || '',
                nickname: player.nickname || ''
            });

            if (player.avatar_url) {
                setCurrentAvatarUrl(player.avatar_url);
            }

        } catch (error) {
            console.error('Erro ao carregar jogador:', error);
            Alert.alert('Erro', 'Não foi possível carregar os dados do jogador');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        // Solicitar permissões para acessar a biblioteca de imagens
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
            if (Platform.OS === 'web') {
                // Na web, precisamos usar o formato base64
                if (result.assets[0].base64) {
                    const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
                    console.log('Imagem convertida para base64');
                    setImage(base64Uri);
                } else {
                    console.error('Imagem sem dados base64');
                    Alert.alert('Erro', 'Não foi possível processar a imagem selecionada');
                }
            } else {
                // Em dispositivos móveis, usamos a URI diretamente
                setImage(result.assets[0].uri);
            }
        }
    };
    
    const handleSave = async () => {
        if (!formData.name.trim()) {
            Alert.alert('Erro', 'O nome do jogador é obrigatório');
            return;
        }

        if (!formData.phone.trim()) {
            Alert.alert('Erro', 'O celular do jogador é obrigatório');
            return;
        }

        if (!id || typeof id !== 'string') {
            Alert.alert('Erro', 'ID do jogador inválido');
            return;
        }

        try {
            setSaving(true);
            
            // Atualizar dados do jogador
            await playerService.update(id, {
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                nickname: formData.nickname.trim() || null
            });
            
            // Se tiver imagem nova selecionada, fazer upload
            if (image) {
                try {
                    const avatarUrl = await playerService.uploadAvatar(id, image);
                    // Atualiza a URL do avatar na interface
                    setCurrentAvatarUrl(avatarUrl);
                } catch (uploadError) {
                    console.error('Erro ao fazer upload da foto:', uploadError);
                    Alert.alert('Aviso', 'Não foi possível fazer o upload da foto, mas os outros dados foram salvos.');
                    // Continua mesmo com erro no upload da foto
                }
            }
            
            Alert.alert('Sucesso', 'Jogador atualizado com sucesso');
            router.back();
        } catch (error: any) {
            console.error('Erro ao atualizar jogador:', error);
            Alert.alert(
                'Erro',
                error?.message || 'Erro ao atualizar jogador. Tente novamente.'
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Container>
                <InternalHeader title="Editar Jogador" />
                <LoadingContainer>
                    <ActivityIndicator size="large" color={colors.primary} />
                </LoadingContainer>
            </Container>
        );
    }

    return (
        <Container>
            <InternalHeader title="Editar Jogador" />
            <Content>
                <AvatarContainer>
                    <AvatarButton onPress={pickImage}>
                        {image ? (
                            <AvatarImage source={{ uri: image }} />
                        ) : currentAvatarUrl ? (
                            <AvatarImage source={{ uri: currentAvatarUrl }} />
                        ) : (
                            <AvatarPlaceholder>
                                <Feather name="camera" size={24} color={colors.textSecondary} />
                                <AvatarText>Adicionar foto</AvatarText>
                            </AvatarPlaceholder>
                        )}
                    </AvatarButton>
                </AvatarContainer>

                <FormContainer>
                    <InputContainer>
                        <StyledTextInput
                            label="Nome"
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                            mode="outlined"
                            outlineColor={colors.backgroundLight}
                            activeOutlineColor={colors.primary}
                            style={{ backgroundColor: colors.backgroundMedium }}
                            theme={{ colors: { text: colors.textPrimary, placeholder: colors.textSecondary } }}
                        />
                    </InputContainer>

                    <InputContainer>
                        <StyledTextInput
                            label="Celular"
                            value={formData.phone}
                            onChangeText={(text) => setFormData({ ...formData, phone: text })}
                            mode="outlined"
                            outlineColor={colors.backgroundLight}
                            activeOutlineColor={colors.primary}
                            style={{ backgroundColor: colors.backgroundMedium }}
                            theme={{ colors: { text: colors.textPrimary, placeholder: colors.textSecondary } }}
                            keyboardType="phone-pad"
                        />
                    </InputContainer>

                    <InputContainer>
                        <StyledTextInput
                            label="Apelido (opcional)"
                            value={formData.nickname}
                            onChangeText={(text) => setFormData({ ...formData, nickname: text })}
                            mode="outlined"
                            outlineColor={colors.backgroundLight}
                            activeOutlineColor={colors.primary}
                            style={{ backgroundColor: colors.backgroundMedium }}
                            theme={{ colors: { text: colors.textPrimary, placeholder: colors.textSecondary } }}
                        />
                    </InputContainer>

                    <SaveButton onPress={handleSave} disabled={saving}>
                        {saving ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <SaveButtonText>Salvar</SaveButtonText>
                        )}
                    </SaveButton>
                </FormContainer>
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

const LoadingContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
`;

const AvatarContainer = styled.View`
    align-items: center;
    margin-bottom: 24px;
`;

const AvatarButton = styled.TouchableOpacity`
    width: 120px;
    height: 120px;
    border-radius: 60px;
    overflow: hidden;
    background-color: ${({ theme }) => theme.colors.backgroundMedium};
`;

const AvatarImage = styled.Image`
    width: 100%;
    height: 100%;
`;

const AvatarPlaceholder = styled.View`
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;
`;

const AvatarText = styled.Text`
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 12px;
    margin-top: 8px;
`;

const FormContainer = styled.View`
    width: 100%;
`;

const InputContainer = styled.View`
    margin-bottom: 16px;
`;

const StyledTextInput = styled(TextInput)`
    width: 100%;
`;

const SaveButton = styled.TouchableOpacity`
    background-color: ${({ theme, disabled }) => disabled ? theme.colors.backgroundLight : theme.colors.primary};
    padding: 16px;
    border-radius: 8px;
    align-items: center;
    margin-top: 24px;
`;

const SaveButtonText = styled.Text`
    color: white;
    font-size: 16px;
    font-weight: bold;
`;