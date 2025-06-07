import React, { useState } from 'react';
import { Alert, ActivityIndicator, StatusBar } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import styled from 'styled-components/native';
import { useAuth } from '@/core/hooks/useAuth';
import { useTheme } from '@/core/contexts/ThemeProvider';
import { subscriptionService } from '@/services/subscriptionService';

// Tipagem para o formulário
interface RegisterForm {
    email: string;
    password: string;
    confirmPassword: string;
    fullName: string;
    nickname: string;
}

// Tipagem para as props dos botões
interface ButtonProps {
    disabled?: boolean;
}

export default function Register() {
    const router = useRouter();
    const { plan } = useLocalSearchParams<{ plan?: string }>();
    const { signUp, signIn } = useAuth();
    const [loading, setLoading] = useState(false);
    const { colors } = useTheme();
    const [form, setForm] = useState<RegisterForm>({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        nickname: ''
    });

    const handleRegister = async () => {
        if (!form.email || !form.password || !form.fullName) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
            return;
        }

        // Adicionar validação de email
        if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.email)) {
            Alert.alert('Erro', 'Por favor, insira um email válido');
            return;
        }

        if (form.password !== form.confirmPassword) {
            Alert.alert('Erro', 'As senhas não conferem');
            return;
        }

        if (form.password.length < 6) {
            Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            // 1. Criar conta de autenticação
            const { data, error: signUpError } = await signUp(form.email, form.password, form.fullName);
            
            if (signUpError) {
                throw new Error(signUpError);
            }

            if (!data?.user) {
                throw new Error('Erro ao criar usuário. Por favor, tente novamente.');
            }

            // 3. Fazer login automático
            const { error: signInError } = await signIn(form.email, form.password);
            
            if (signInError) {
                throw new Error(signInError);
            }

            // Se veio do plano gratuito, atribuir plano free
            if (plan) {
                if (plan === 'free') {
                    await subscriptionService.assignFreePlan(data.user.id);
                } else {
                    await subscriptionService.startUserTrial(data.user.id, plan);
                }
            }
            // Após login automático, exibe onboarding em vez do dashboard
            router.replace('/onboarding');

        } catch (error: any) {
            console.error('Erro completo no registro:', error);
            Alert.alert(
                'Erro',
                typeof error === 'string' ? error : error?.message || 'Não foi possível criar sua conta. Tente novamente.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <StatusBar style="light" backgroundColor={colors.primary} />
            <Content>
                <Title>Criar Conta</Title>

                <InputContainer>
                    <InputLabel>Nome completo</InputLabel>
                    <Input
                        placeholder="Digite seu nome completo"
                        value={form.fullName}
                        onChangeText={(text: string) => setForm({ ...form, fullName: text })}
                        placeholderTextColor={colors.textDisabled}
                    />
                </InputContainer>

                <InputContainer>
                    <InputLabel>E-mail</InputLabel>
                    <Input
                        placeholder="Digite seu e-mail"
                        value={form.email}
                        onChangeText={(text: string) => setForm({ ...form, email: text })}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholderTextColor={colors.textDisabled}
                    />
                </InputContainer>

                <InputContainer>
                    <InputLabel>Senha</InputLabel>
                    <Input
                        placeholder="Digite sua senha"
                        value={form.password}
                        onChangeText={(text: string) => setForm({ ...form, password: text })}
                        secureTextEntry
                        placeholderTextColor={colors.textDisabled}
                    />
                </InputContainer>

                <InputContainer>
                    <InputLabel>Confirmar senha</InputLabel>
                    <Input
                        placeholder="Confirme sua senha"
                        value={form.confirmPassword}
                        onChangeText={(text: string) => setForm({ ...form, confirmPassword: text })}
                        secureTextEntry
                        placeholderTextColor={colors.textDisabled}
                    />
                </InputContainer>

                <InputContainer>
                    <InputLabel>Apelido (opcional)</InputLabel>
                    <Input
                        placeholder="Digite um apelido (opcional)"
                        value={form.nickname}
                        onChangeText={(text: string) => setForm({ ...form, nickname: text })}
                        placeholderTextColor={colors.textDisabled}
                    />
                </InputContainer>

                <RegisterButton onPress={handleRegister} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color={colors.gray900} />
                    ) : (
                        <RegisterButtonText>Criar Conta</RegisterButtonText>
                    )}
                </RegisterButton>

                <LoginButton onPress={() => router.push('/login')} disabled={loading}>
                    <LoginButtonText>Já tem uma conta? Faça login</LoginButtonText>
                </LoginButton>
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
    font-size: 32px;
    font-weight: bold;
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 32px;
    text-align: center;
`;

const InputContainer = styled.View`
    margin-bottom: 16px;
`;

const InputLabel = styled.Text`
    font-size: 16px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.textPrimary};
    margin-bottom: 8px;
`;

const Input = styled.TextInput`
    background-color: ${({ theme }) => theme.colors.tertiary};
    border-radius: 8px;
    padding: 16px;
    font-size: 16px;
    color: ${({ theme }) => theme.colors.textPrimary};
    border: 1px solid ${({ theme }) => theme.colors.border};
`;

interface ButtonProps {
    disabled?: boolean;
}

const RegisterButton = styled.TouchableOpacity<ButtonProps>`
    background-color: ${({ theme }) => theme.colors.primary};
    border-radius: 8px;
    padding: 16px;
    align-items: center;
    margin-top: 24px;
    opacity: ${({ disabled }) => (disabled ? 0.7 : 1)};
`;

const RegisterButtonText = styled.Text`
    font-size: 16px;
    font-weight: bold;
    color: ${({ theme }) => theme.colors.gray900};
`;

const LoginButton = styled.TouchableOpacity`
    padding: 12px;
    align-items: center;
    margin-top: 8px;
`;

const LoginButtonText = styled.Text`
    font-size: 14px;
    color: ${({ theme }) => theme.colors.primary};
    text-align: center;
`;

