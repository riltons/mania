import React, { useState } from 'react';
import { Alert, ActivityIndicator, StatusBar, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import styled, { DefaultTheme } from 'styled-components/native';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '@/core/contexts/ThemeProvider';

// Define o tipo para as propriedades do tema
interface ThemeProps {
  theme: DefaultTheme;
}

// Define as propriedades do botão
interface ButtonProps extends ThemeProps {
  disabled?: boolean;
}

// Tipo genérico para componentes estilizados
type ThemedStyledProps<P = unknown> = P & ThemeProps;

export default function ForgotPassword() {
    const router = useRouter();
    const { resetPassword } = useAuth();
    const { colors } = useTheme();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert('Erro', 'Por favor, informe seu e-mail');
            return;
        }

        if (!email.includes('@')) {
            Alert.alert('Erro', 'Digite um e-mail válido');
            return;
        }

        setLoading(true);
        try {
            const response = await resetPassword(email);
            
            if (!response.success) {
                Alert.alert('Erro', response.error || 'Não foi possível enviar o e-mail de recuperação');
                return;
            }

            setSuccess(true);
            Alert.alert(
                'E-mail enviado',
                'Enviamos um link de recuperação para o seu e-mail. Por favor, verifique sua caixa de entrada e siga as instruções para redefinir sua senha.',
                [{ text: 'OK' }]
            );
        } catch (error: any) {
            console.error('Erro na recuperação de senha:', error);
            Alert.alert('Erro', 'Não foi possível enviar o e-mail de recuperação. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
            <Content>
                <Title>Recuperar Senha</Title>
                
                {success ? (
                    <>
                        <SuccessMessage>
                            Enviamos um link de recuperação para o seu e-mail. Por favor, verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                        </SuccessMessage>
                        <BackButton onPress={() => router.push('/login')}>
                            <BackButtonText>Voltar para o Login</BackButtonText>
                        </BackButton>
                    </>
                ) : (
                    <>
                        <Description>
                            Digite seu e-mail abaixo e enviaremos um link para redefinir sua senha.
                        </Description>
                        
                        <InputContainer>
                            <InputLabel>Email</InputLabel>
                            <StyledInput
                                placeholder="Digite seu e-mail"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="send"
                                onSubmitEditing={handleResetPassword}
                                editable={!loading}
                            />
                        </InputContainer>

                        <ResetButton onPress={handleResetPassword} disabled={loading}>
                            {loading ? (
                                <ActivityIndicator color={colors.secondary} />
                            ) : (
                                <ResetButtonText>Enviar Link de Recuperação</ResetButtonText>
                            )}
                        </ResetButton>

                        <BackButton onPress={() => router.push('/login')} disabled={loading}>
                            <BackButtonText>Voltar para o Login</BackButtonText>
                        </BackButton>
                    </>
                )}
            </Content>
        </Container>
    );
}

const Container = styled.View<ThemeProps>`
    flex: 1;
    background-color: ${(props: ThemeProps) => props.theme.colors.backgroundLight};
`;

const Content = styled.View<ThemeProps>`
    flex: 1;
    padding: 24px;
    justify-content: center;
`;

const Title = styled.Text<ThemeProps>`
    font-size: 24px;
    font-weight: bold;
    color: ${(props: ThemeProps) => props.theme.colors.textPrimary};
    margin-bottom: 24px;
    text-align: center;
`;

const Description = styled.Text<ThemeProps>`
    font-size: 16px;
    color: ${(props: ThemeProps) => props.theme.colors.textSecondary};
    margin-bottom: 24px;
    text-align: center;
`;

const SuccessMessage = styled.Text<ThemeProps>`
    font-size: 16px;
    color: ${(props: ThemeProps) => props.theme.colors.accent};
    margin-bottom: 24px;
    text-align: center;
    line-height: 24px;
`;

const InputContainer = styled.View<ThemeProps>`
    margin-bottom: 16px;
`;

const InputLabel = styled.Text<ThemeProps>`
    font-size: 16px;
    color: ${(props: ThemeProps) => props.theme.colors.text};
    margin-bottom: 8px;
`;

const StyledInput = styled(TextInput).attrs<ThemeProps>((props: ThemeProps) => ({
  placeholderTextColor: props.theme.colors.textSecondary || '#7C7C8A',
  selectionColor: props.theme.colors.primary,
}))<ThemeProps>`
    background-color: ${(props: ThemeProps) => props.theme.colors.white};
    border-radius: 8px;
    padding: 16px;
    font-size: 16px;
    color: ${(props: ThemeProps) => props.theme.colors.textPrimary};
    margin-bottom: 8px;
    border: 1px solid ${(props: ThemeProps) => props.theme.colors.primary + '50'};
`;

const ResetButton = styled.TouchableOpacity.attrs<ButtonProps>((props: ButtonProps) => ({
  activeOpacity: 0.7,
  disabled: props.disabled,
}))<ButtonProps>`
  background-color: ${(props: ButtonProps) => props.theme.colors.primary};
  border-radius: 8px;
  padding: 16px;
  align-items: center;
  margin-top: 24px;
  opacity: ${(props: ButtonProps) => (props.disabled ? 0.7 : 1)};
`;

const ResetButtonText = styled.Text<ThemeProps>`
    color: ${(props: ThemeProps) => props.theme.colors.white};
    font-size: 16px;
    font-weight: bold;
`;

const ErrorText = styled.Text<ThemeProps>`
    color: ${(props: ThemeProps) => props.theme.colors.accent};
    font-size: 14px;
    margin-top: 4px;
`;

const BackButton = styled.TouchableOpacity<ThemeProps>`
    margin-top: 24px;
    align-items: center;
`;

const BackButtonText = styled.Text<ThemeProps>`
    color: ${(props: ThemeProps) => props.theme.colors.primary};
    font-size: 16px;
`;