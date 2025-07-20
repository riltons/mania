import React, { useState, useEffect } from 'react';
import { Alert, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import styled from 'styled-components/native';
import { communityService } from '@/features/communities/services/communityService';
import { InternalHeader } from '@/core/components/layout/InternalHeader';
import { Feather } from '@expo/vector-icons';
import { TextInput } from 'react-native-paper';
import { useTheme } from '@/core/contexts/ThemeProvider';
import { colors } from '@/core/styles/colors';
import { ColorType } from '@/core/styles/themes';

interface ThemeProps {
    theme?: { colors?: any };
}

interface ButtonProps extends ThemeProps {
    disabled?: boolean;
}

// Cores padrão como fallback usando as cores do sistema
const defaultColors: ColorType = colors as ColorType;

export default function EditarComunidade() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    
    // Adicionar try-catch para capturar erros do useTheme
    let themeData;
    let safeColors: ColorType = defaultColors;
    let safeTheme = { colors: defaultColors };
    
    try {
        themeData = useTheme();
        safeColors = themeData?.colors || defaultColors;
        safeTheme = { colors: safeColors };
    } catch (error) {
        console.warn('[EditarComunidade] Erro ao obter tema, usando cores padrão:', error);
    }
    
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        const loadCommunity = async () => {
            try {
                setInitialLoading(true);
                const community = await communityService.getById(id as string);
                setFormData({
                    name: community.name || '',
                    description: community.description || ''
                });
            } catch (error) {
                console.error('Erro ao carregar comunidade:', error);
                Alert.alert(
                    'Erro',
                    'Não foi possível carregar os dados da comunidade. Tente novamente.'
                );
                router.back();
            } finally {
                setInitialLoading(false);
            }
        };

        if (id) {
            loadCommunity();
        }
    }, [id]);

    const handleSave = async () => {
        if (!formData.name.trim()) {
            Alert.alert('Erro', 'O nome da comunidade é obrigatório');
            return;
        }

        try {
            setLoading(true);
            await communityService.updateCommunity(id as string, {
                name: formData.name.trim(),
                description: formData.description.trim()
            });
            Alert.alert('Sucesso', 'Comunidade atualizada com sucesso!');
            router.back();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            Alert.alert('Erro', 'Não foi possível salvar as alterações. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <Container theme={safeTheme}>
                <InternalHeader 
                    title="Editar Comunidade" 
                />
                <LoadingContainer>
                    <ActivityIndicator size="large" color={safeColors.primary} />
                </LoadingContainer>
            </Container>
        );
    }

    return (
        <Container theme={safeTheme}>
            <InternalHeader 
                title="Editar Comunidade" 
            />
            <ScrollView style={{ flex: 1 }}>
                <Content theme={safeTheme}>
                    <FormGroup>
                        <Label theme={safeTheme}>Nome da Comunidade</Label>
                        <TextInput
                            value={formData.name}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                            placeholder="Digite o nome da comunidade"
                            mode="outlined"
                            theme={{
                                colors: {
                                    primary: safeColors.primary,
                                    background: safeColors.backgroundLight,
                                    surface: safeColors.backgroundLight,
                                    text: safeColors.textPrimary,
                                    placeholder: safeColors.textSecondary,
                                    outline: safeColors.border,
                                }
                            }}
                            style={{
                                backgroundColor: safeColors.backgroundLight,
                            }}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label theme={safeTheme}>Descrição</Label>
                        <TextInput
                            value={formData.description}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                            placeholder="Digite uma descrição para a comunidade"
                            mode="outlined"
                            multiline
                            numberOfLines={4}
                            theme={{
                                colors: {
                                    primary: safeColors.primary,
                                    background: safeColors.backgroundLight,
                                    surface: safeColors.backgroundLight,
                                    text: safeColors.textPrimary,
                                    placeholder: safeColors.textSecondary,
                                    outline: safeColors.border,
                                }
                            }}
                            style={{
                                backgroundColor: safeColors.backgroundLight,
                            }}
                        />
                    </FormGroup>

                    <SaveButton 
                        theme={safeTheme} 
                        disabled={loading || !formData.name.trim()}
                        onPress={handleSave}
                    >
                        {loading ? (
                            <ActivityIndicator color={safeColors.white} />
                        ) : (
                            <SaveButtonText theme={safeTheme}>Salvar Alterações</SaveButtonText>
                        )}
                    </SaveButton>
                </Content>
            </ScrollView>
        </Container>
    );
}

const Container = styled.View<ThemeProps>`
    flex: 1;
    background-color: ${({ theme }: ThemeProps) => theme?.colors?.backgroundDark || '#1a1a1a'};
`;

const Content = styled.View<ThemeProps>`
    padding: 16px;
    gap: 16px;
    background-color: ${({ theme }: ThemeProps) => theme?.colors?.backgroundDark || '#1a1a1a'};
`;

const FormGroup = styled.View`
    gap: 8px;
`;

const Label = styled.Text<ThemeProps>`
    font-size: 16px;
    color: ${({ theme }: ThemeProps) => theme?.colors?.textPrimary || '#ffffff'};
`;

const SaveButton = styled.TouchableOpacity<ButtonProps>`
    background-color: ${({ theme }: ThemeProps) => theme?.colors?.primary || '#007AFF'};
    padding: 16px;
    border-radius: 8px;
    align-items: center;
    justify-content: center;
    opacity: ${({ disabled }: ButtonProps) => disabled ? 0.7 : 1};
`;

const SaveButtonText = styled.Text<ThemeProps>`
    color: ${({ theme }: ThemeProps) => theme?.colors?.white || '#ffffff'};
    font-size: 16px;
    font-weight: bold;
`;

const LoadingContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
`;
