import React, { useState } from 'react';
import { Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import styled from 'styled-components/native';
import { colors } from '@/styles/colors';
import { competitionService } from '@/services/competitionService';
import { InternalHeader } from '@/components/InternalHeader';
import { Feather } from '@expo/vector-icons';

export default function NovaCompeticao() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: new Date(),
        endDate: new Date(),
    });
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!formData.name.trim()) {
            Alert.alert('Erro', 'O nome da competição é obrigatório');
            return;
        }
        
        setLoading(true);
        try {
            const result = await competitionService.create({
                name: formData.name.trim(),
                description: formData.description.trim(),
                communityId: params.id as string,
            });
            
            console.log('[DEBUG] Resultado da criação de competição (nova-competicao):', JSON.stringify(result));
            
            // Verificar se há erro de limite de plano
            if (result && result.error && result.planLimit) {
                Alert.alert(
                    'Limite de Competições',
                    'Plano gratuito permite no máximo 2 competições ativas por comunidade. Faça upgrade para criar mais.',
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Ver Planos', onPress: () => router.push('/pricing?hideFree=true') }
                    ],
                );
                return;
            }
            
            // Se não houver erro, continuar
            if (result && result.success) {
                router.replace(`/comunidade/${params.id}`);
            }
        } catch (error: any) {
            // Tratamento para outros erros
            Alert.alert('Erro', error?.message || 'Erro ao criar competição. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <InternalHeader title="Nova Competição" />
            <Content>
                <Form>
                    <FormGroup>
                        <Label>Nome</Label>
                        <Input
                            value={formData.name}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                            placeholder="Nome da competição"
                            placeholderTextColor={colors.gray300}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>Descrição</Label>
                        <Input
                            value={formData.description}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                            placeholder="Descrição da competição"
                            placeholderTextColor={colors.gray300}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </FormGroup>

                    <SaveButton disabled={loading} onPress={handleSave}>
                        {loading ? (
                            <ActivityIndicator color={colors.gray100} />
                        ) : (
                            <SaveButtonText>Criar Competição</SaveButtonText>
                        )}
                    </SaveButton>
                </Form>
            </Content>
        </Container>
    );
}

const Container = styled.View`
    flex: 1;
    background-color: ${colors.backgroundDark};
`;

const Content = styled.ScrollView.attrs({
    contentContainerStyle: {
        flexGrow: 1,
        padding: 20,
    },
})``;

const Form = styled.View`
    flex: 1;
`;

const FormGroup = styled.View`
    margin-bottom: 20px;
`;

const Label = styled.Text`
    font-size: 16px;
    color: ${colors.gray100};
    margin-bottom: 8px;
`;

const Input = styled.TextInput`
    background-color: ${colors.secondary};
    border-radius: 8px;
    padding: 12px;
    font-size: 16px;
    color: ${colors.gray100};
    min-height: ${props => props.multiline ? '120px' : '48px'};
`;

const SaveButton = styled.TouchableOpacity`
    background-color: ${colors.primary};
    padding: 16px;
    border-radius: 8px;
    align-items: center;
    margin-top: 20px;
`;

const SaveButtonText = styled.Text`
    color: ${colors.gray100};
    font-size: 16px;
    font-weight: bold;
`;
