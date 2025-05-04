import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';
import styled from 'styled-components/native';

export const SupabaseTest = () => {
    const [testResult, setTestResult] = useState<string>('Aguardando...');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const testConnection = async () => {
        setIsLoading(true);
        setError(null);
        setTestResult('Testando conexão...');

        try {
            // Verificar variáveis de ambiente
            const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
            const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseAnonKey) {
                throw new Error('Variáveis de ambiente não configuradas');
            }

            // Verificar autenticação
            const { data: authData, error: authError } = await supabase.auth.getUser();
            
            if (authError) {
                throw new Error(`Erro de autenticação: ${authError.message}`);
            }

            if (!authData.user) {
                throw new Error('Usuário não autenticado');
            }

            // Testar consulta simples
            const { data: testData, error: testError } = await supabase
                .from('communities')
                .select('id, name')
                .limit(1);

            if (testError) {
                throw new Error(`Erro na consulta: ${testError.message}`);
            }

            // Testar consulta de estatísticas
            const { data: memberCommunities, error: memberError } = await supabase
                .from('community_members')
                .select('community_id, player_id')
                .eq('player_id', authData.user.id);

            if (memberError) {
                throw new Error(`Erro ao buscar comunidades: ${memberError.message}`);
            }

            // Resultado bem-sucedido
            setTestResult(`
                Conexão OK!
                Usuário: ${authData.user.id}
                Comunidades como membro: ${memberCommunities?.length || 0}
                Teste de consulta: ${testData?.length ? 'OK' : 'Sem dados'}
            `);
        } catch (err: any) {
            setError(err.message || 'Erro desconhecido');
            setTestResult('Falha no teste');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container>
            <Title>Teste de Conexão Supabase</Title>
            
            <ResultContainer>
                <ResultTitle>Resultado:</ResultTitle>
                <ResultText>{testResult}</ResultText>
                {error && <ErrorText>{error}</ErrorText>}
            </ResultContainer>
            
            <TestButton onPress={testConnection} disabled={isLoading}>
                <TestButtonText>{isLoading ? 'Testando...' : 'Testar Conexão'}</TestButtonText>
            </TestButton>
        </Container>
    );
};

const Container = styled.View`
    background-color: ${({ theme }) => theme.colors.backgroundMedium};
    border-radius: 12px;
    padding: 16px;
    margin: 16px;
    border: 1px solid ${({ theme }) => theme.colors.border};
`;

const Title = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: ${({ theme }) => theme.colors.textPrimary};
    margin-bottom: 16px;
`;

const ResultContainer = styled.View`
    background-color: ${({ theme }) => theme.colors.backgroundDark};
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
`;

const ResultTitle = styled.Text`
    font-size: 16px;
    font-weight: bold;
    color: ${({ theme }) => theme.colors.textPrimary};
    margin-bottom: 8px;
`;

const ResultText = styled.Text`
    font-size: 14px;
    color: ${({ theme }) => theme.colors.textSecondary};
`;

const ErrorText = styled.Text`
    font-size: 14px;
    color: ${({ theme }) => theme.colors.error};
    margin-top: 8px;
`;

const TestButton = styled.TouchableOpacity`
    background-color: ${({ theme }) => theme.colors.primary};
    padding: 12px;
    border-radius: 8px;
    align-items: center;
`;

const TestButtonText = styled.Text`
    color: ${({ theme }) => theme.colors.white};
    font-size: 16px;
    font-weight: bold;
`;
