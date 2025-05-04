import React from 'react';
import { View, Text } from 'react-native';
import styled from 'styled-components/native';
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

export default function TrialOffer() {
  const router = useRouter();

  return (
    <Container>
      <Title>Experimente o Premium por 14 dias</Title>
      <Description>Desfrute de todas as funcionalidades avançadas gratuitamente.</Description>
      <Button onPress={() => router.replace('/pricing')} title="Iniciar Trial" />
    </Container>
  );
}
