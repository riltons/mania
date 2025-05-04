import React, { useState, useEffect } from 'react';
import { Alert, ActivityIndicator, TouchableOpacity, Image, Platform, View, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import styled from 'styled-components/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Header } from '@/components/Header';
import { playerService } from '@/services/playerService';
import { Feather } from '@expo/vector-icons';
import { TextInput } from 'react-native-paper';
import { colors } from '@/styles/colors';
import { PageTransition } from '@/components/Transitions';

// Definição do tipo de jogador
type Player = {
    id: string;
    name: string;
    phone: string;
    nickname?: string;
    avatar_url?: string;
};

const Container = styled.View`
    flex: 1;
    background-color: ${colors.backgroundDark};
`;

const Content = styled.ScrollView`
    flex: 1;
    padding: 20px;
`;

const FormGroup = styled.View`
    margin-bottom: 16px;
`;

const Label = styled.Text`
    color: ${colors.gray300};
    font-size: 14px;
    margin-bottom: 4px;
`;

const ButtonContainer = styled.View`
    margin-top: 24px;
`;

const SaveButton = styled.TouchableOpacity`
    background-color: ${colors.primary};
    padding: 12px;
    border-radius: 8px;
    align-items: center;
`;

const SaveButtonText = styled.Text`
    color: ${colors.gray100};
    font-size: 16px;
    font-weight: bold;
`;

const ImageContainer = styled.View`
    align-items: center;
    margin-bottom: 24px;
`;

const AvatarImage = styled.Image`
    width: 120px;
    height: 120px;
    border-radius: 60px;
    margin-bottom: 12px;
    background-color: ${colors.backgroundLight};
`;

const UploadButton = styled.TouchableOpacity`
    flex-direction: row;
    align-items: center;
    background-color: ${colors.backgroundLight};
    padding: 8px 12px;
    border-radius: 8px;
`;

const UploadButtonText = styled.Text`
    color: ${colors.gray100};
    font-size: 14px;
    margin-left: 8px;
`;

export default function EditarJogador() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
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
            const response = await playerService.getById(id);
            
            // Verificar se a resposta é válida e não é um erro
            if (response && !('error' in response)) {
                const player = response as Player;
                
                setFormData({
                    name: player.name || '',
                    phone: player.phone || '',
                    nickname: player.nickname || ''
                });

                // Verificar se há avatar
                if (player.avatar_url) {
                    setCurrentAvatarUrl(player.avatar_url);
                }
            } else {
                Alert.alert('Erro', 'Jogador não encontrado');
                router.back();
            }
        } catch (error) {
            console.error('Erro ao carregar jogador:', error);
            Alert.alert('Erro', 'Não foi possível carregar os dados do jogador');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const pickImage = async () => {
        try {
            // Configurações diferentes para web e dispositivos móveis
            const options = {
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
                // Na web, precisamos ativar base64 para processar a imagem corretamente
                base64: Platform.OS === 'web',
            };

            console.log('Iniciando seletor de imagem na plataforma:', Platform.OS);
            const result = await ImagePicker.launchImageLibraryAsync(options);

            if (!result.canceled && result.assets && result.assets.length > 0) {
                console.log('Imagem selecionada');
                
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
                    console.log('Usando URI da imagem:', result.assets[0].uri);
                    setImage(result.assets[0].uri);
                }
            }
        } catch (error) {
            console.error('Erro ao selecionar imagem:', error);
            Alert.alert('Erro', 'Não foi possível selecionar a imagem');
        }
    };

    const handleSave = async () => {
        if (!id || typeof id !== 'string') return;

        // Validação básica
        if (!formData.name.trim()) {
            Alert.alert('Erro', 'O nome é obrigatório');
            return;
        }

        if (!formData.phone.trim()) {
            Alert.alert('Erro', 'O telefone é obrigatório');
            return;
        }

        try {
            setSaving(true);

            // Atualizar dados do jogador
            await playerService.update(id, { 
                name: formData.name.trim(), 
                phone: formData.phone.trim(), 
                nickname: formData.nickname.trim() || undefined 
            });

            // Atualizar avatar se houver uma nova imagem
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

            Alert.alert('Sucesso', 'Jogador atualizado com sucesso', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Erro ao atualizar jogador:', error);
            Alert.alert('Erro', 'Não foi possível atualizar o jogador');
        } finally {
            setSaving(false);
        }
    };

    return (
        <PageTransition>
            <Container>
                <Header title="Editar Jogador" showBackButton />
                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <Content>
                        <ImageContainer>
                            <AvatarImage 
                                source={image ? { uri: image } : currentAvatarUrl ? { uri: currentAvatarUrl } : require('../../../assets/avatar-placeholder.png')} 
                            />
                            <UploadButton onPress={pickImage}>
                                <Feather name="camera" size={16} color={colors.gray100} />
                                <UploadButtonText>Alterar foto</UploadButtonText>
                            </UploadButton>
                        </ImageContainer>

                        <FormGroup>
                            <Label>Nome</Label>
                            <TextInput
                                mode="outlined"
                                value={formData.name}
                                onChangeText={(text) => handleChange('name', text)}
                                style={{ backgroundColor: colors.backgroundLight }}
                                theme={{ colors: { primary: colors.primary, text: colors.gray100, placeholder: colors.gray300 } }}
                                placeholderTextColor={colors.gray300}
                                outlineColor={colors.backgroundLight}
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label>Telefone</Label>
                            <TextInput
                                mode="outlined"
                                value={formData.phone}
                                onChangeText={(text) => handleChange('phone', text)}
                                keyboardType="phone-pad"
                                style={{ backgroundColor: colors.backgroundLight }}
                                theme={{ colors: { primary: colors.primary, text: colors.gray100, placeholder: colors.gray300 } }}
                                placeholderTextColor={colors.gray300}
                                outlineColor={colors.backgroundLight}
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label>Apelido (opcional)</Label>
                            <TextInput
                                mode="outlined"
                                value={formData.nickname}
                                onChangeText={(text) => handleChange('nickname', text)}
                                style={{ backgroundColor: colors.backgroundLight }}
                                theme={{ colors: { primary: colors.primary, text: colors.gray100, placeholder: colors.gray300 } }}
                                placeholderTextColor={colors.gray300}
                                outlineColor={colors.backgroundLight}
                            />
                        </FormGroup>

                        <ButtonContainer>
                            <SaveButton onPress={handleSave} disabled={saving}>
                                {saving ? (
                                    <ActivityIndicator size="small" color={colors.gray100} />
                                ) : (
                                    <SaveButtonText>Salvar</SaveButtonText>
                                )}
                            </SaveButton>
                        </ButtonContainer>
                    </Content>
                )}
            </Container>
        </PageTransition>
    );
}
