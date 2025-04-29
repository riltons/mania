import React, { useState } from 'react';
import { View, Text, Button, ActivityIndicator, ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { useAuth } from '@/hooks/useAuth';

const Container = styled.View`
  flex: 1;
  padding: 20px;
  background-color: ${({ theme }) => theme.colors.backgroundDark};
`;

const Title = styled.Text`
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const ResponseContainer = styled.View`
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
`;

const ResponseText = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ErrorText = styled.Text`
  color: ${({ theme }) => theme.colors.error};
  margin-top: 10px;
`;

export default function TestApi() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const testFunctions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Testar a função de setup intent
      const setupUrl = 'https://evakdtqrtpqiuqhetkqr.functions.supabase.co/create-setup-intent';
      console.log('Testando URL de setup:', setupUrl);
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      console.log('ID do usuário:', user.id);
      
      const setupResponse = await fetch(setupUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user.id,
          plan_id: '413d97c1-6f9c-4117-a6fa-b560fd0ab0c8' // ID do plano mensal
        }),
      });
      
      console.log('Status da resposta:', setupResponse.status);
      const setupJson = await setupResponse.json();
      console.log('Resposta do setup:', setupJson);
      
      setResponse({
        setupIntent: {
          status: setupResponse.status,
          data: setupJson
        }
      });
      
    } catch (e) {
      console.error('Erro no teste:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container>
      <Title>Teste de API</Title>
      
      <Button 
        title="Testar Funções" 
        onPress={testFunctions} 
        disabled={loading}
      />
      
      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
      
      {error && <ErrorText>Erro: {error}</ErrorText>}
      
      {response && (
        <ScrollView>
          <ResponseContainer>
            <ResponseText>
              {JSON.stringify(response, null, 2)}
            </ResponseText>
          </ResponseContainer>
        </ScrollView>
      )}
    </Container>
  );
}
