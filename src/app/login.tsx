import React, { useState } from 'react';
import { Alert, ActivityIndicator, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import styled from 'styled-components/native';
import { useAuth } from '@/features/auth/contexts/AuthProvider';
import { useTheme } from '@/core/contexts/ThemeProvider';
import { DefaultTheme } from 'styled-components';

// Interfaces para tipagem dos componentes estilizados
interface ThemeProps {
    theme: DefaultTheme;
}

interface ButtonProps extends ThemeProps {
    disabled?: boolean;
}

export default function Login() {
    const router = useRouter();
    const { signIn } = useAuth();
    const { colors } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos');
            return;
        }

        if (!email.includes('@')) {
            Alert.alert('Erro', 'Digite um e-mail válido');
            return;
        }

        setLoading(true);
        try {
            const response = await signIn(email, password);
            
            if (!response.success) {
                Alert.alert('Erro', response.error || 'E-mail ou senha incorretos');
                return;
            }

            console.log('Login bem-sucedido, redirecionando para dashboard');
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error('Erro no login:', error);
            Alert.alert('Erro', 'E-mail ou senha incorretos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
            <Content>
                <Title>Login</Title>
                
                <InputContainer>
                    <InputLabel>Email</InputLabel>
                    <Input
                        placeholder="Digite seu email"
                        placeholderTextColor={colors.text + '80'}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </InputContainer>

                <InputContainer>
                    <InputLabel>Senha</InputLabel>
                    <Input
                        placeholder="Digite sua senha"
                        placeholderTextColor={colors.text + '80'}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </InputContainer>

                <LoginButton onPress={handleLogin} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color={colors.secondary} />
                    ) : (
                        <LoginButtonText>Entrar</LoginButtonText>
                    )}
                </LoginButton>

                <ForgotPasswordButton onPress={() => router.push('/forgot-password')} disabled={loading}>
                    <ForgotPasswordText>Esqueceu sua senha?</ForgotPasswordText>
                </ForgotPasswordButton>

                <SignUpButton onPress={() => router.push('/register')} disabled={loading}>
                    <SignUpButtonText>Não tem uma conta? Cadastre-se</SignUpButtonText>
                </SignUpButton>
            </Content>
        </Container>
    );
}

const Container = styled.View`
    flex: 1;
    background-color: ${({ theme }: ThemeProps) => theme.colors.backgroundDark};
`;

const Content = styled.View`
    flex: 1;
    padding: 24px;
    justify-content: center;
`;

const Title = styled.Text`
    font-size: 32px;
    font-weight: bold;
    color: ${({ theme }: ThemeProps) => theme.colors.primary};
    margin-bottom: 32px;
    text-align: center;
`;

const InputContainer = styled.View`
    margin-bottom: 16px;
`;

const InputLabel = styled.Text`
    font-size: 16px;
    font-weight: 500;
    color: ${({ theme }: ThemeProps) => theme.colors.textPrimary};
    margin-bottom: 8px;
`;

const Input = styled.TextInput`
    background-color: ${({ theme }: ThemeProps) => theme.colors.tertiary};
    border-radius: 8px;
    padding: 16px;
    font-size: 16px;
    color: ${({ theme }: ThemeProps) => theme.colors.textPrimary};
    border: 1px solid ${({ theme }: ThemeProps) => theme.colors.primary + '50'};
`;

const LoginButton = styled.TouchableOpacity`
    background-color: ${({ theme }: ButtonProps) => theme.colors.primary};
    border-radius: 8px;
    padding: 16px;
    align-items: center;
    margin-top: 24px;
    opacity: ${({ disabled }: ButtonProps) => (disabled ? 0.7 : 1)};
`;

const LoginButtonText = styled.Text`
    font-size: 16px;
    font-weight: bold;
    color: ${({ theme }: ThemeProps) => theme.colors.white};
`;

const ForgotPasswordButton = styled.TouchableOpacity`
    padding: 12px;
    align-items: center;
    margin-top: 8px;
`;

const ForgotPasswordText = styled.Text`
    color: ${({ theme }: ThemeProps) => theme.colors.primary};
    font-size: 14px;
`;

const SignUpButton = styled.TouchableOpacity`
    padding: 16px;
    align-items: center;
    margin-top: 16px;
`;

const SignUpButtonText = styled.Text`
    font-size: 16px;
    color: ${({ theme }: ThemeProps) => theme.colors.primary};
`;