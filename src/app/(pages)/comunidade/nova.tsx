import React, { useState } from 'react';
import { Alert, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import styled from 'styled-components/native';
import { communityService } from '@/services/communityService';
import { InternalHeader } from '@/components/InternalHeader';
import { Feather } from '@expo/vector-icons';
import { TextInput } from 'react-native-paper';
import { useTheme } from '@/contexts/ThemeProvider';

export default function NovaComunidade() {
    const router = useRouter();
    const { colors } = useTheme();
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!formData.name.trim()) {
            Alert.alert('Erro', 'O nome da comunidade é obrigatório');
            return;
        }

        try {
            setLoading(true);
            await communityService.create({
                name: formData.name.trim(),
                description: formData.description.trim()
            });
            
            // Limpa o formulário
            setFormData({
                name: '',
                description: ''
            });
            
            // Redireciona para a página de comunidades
            router.replace('/(tabs)/comunidades');
        } catch (error: any) {
            if (error?.message?.includes('Plano gratuito permite criar apenas 1 comunidade')) {
                Alert.alert(
                    'Limite de Comunidades',
                    'Plano gratuito permite criar apenas 1 comunidade. Faça upgrade para criar mais.',
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Ver Planos', onPress: () => router.push('/pricing?hideFree=true') }
                    ]
                );
                return;
            }
            console.error('Erro ao criar comunidade:', error);
            Alert.alert(
                'Erro',
                error?.message || 'Erro ao criar comunidade. Tente novamente.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container colors={colors}>
            <InternalHeader title="Nova Comunidade" />
            <ScrollView>
                <Content colors={colors}>
                    <FormGroup>
                        <Label colors={colors}>Nome</Label>
                        <TextInput
                            mode="outlined"
                            value={formData.name}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                            placeholder="Nome da comunidade"
                            style={{
                                backgroundColor: colors.backgroundDark,
                            }}
                            theme={{
                                colors: {
                                    primary: colors.primary,
                                    text: colors.text,
                                    placeholder: colors.gray300,
                                    background: colors.backgroundDark,
                                    surface: colors.backgroundDark,
                                    onSurface: colors.text,
                                    outline: colors.gray700,
                                }
                            }}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label colors={colors}>Descrição</Label>
                        <TextInput
                            mode="outlined"
                            value={formData.description}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                            placeholder="Descrição da comunidade"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            contentStyle={{
                                paddingTop: 16,
                                minHeight: 120,
                            }}
                            style={{
                                backgroundColor: colors.backgroundDark,
                            }}
                            theme={{
                                colors: {
                                    primary: colors.primary,
                                    text: colors.text,
                                    placeholder: colors.gray300,
                                    background: colors.backgroundDark,
                                    surface: colors.backgroundDark,
                                    onSurface: colors.text,
                                    outline: colors.gray700,
                                }
                            }}
                        />
                    </FormGroup>

                    <SaveButton colors={colors} disabled={loading} onPress={handleSave}>
                        {loading ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <SaveButtonText colors={colors}>Criar Comunidade</SaveButtonText>
                        )}
                    </SaveButton>
                </Content>
            </ScrollView>
        </Container>
    );
}

const Container = styled.View<{ colors: any }>`
    flex: 1;
    background-color: ${({ colors }) => colors.backgroundDark};
`;

const Content = styled.View<{ colors: any }>`
    padding: 16px;
    gap: 16px;
    background-color: ${({ colors }) => colors.backgroundDark};
`;

const FormGroup = styled.View`
    gap: 8px;
`;

const Label = styled.Text<{ colors: any }>`
    font-size: 16px;
    color: ${({ colors }) => colors.text};
`;

const SaveButton = styled.TouchableOpacity<{ colors: any; disabled?: boolean }>`
    background-color: ${({ colors }) => colors.primary};
    padding: 16px;
    border-radius: 8px;
    align-items: center;
    justify-content: center;
    opacity: ${({ disabled }) => disabled ? 0.7 : 1};
`;

const SaveButtonText = styled.Text<{ colors: any }>`
    color: ${({ colors }) => colors.white};
    font-size: 16px;
    font-weight: bold;
`;
