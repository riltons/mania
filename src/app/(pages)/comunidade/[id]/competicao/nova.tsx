import React, { useState } from 'react';
import { Alert, TouchableOpacity, ActivityIndicator as ActivityIndicatorRN, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import styled from 'styled-components/native';
import { useTheme } from '@/contexts/ThemeProvider';
import { Feather as Icon } from '@expo/vector-icons';
import { competitionService } from '@/services/competitionService';
import { DatePickerInput as DatePickerInputRN } from 'react-native-paper-dates';
import { PaperProvider, TextInput as TextInputRN } from 'react-native-paper';
import { View, Text } from 'react-native';

interface NovaCompeticaoProps {
    communityId: string;
}

export default function NovaCompeticao(props: NovaCompeticaoProps) {
    const router = useRouter();
    const { id: communityId } = useLocalSearchParams();
    const { colors, theme: appTheme } = useTheme();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        start_date: new Date()
    });
    const [loading, setLoading] = useState(false);

    const paperTheme = {
        colors: {
            primary: colors.primary,
            surface: colors.backgroundLight,
            text: colors.textPrimary,
            placeholder: colors.textSecondary,
            backdrop: colors.overlay,
            background: colors.backgroundDark,
            onSurface: colors.textPrimary,
            outline: colors.border,
        }
    };

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
                community_id: communityId as string,
                start_date: formData.start_date.toISOString()
            });
            
            console.log('[DEBUG] Resultado da criação de competição:', JSON.stringify(result));
            
            // Verificar se há erro de limite de plano
            if (result && result.error && result.planLimit) {
                Alert.alert(
                    'Limite de Competições',
                    'Plano gratuito permite no máximo 2 competições ativas por comunidade. Faça upgrade para criar mais.',
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Ver Planos', onPress: () => router.push('/pricing?hideFree=true') }
                    ]
                );
                return;
            }
            
            // Se não houver erro, continuar
            if (result && result.success) {
                await competitionService.refreshCompetitions(communityId as string);
                router.back();
            }
        } catch (error: any) {
            // Tratamento para outros erros
            Alert.alert('Erro', error?.message || 'Erro ao criar competição. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PaperProvider theme={paperTheme}>
            <Container colors={colors}>
                <InternalHeader title="Nova Competição" />
                <Content>
                    <FormGroup>
                        <Label colors={colors}>Nome da Competição</Label>
                        <Input
                            mode="outlined"
                            placeholder="Digite o nome da competição"
                            value={formData.name}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                            style={{
                                backgroundColor: colors.backgroundLight,
                            }}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label colors={colors}>Descrição</Label>
                        <Input
                            mode="outlined"
                            placeholder="Digite uma descrição (opcional)"
                            value={formData.description}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                            multiline
                            numberOfLines={4}
                            style={{
                                backgroundColor: colors.backgroundLight,
                            }}
                        />
                    </FormGroup>

                    <DatePickerContainer>
                        <Label colors={colors}>Data de Início</Label>
                        <DatePickerInput
                            locale="pt-BR"
                            label="Data"
                            value={formData.start_date}
                            onChange={(date) => date && setFormData(prev => ({ ...prev, start_date: date }))}
                            inputMode="start"
                            mode="outlined"
                            style={{
                                backgroundColor: colors.backgroundLight,
                            }}
                        />
                    </DatePickerContainer>

                    <ButtonContainer>
                        <SaveButton 
                            onPress={handleSave}
                            disabled={loading}
                            colors={colors}
                        >
                            {loading ? (
                                <ActivityIndicator color={colors.white} size="small" />
                            ) : (
                                <>
                                    <Feather name="save" size={20} color={colors.white} />
                                    <ButtonText colors={colors}>Salvar Competição</ButtonText>
                                </>
                            )}
                        </SaveButton>
                    </ButtonContainer>
                </Content>
            </Container>
        </PaperProvider>
    );
}

interface ContainerProps {
    colors: {
        backgroundDark: string;
    };
}

const Container = styled.View<ContainerProps>`
    flex: 1;
    background-color: ${props => props.colors.backgroundDark};
`;

interface ContentProps {
    
}

const Content = styled.ScrollView<ContentProps>`
    flex: 1;
    padding: 16px;
`;

interface FormGroupProps {
    
}

const FormGroup = styled.View<FormGroupProps>`
    margin-bottom: 16px;
`;

interface LabelProps {
    colors: {
        textPrimary: string;
    };
}

const Label = styled.Text<LabelProps>`
    font-size: 16px;
    margin-bottom: 8px;
    color: ${props => props.colors.textPrimary};
`;

interface DatePickerContainerProps {
    
}

const DatePickerContainer = styled.View<DatePickerContainerProps>`
    margin-bottom: 20px;
`;

interface ButtonContainerProps {
    
}

const ButtonContainer = styled.View<ButtonContainerProps>`
    margin-top: 20px;
`;

interface SaveButtonProps {
    disabled?: boolean;
    colors: {
        primary: string;
        gray500: string;
        white: string;
    };
}

const SaveButton = styled.TouchableOpacity<SaveButtonProps>`
    background-color: ${props => props.disabled ? props.colors.gray500 : props.colors.primary};
    padding: 16px;
    border-radius: 8px;
    align-items: center;
    opacity: ${props => props.disabled ? 0.7 : 1};
    flex-direction: row;
    justify-content: center;
`;

interface ButtonTextProps {
    colors: {
        white: string;
    };
}

const ButtonText = styled.Text<ButtonTextProps>`
    color: ${props => props.colors.white};
    font-size: 16px;
    font-weight: bold;
    margin-left: 8px;
`;

interface InternalHeaderProps {
    title: string;
}

const InternalHeader = (props: InternalHeaderProps) => (
    <View><Text>{props.title}</Text></View>
);

interface InputProps {
    mode: 'flat' | 'outlined';
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    style: any;
    multiline?: boolean;
    numberOfLines?: number;
}

const Input = (props: InputProps) => (
    <TextInputRN {...props} />
);

interface DatePickerInputProps {
    locale: string;
    label: string;
    value: Date;
    onChange: (date: Date | undefined) => void;
    inputMode: 'start' | 'end';
    mode: 'flat' | 'outlined';
    style: any;
}

const DatePickerInput = (props: DatePickerInputProps) => (
    <DatePickerInputRN {...props} />
);

interface ActivityIndicatorProps {
    color: string;
    size: number | 'small' | 'large';
}

const ActivityIndicator = (props: ActivityIndicatorProps) => (
    <ActivityIndicatorRN {...props} />
);

interface FeatherProps {
    name: 'lock' | 'search' | 'repeat' | 'anchor' | 'save';
    size: number;
    color: string;
}

const Feather = (props: FeatherProps) => (
    <Icon {...props} />
);

interface Componente145Props {
    communityId: string;
}

const Componente145 = (props: Componente145Props) => <View />;

interface Componente160Props {
    propriedade1: string;
    propriedade2: number;
}

const Componente160 = (props: Componente160Props) => <View />;

interface Componente172Props {
    propriedade1: string;
    propriedade2: number;
}

const Componente172 = (props: Componente172Props) => <View />;

interface Componente176Props {
    propriedade1: string;
    propriedade2: number;
}

const Componente176 = (props: Componente176Props) => <View />;

interface Componente182Props {
    propriedade1: string;
    propriedade2: number;
}

const Componente182 = (props: Componente182Props) => <View />;
