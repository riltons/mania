import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert, ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { useAuth } from '@/core/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { useTheme } from '@/core/contexts/ThemeProvider';
import { useRouter } from 'expo-router';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionWithPlan } from '@/services/playBillingService';

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }: { theme: any }) => theme.colors.backgroundDark};
  padding: 20px;
`;

const Title = styled.Text`
  color: ${({ theme }: { theme: any }) => theme.colors.textPrimary};
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 12px;
`;

const InfoText = styled.Text`
  color: ${({ theme }: { theme: any }) => theme.colors.textSecondary};
  font-size: 16px;
  margin-bottom: 8px;
`;

const ActionButton = styled.TouchableOpacity<{disabled?: boolean}>`
  background-color: ${({ theme }: { theme: any }) => theme.colors.primary};
  padding: 12px;
  border-radius: 8px;
  align-items: center;
  margin-top: 20px;
  opacity: ${({ disabled }: { disabled?: boolean }) => (disabled ? 0.6 : 1)};
`;

const ButtonText = styled.Text`
  color: #fff;
  font-weight: bold;
`;

export default function Subscription() {
  const { user } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const { 
    subscription: sub, 
    loading, 
    refreshing, 
    getRemainingDays,
    restorePurchases
  } = useSubscription();

  // Usar useEffect para redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [user, router]);
  
  // Retornar null enquanto verifica a autenticação
  if (!user) {
    return (
      <>
        <Header title="Assinatura" showBackButton />
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} size="large" />
      </>
    );
  }
  
  // Função para restaurar compras
  const handleRestorePurchases = async () => {
    await restorePurchases();
  };
  
  // Função para ir para tela de planos
  const goToPlans = () => {
    if (sub?.plan.slug) {
      router.push(`/pricing?currentPlan=${sub.plan.slug}`);
    } else {
      router.push('/pricing');
    }
  };
  
  // Mostrar dias restantes formatados
  const getRemainingDaysText = () => {
    const days = getRemainingDays();
    if (days === 0) {
      return 'Expira hoje';
    } else if (days === 1) {
      return 'Expira amanhã';
    } else {
      return `Expira em ${days} dias`;
    }
  };

  if (loading || refreshing) return (
    <>
      <Header title="Assinatura" showBackButton />
      <ActivityIndicator style={{ flex: 1 }} color={colors.primary} size="large" />
    </>
  );

  if (!sub) {
    return (
      <>
        <Header title="Assinatura" showBackButton />
        <Container>
          <Title>Sem assinatura ativa</Title>
          <InfoText>Você não possui nenhuma assinatura ativa no momento.</InfoText>
          
          <ActionButton onPress={goToPlans}>
            <ButtonText>Ver planos disponíveis</ButtonText>
          </ActionButton>
          
          <ActionButton onPress={handleRestorePurchases} style={{ backgroundColor: colors.secondary }}>
            <ButtonText>Restaurar compras anteriores</ButtonText>
          </ActionButton>
        </Container>
      </>
    );
  }

  // Verificar se é período de teste ou assinatura paga
  const isTrial = sub.status === 'trialing';
  const isActive = sub.status === 'active';

  return (
    <>
      <Header title="Assinatura" showBackButton />
      <ScrollView>
        <Container>
          <Title>Detalhes da Assinatura</Title>
          
          <InfoText>Plano: {sub.plan.name}</InfoText>
          <InfoText>
            Status: {isTrial ? 'Período de teste' : isActive ? 'Ativa' : 'Cancelada'}
          </InfoText>
          <InfoText>
            Início: {new Date(sub.created_at).toLocaleDateString('pt-BR')}
          </InfoText>
          
          {sub.ends_at && (
            <>
              <InfoText>
                {`Término: ${new Date(sub.ends_at).toLocaleDateString('pt-BR')}`}
              </InfoText>
              {(isTrial || sub.canceled_at) && (
                <InfoText style={{ color: colors.warning }}>
                  {getRemainingDaysText()}
                </InfoText>
              )}
            </>
          )}
          
          {/* Botões de ação */}
          {isTrial && (
            <ActionButton onPress={goToPlans}>
              <ButtonText>Assinar plano premium</ButtonText>
            </ActionButton>
          )}
          
          {isActive && (
            <>
              <ActionButton onPress={goToPlans}>
                <ButtonText>
                  {sub.plan.slug === 'premium_monthly' ? 'Mudar para plano anual' : 'Gerenciar assinatura'}
                </ButtonText>
              </ActionButton>
              
              <InfoText style={{ marginTop: 20, fontSize: 12, textAlign: 'center' }}>
                Para cancelar sua assinatura, acesse as configurações da sua conta na Google Play Store.
              </InfoText>
            </>
          )}
          
          {!isActive && !isTrial && (
            <ActionButton onPress={goToPlans}>
              <ButtonText>Renovar assinatura</ButtonText>
            </ActionButton>
          )}
          
          <ActionButton 
            onPress={handleRestorePurchases} 
            style={{ backgroundColor: colors.secondary, marginTop: 10 }}
          >
            <ButtonText>Restaurar compras</ButtonText>
          </ActionButton>
        </Container>
      </ScrollView>
    </>
  );
}

