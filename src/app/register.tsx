import React, { useState } from 'react';
import { Alert, ActivityIndicator, StatusBar, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import styled from 'styled-components/native';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/userService';
import { useTheme } from '../contexts/ThemeProvider';
import { supabase } from '@/lib/supabase';
import { subscriptionService } from '../services/subscriptionService';

export default function Register() {
    const router = useRouter();
    const { plan } = useLocalSearchParams<{ plan?: string }>();
    const { signUp, signIn } = useAuth();
    const [loading, setLoading] = useState(false);
    const { colors } = useTheme();
    const [form, setForm] = useState({
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
            <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
            <ScrollContent showsVerticalScrollIndicator={false}>
                <FormContainer>
                    <Title>Criar Conta</Title>

                    <Input
                        placeholder="Nome completo"
                        value={form.fullName}
                        onChangeText={(text) => setForm({ ...form, fullName: text })}
                        placeholderTextColor={colors.gray300}
                    />

                    <Input
                        placeholder="E-mail"
                        value={form.email}
                        onChangeText={(text) => setForm({ ...form, email: text })}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholderTextColor={colors.gray300}
                    />

                    <Input
                        placeholder="Senha"
                        value={form.password}
                        onChangeText={(text) => setForm({ ...form, password: text })}
                        secureTextEntry
                        placeholderTextColor={colors.gray300}
                    />

                    <Input
                        placeholder="Confirmar senha"
                        value={form.confirmPassword}
                        onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
                        secureTextEntry
                        placeholderTextColor={colors.gray300}
                    />

                    <Input
                        placeholder="Apelido (opcional)"
                        value={form.nickname}
                        onChangeText={(text) => setForm({ ...form, nickname: text })}
                        placeholderTextColor={colors.gray300}
                    />

                    <Button onPress={handleRegister} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <ButtonText>Criar Conta</ButtonText>
                        )}
                    </Button>

                    <LinkButton onPress={() => router.push('/login')}>
                        <LinkText>Já tem uma conta? Faça login</LinkText>
                    </LinkButton>
                </FormContainer>
            </ScrollContent>
        </Container>
    );
}

const Container = styled.View`
    flex: 1;
    background-color: ${({ theme }) => theme.colors.backgroundDark};
`;

const ScrollContent = styled.ScrollView`
    flex: 1;
`;

const FormContainer = styled.View`
    padding: 20px;
`;

const Title = styled.Text`
    font-size: 24px;
    font-weight: bold;
    color: ${({ theme }) => theme.colors.gray100};
    margin-bottom: 24px;
    text-align: center;
`;

const Input = styled.TextInput`
    background-color: ${({ theme }) => theme.colors.backgroundMedium};
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 16px;
    color: ${({ theme }) => theme.colors.gray100};
    font-size: 16px;
`;

const Button = styled.TouchableOpacity`
    background-color: ${({ theme, disabled }) => 
        disabled ? theme.colors.primary + '80' : theme.colors.primary};
    border-radius: 8px;
    padding: 16px;
    align-items: center;
    margin-top: 8px;
`;

const ButtonText = styled.Text`
    color: ${({ theme }) => theme.colors.white};
    font-size: 16px;
    font-weight: bold;
`;

const LinkButton = styled.TouchableOpacity`
    margin-top: 16px;
    align-items: center;
`;

const LinkText = styled.Text`
    color: ${({ theme }) => theme.colors.primary};
    font-size: 14px;
`;
