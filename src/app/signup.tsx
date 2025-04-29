import React, { useState } from 'react';
import { Alert, ActivityIndicator } from 'react-native';
import { Link, router } from 'expo-router';
import styled from 'styled-components/native';
import { colors } from '@/styles/colors';
import { supabase } from '@/lib/supabase';

const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export default function SignUp() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleSignUp = async () => {
        if (!formData.name.trim()) {
            Alert.alert('Erro', 'O nome é obrigatório');
            return;
        }

        if (!formData.email.trim()) {
            Alert.alert('Erro', 'O e-mail é obrigatório');
            return;
        }

        if (!isValidEmail(formData.email.trim())) {
            Alert.alert('Erro', 'Digite um e-mail válido');
            return;
        }

        if (!formData.password.trim()) {
            Alert.alert('Erro', 'A senha é obrigatória');
            return;
        }

        if (formData.password.length < 6) {
            Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            Alert.alert('Erro', 'As senhas não coincidem');
            return;
        }

        try {
            setLoading(true);

            // Passo 1: Verificar se o email já existe
            const { data: existingUser, error: checkEmailError } = await supabase
                .from('profiles')
                .select('email')
                .eq('email', formData.email.trim().toLowerCase())
                .single();

            if (existingUser) {
                Alert.alert('Erro', 'Este e-mail já está cadastrado');
                return;
            }

            // Passo 2: Criar usuário
            console.log('Criando usuário...');
            const { data: { user }, error: signUpError } = await supabase.auth.signUp({
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                options: {
                    data: {
                        name: formData.name.trim()
                    }
                }
            });

            if (signUpError) {
                console.error('Erro ao criar usuário:', signUpError);
                Alert.alert('Erro', 'Não foi possível criar sua conta. Tente novamente.');
                return;
            }

            if (!user?.id) {
                console.error('Usuário não foi criado corretamente');
                Alert.alert('Erro', 'Não foi possível criar sua conta. Tente novamente.');
                return;
            }

            console.log('Usuário criado com sucesso:', user.id);

            // Passo 3: Criar perfil
            console.log('Criando perfil...');
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: user.id,
                        name: formData.name.trim(),
                        email: formData.email.trim().toLowerCase(),
                        updated_at: new Date().toISOString()
                    }
                ]);

            if (profileError) {
                console.error('Erro ao criar perfil:', profileError);
                throw profileError;
            }

            console.log('Perfil criado com sucesso');
            // Após criação, direciona para as telas de onboarding
            Alert.alert('Sucesso', 'Conta criada com sucesso! Bem-vindo ao Dominomania!', [
                { text: 'Começar', onPress: () => router.replace('/onboarding') }
            ]);

        } catch (error: any) {
            console.error('Erro detalhado:', error);
            let errorMessage = 'Erro ao criar conta';

            if (error.message) {
                if (error.message.includes('Email rate limit exceeded')) {
                    errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
                } else if (error.message.includes('User already registered')) {
                    errorMessage = 'Este e-mail já está cadastrado.';
                } else if (error.message.includes('invalid format')) {
                    errorMessage = 'Digite um e-mail válido.';
                } else {
                    errorMessage = error.message;
                }
            }

            Alert.alert('Erro', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <Content>
                <Title>Criar Conta</Title>
                
                <Input
                    placeholder="Nome"
                    value={formData.name}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                    autoCapitalize="words"
                    placeholderTextColor={colors.gray400}
                    editable={!loading}
                />

                <Input
                    placeholder="E-mail"
                    value={formData.email}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={colors.gray400}
                    editable={!loading}
                />
                
                <Input
                    placeholder="Senha"
                    value={formData.password}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                    secureTextEntry
                    placeholderTextColor={colors.gray400}
                    editable={!loading}
                />

                <Input
                    placeholder="Confirmar Senha"
                    value={formData.confirmPassword}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                    secureTextEntry
                    placeholderTextColor={colors.gray400}
                    editable={!loading}
                />

                <SignUpButton onPress={handleSignUp} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color={colors.secondary} />
                    ) : (
                        <SignUpButtonText>Criar Conta</SignUpButtonText>
                    )}
                </SignUpButton>

                <LoginButton onPress={() => router.push('/')} disabled={loading}>
                    <LoginButtonText>Já tem uma conta? Faça login</LoginButtonText>
                </LoginButton>
            </Content>
        </Container>
    );
}

const Container = styled.View`
    flex: 1;
    background-color: ${colors.backgroundDark};
`;

const Content = styled.View`
    flex: 1;
    padding: 20px;
    justify-content: center;
`;

const Title = styled.Text`
    font-size: 32px;
    font-weight: bold;
    color: ${colors.gray100};
    margin-bottom: 32px;
    text-align: center;
`;

const Input = styled.TextInput`
    background-color: ${colors.secondary};
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    color: ${colors.gray100};
    font-size: 16px;
`;

const SignUpButton = styled.TouchableOpacity`
    background-color: ${colors.accent};
    padding: 16px;
    border-radius: 8px;
    margin-top: 8px;
    opacity: ${props => props.disabled ? 0.7 : 1};
`;

const SignUpButtonText = styled.Text`
    color: ${colors.secondary};
    font-size: 16px;
    font-weight: bold;
    text-align: center;
`;

const LoginButton = styled.TouchableOpacity`
    padding: 16px;
    margin-top: 8px;
    opacity: ${props => props.disabled ? 0.7 : 1};
`;

const LoginButtonText = styled.Text`
    color: ${colors.accent};
    font-size: 14px;
    text-align: center;
`;
