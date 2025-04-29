import React, { useState, useEffect } from 'react';
import { Alert, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import styled from 'styled-components/native';
import { communityService } from '@/services/communityService';
import { InternalHeader } from '@/components/InternalHeader';
import { Feather } from '@expo/vector-icons';
import { TextInput } from 'react-native-paper';
import { useTheme } from '@/contexts/ThemeProvider';

export default function EditarComunidade() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { colors } = useTheme();
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
            
            // Redireciona para a página de comunidades
            Alert.alert('Sucesso', 'Comunidade atualizada com sucesso', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/comunidades') }
            ]);
        } catch (error: any) {
            console.error('Erro ao atualizar comunidade:', error);
            Alert.alert(
                'Erro',
                error?.message || 'Erro ao atualizar comunidade. Tente novamente.'
            );
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <Container colors={colors}>
                <InternalHeader title="Editar Comunidade" />
                <LoadingContainer>
                    <ActivityIndicator size="large" color={colors.primary} />
                </LoadingContainer>
            </Container>
        );
    }

    return (
        <Container colors={colors}>
            <InternalHeader title="Editar Comunidade" />
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
                            <SaveButtonText colors={colors}>Salvar Alterações</SaveButtonText>
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

const LoadingContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
`;
