import React, { useState } from 'react';
import { Alert, ActivityIndicator, TouchableOpacity, Image, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import styled from 'styled-components/native';
import { useRouter } from 'expo-router';
import { InternalHeader } from '@/components/InternalHeader';
import { playerService } from '@/services/playerService';
import { Feather } from '@expo/vector-icons';
import { TextInput } from 'react-native-paper';
import { useTheme } from 'styled-components/native';

type ThemeProps = {
    theme: {
        colors: {
            backgroundDark: string;
            textPrimary: string;
            accent: string;
            white: string;
            textSecondary: string;
            backgroundLight: string;
        }
    }
};

export default function NovoJogador() {
    const router = useRouter();
    const { colors } = useTheme();
    const [formData, setFormData] = useState({
        name: '',
        phone: ''
    });
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

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
        });
        
        if (!result.canceled) {
            setImage(result.assets[0].uri);
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

        try {
            setLoading(true);
            // Criar o jogador
            const newPlayer = await playerService.create({
                name: formData.name.trim(),
                phone: formData.phone.trim()
            });
            
            // Se tiver imagem selecionada, fazer upload
            if (image && newPlayer && 'id' in newPlayer) {
                try {
                    await playerService.uploadAvatar(newPlayer.id as string, image);
                } catch (uploadError) {
                    console.error('Erro ao fazer upload da foto:', uploadError);
                    // Continua mesmo com erro no upload da foto
                }
            }
            
            router.back();
        } catch (error: any) {
            console.error('Erro ao criar jogador:', error);
            Alert.alert(
                'Erro',
                error?.message || 'Erro ao criar jogador. Tente novamente.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <InternalHeader title="Novo Jogador" />
            <Content>
                <AvatarContainer>
                    <AvatarButton onPress={pickImage}>
                        {image ? (
                            <AvatarImage source={{ uri: image }} />
                        ) : (
                            <AvatarPlaceholder>
                                <Feather name="camera" size={24} color={colors.textSecondary} />
                                <AvatarText>Adicionar foto</AvatarText>
                            </AvatarPlaceholder>
                        )}
                    </AvatarButton>
                </AvatarContainer>

                <FormGroup>
                    <Label>Nome</Label>
                    <TextInput
                        mode="outlined"
                        value={formData.name}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                        placeholder="Nome do jogador"
                        style={{
                            backgroundColor: colors.backgroundDark,
                        }}
                        theme={{
                            colors: {
                                primary: colors.accent,
                                text: colors.textPrimary,
                                placeholder: colors.textSecondary,
                                background: colors.backgroundDark,
                                surface: colors.backgroundDark,
                                onSurface: colors.textPrimary,
                                outline: colors.backgroundLight,
                            }
                        }}
                    />
                </FormGroup>

                <FormGroup>
                    <Label>Celular</Label>
                    <TextInput
                        mode="outlined"
                        value={formData.phone}
                        onChangeText={(text) => {
                            // Remove tudo que não for número
                            const numericOnly = text.replace(/\D/g, '');
                            // Limita a 11 caracteres
                            const limitedText = numericOnly.slice(0, 11);
                            setFormData(prev => ({ ...prev, phone: limitedText }));
                        }}
                        placeholder="(00) 00000-0000"
                        keyboardType="phone-pad"
                        maxLength={11}
                        style={{
                            backgroundColor: colors.backgroundDark,
                        }}
                        theme={{
                            colors: {
                                primary: colors.accent,
                                text: colors.textPrimary,
                                placeholder: colors.textSecondary,
                                background: colors.backgroundDark,
                                surface: colors.backgroundDark,
                                onSurface: colors.textPrimary,
                                outline: colors.backgroundLight,
                            }
                        }}
                    />
                </FormGroup>

                <SaveButton onPress={handleSave} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <SaveButtonText>Criar Jogador</SaveButtonText>
                    )}
                </SaveButton>
            </Content>
        </Container>
    );
}

const Container = styled.View`
    flex: 1;
    background-color: ${({ theme }: ThemeProps) => theme.colors.backgroundDark};
`;

const Content = styled.ScrollView.attrs({
    contentContainerStyle: {
        flexGrow: 1,
        padding: 20,
    },
})`
    padding-bottom: 20px;
`;

const FormGroup = styled.View`
    margin-bottom: 20px;
`;

const Label = styled.Text`
    font-size: 16px;
    color: ${({ theme }: ThemeProps) => theme.colors.textPrimary};
    margin-bottom: 8px;
`;

const SaveButton = styled.TouchableOpacity<{ disabled?: boolean }>`
    background-color: ${({ theme }: ThemeProps) => theme.colors.accent};
    padding: 16px;
    border-radius: 8px;
    align-items: center;
    opacity: ${(props: { disabled?: boolean }) => props.disabled ? 0.7 : 1};
`;

const SaveButtonText = styled.Text`
    color: ${({ theme }: ThemeProps) => theme.colors.white};
    font-size: 16px;
    font-weight: bold;
`;

const AvatarContainer = styled.View`
    align-items: center;
    margin-bottom: 24px;
`;

const AvatarButton = styled.TouchableOpacity`
    width: 100px;
    height: 100px;
    border-radius: 50px;
    background-color: ${({ theme }: ThemeProps) => theme.colors.backgroundLight};
    overflow: hidden;
    justify-content: center;
    align-items: center;
`;

const AvatarImage = styled.Image`
    width: 100%;
    height: 100%;
`;

const AvatarPlaceholder = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
`;

const AvatarText = styled.Text`
    color: ${({ theme }: ThemeProps) => theme.colors.textSecondary};
    font-size: 12px;
    margin-top: 8px;
`;
