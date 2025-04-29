import React from 'react';
import styled from 'styled-components/native';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.backgroundDark};
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const Title = styled.Text`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 12px;
`;

const Description = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 16px;
  text-align: center;
  margin-bottom: 24px;
`;

export default function FeatureLocked() {
  const router = useRouter();

  return (
    <Container>
      <Title>Recurso Bloqueado</Title>
      <Description>Este recurso está disponível apenas para assinantes Premium.</Description>
      <Button title="Ver Planos" onPress={() => router.replace('/pricing')} />
    </Container>
  );
}
