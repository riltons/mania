import React, { useEffect, useState } from 'react';
import { ScrollView, ActivityIndicator, Alert } from 'react-native';
import styled from 'styled-components/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/core/hooks/useAuth';
import { useTheme } from '@/core/contexts/ThemeProvider';
import { useSubscription } from '@/hooks/useSubscription';
import { PlanInfo } from '@/services/playBillingService';

const Container = styled.ScrollView<{theme?: any}>`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.backgroundDark};
  padding: 20px;
`;

const PlanCard = styled.View<{theme?: any}>`
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`;

const Title = styled.Text<{theme?: any}>`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 18px;
  font-weight: bold;
`;

const PriceText = styled.Text<{theme?: any}>`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 16px;
  margin-vertical: 8px;
`;

const FeatureText = styled.Text<{theme?: any}>`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  margin-vertical: 2px;
`;

const SubscribeButton = styled.TouchableOpacity<{theme?: any; disabled?: boolean}>`
  background-color: ${({ theme }) => theme.colors.primary};
  padding: 12px;
  border-radius: 8px;
  align-items: center;
  margin-top: 12px;
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
`;

const ButtonText = styled.Text`
  color: #fff;
  font-weight: bold;
`;

export default function Pricing() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ hideFree?: string; currentPlan?: string }>();
  const hideFree = params.hideFree === 'true';
  const currentPlan = params.currentPlan;
  const { colors } = useTheme();
  const { plans, loading, refreshing, subscribe, startTrial, subscription } = useSubscription();
  const [submitting, setSubmitting] = useState<string | null>(null);
  
  const planOrder = ['free_trial', 'premium_monthly', 'premium_annual'];
  let visiblePlans = plans;
  
  if (currentPlan) {
    const idx = planOrder.indexOf(currentPlan as any);
    if (idx >= 0) {
      if (currentPlan === 'premium_annual') {
        visiblePlans = plans.filter(p => planOrder.indexOf(p.slug as any) < idx);
      } else {
        visiblePlans = plans.filter(p => planOrder.indexOf(p.slug as any) > idx);
      }
    }
  } else if (hideFree) {
    visiblePlans = plans.filter(p => p.slug !== 'free_trial');
  }

  // Função para lidar com a assinatura ou início do trial
  const handleSubscribe = async (slug: string) => {
    // Se for plano gratuito (trial), iniciar período de teste
    if (slug === 'free_trial') {
      if (!user) {
        router.replace(`/register?plan=${slug}`);
        return;
      }
      
      try {
        setSubmitting(slug);
        const success = await startTrial();
        if (success) {
          Alert.alert('Sucesso', 'Seu período de teste foi iniciado com sucesso!');
          router.replace('/dashboard');
        }
      } catch (error) {
        console.error('Erro ao iniciar trial:', error);
        Alert.alert('Erro', 'Não foi possível iniciar seu período de teste');
      } finally {
        setSubmitting(null);
      }
      return;
    }
    
    // Verificar se o usuário está logado para planos pagos
    if (!user) {
      router.replace('/login?returnTo=pricing');
      return;
    }
    
    try {
      setSubmitting(slug);
      const plan = plans.find(p => p.slug === slug);
      
      if (!plan) { 
        Alert.alert('Erro', 'Plano não encontrado'); 
        return; 
      }
      
      // Iniciar processo de assinatura via Play Store
      const result = await subscribe(plan.id);
      
      if (!result.success) {
        Alert.alert('Erro', 'Não foi possível processar a assinatura');
      }
      // O sucesso será tratado pelo listener de compras no PlayBillingService
      
    } catch (error) {
      console.error('Erro ao assinar:', error);
      Alert.alert('Erro', 'Falha no pagamento');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading || refreshing) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} size="large" />;

  return (
    <Container>
      {visiblePlans.map(plan => (
        <PlanCard key={plan.id}>
          <Title>{plan.name}</Title>
          <PriceText>
            {(plan.price_cents / 100).toLocaleString('pt-BR', {
              style: 'currency',
              currency: plan.currency,
            })}{' '}/ {plan.interval === 'month' ? 'mês' : 'ano'}
          </PriceText>
          {plan.features.map((f: string, i: number) => (
            <FeatureText key={i}>• {f}</FeatureText>
          ))}
          <SubscribeButton disabled={submitting !== null} onPress={() => handleSubscribe(plan.slug)}>
            {submitting === plan.slug ? (
              <ActivityIndicator color="#fff" />
            ) : currentPlan ? (
              <ButtonText>
                {currentPlan === 'premium_annual' ? 'Downgrade para ' : 'Upgrade para '}
                {plan.name}
              </ButtonText>
            ) : (
              <ButtonText>{plan.slug === 'free_trial' ? 'Começar Período Gratuito' : 'Assinar Agora'}</ButtonText>
            )}
          </SubscribeButton>
        </PlanCard>
      ))}
    </Container>
  );
}

