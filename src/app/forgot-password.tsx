import React, { useState } from 'react';
import { Alert, ActivityIndicator, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import styled from 'styled-components/native';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeProvider';

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
            <StatusBar style="light" backgroundColor={colors.primary} />
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
                            <Input
                                placeholder="Digite seu email"
                                placeholderTextColor={colors.textDisabled}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
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

const Container = styled.View`
    flex: 1;
    background-color: ${({ theme }) => theme.colors.backgroundDark};
`;

const Content = styled.View`
    flex: 1;
    padding: 24px;
    justify-content: center;
`;

const Title = styled.Text`
    font-size: 28px;
    font-weight: bold;
    color: ${({ theme }) => theme.colors.text};
    margin-bottom: 24px;
    text-align: center;
`;

const Description = styled.Text`
    font-size: 16px;
    color: ${({ theme }) => theme.colors.textSecondary};
    margin-bottom: 24px;
    text-align: center;
`;

const SuccessMessage = styled.Text`
    font-size: 16px;
    color: ${({ theme }) => theme.colors.success};
    margin-bottom: 24px;
    text-align: center;
    line-height: 24px;
`;

const InputContainer = styled.View`
    margin-bottom: 16px;
`;

const InputLabel = styled.Text`
    font-size: 16px;
    color: ${({ theme }) => theme.colors.text};
    margin-bottom: 8px;
`;

const Input = styled.TextInput`
    background-color: ${({ theme }) => theme.colors.backgroundLight};
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 16px;
    color: ${({ theme }) => theme.colors.text};
    border: 1px solid ${({ theme }) => theme.colors.border};
`;

const ResetButton = styled.TouchableOpacity`
    background-color: ${({ theme }) => theme.colors.primary};
    border-radius: 8px;
    padding: 16px;
    align-items: center;
    margin-top: 16px;
    opacity: ${({ disabled }) => (disabled ? 0.7 : 1)};
`;

const ResetButtonText = styled.Text`
    color: ${({ theme }) => theme.colors.white};
    font-size: 16px;
    font-weight: bold;
`;

const BackButton = styled.TouchableOpacity`
    padding: 16px;
    align-items: center;
    margin-top: 16px;
`;

const BackButtonText = styled.Text`
    color: ${({ theme }) => theme.colors.primary};
    font-size: 16px;
`;