import React, { useEffect, useState } from 'react';
import { ScrollView, ActivityIndicator, Alert } from 'react-native';
import styled from 'styled-components/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { subscriptionService, Plan } from '@/services/subscriptionService';
import { useTheme } from '@/contexts/ThemeProvider';
import { useStripe } from '@stripe/stripe-react-native';
import { supabaseMCP } from '@/lib/supabaseMCP';

const Container = styled.ScrollView`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.backgroundDark};
  padding: 20px;
`;

const PlanCard = styled.View`
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`;

const Title = styled.Text`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 18px;
  font-weight: bold;
`;

const PriceText = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 16px;
  margin-vertical: 8px;
`;

const FeatureText = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  margin-vertical: 2px;
`;

const SubscribeButton = styled.TouchableOpacity`
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
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const planOrder = ['free', 'premium_monthly', 'premium_yearly'];
  let visiblePlans = plans;
  if (currentPlan) {
    const idx = planOrder.indexOf(currentPlan);
    if (idx >= 0) {
      if (currentPlan === 'premium_yearly') {
        visiblePlans = plans.filter(p => planOrder.indexOf(p.slug) < idx);
      } else {
        visiblePlans = plans.filter(p => planOrder.indexOf(p.slug) > idx);
      }
    }
  } else if (hideFree) {
    visiblePlans = plans.filter(p => p.slug !== 'free');
  }

  useEffect(() => {
    subscriptionService
      .getPlans()
      .then(setPlans)
      .catch(() => Alert.alert('Erro', 'Não foi possível carregar planos'))
      .finally(() => setLoading(false));
  }, []);

  async function fetchPaymentSheetParams(planId: string) {
    try {
      console.log('Iniciando fetchPaymentSheetParams para planId:', planId);
      const { data: { session } } = await supabaseMCP.auth.getSession();
      const token = session?.access_token;
      console.log('Token obtido:', token ? 'Sim (não mostrado por segurança)' : 'Não');
      
      // Usando a variável de ambiente para a URL das funções
      const functionsUrl = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL;
      const url = `${functionsUrl}/create-setup-intent`;
      console.log('URL da função:', url);
      
      // Verificar se o usuário está logado
      if (!user || !user.id) {
        throw new Error('Usuário não autenticado');
      }
      
      // Enviar user_id junto com plan_id para não depender da validação do token
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan_id: planId,
          user_id: user.id 
        }),
      });
      
      console.log('Status da resposta:', response.status);
      const json = await response.json();
      console.log('Resposta JSON:', JSON.stringify(json));
      
      if (!response.ok) {
        throw new Error(json.error || `Erro ao obter parâmetros de pagamento (${response.status})`);
      }
      
      return json;
    } catch (e) {
      console.error('Erro detalhado:', e);
      throw e;
    }
  }

  const handleSubscribe = async (slug: string) => {
    // Se for plano gratuito, navegar para cadastro e setar plano free
    if (slug === 'free') {
      router.replace(`/register?plan=${slug}`);
      return;
    }
    
    // Verificar se o usuário está logado
    if (!user) {
      router.replace(`/register?plan=${slug}`);
      return;
    }
    
    try {
      setSubmitting(slug);
      const plan = plans.find(p => p.slug === slug);
      if (!plan) { Alert.alert('Erro', 'Plano não encontrado'); return; }
      const { ephemeralKey, setupIntent, customer, publishableKey } = await fetchPaymentSheetParams(plan.id);
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Dominomania',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey.secret,
        setupIntentClientSecret: setupIntent.client_secret,
        defaultBillingDetails: { email: user.email },
      });
      if (initError) { Alert.alert('Erro', initError.message); return; }
      const { error: paymentError } = await presentPaymentSheet();
      if (paymentError) { Alert.alert('Erro', paymentError.message); return; }
      await subscriptionService.createSubscription(user.id, plan.id);
      Alert.alert('Sucesso', 'Assinatura realizada');
      router.replace('/subscription');
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Falha no pagamento');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} size="large" />;

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
          {plan.features.map((f, i) => (
            <FeatureText key={i}>• {f}</FeatureText>
          ))}
          <SubscribeButton disabled={submitting !== null} onPress={() => handleSubscribe(plan.slug)}>
            {submitting === plan.slug ? (
              <ActivityIndicator color="#fff" />
            ) : currentPlan ? (
              <ButtonText>
                {currentPlan === 'premium_yearly' ? 'Downgrade para ' : 'Upgrade para '}
                {plan.name}
              </ButtonText>
            ) : (
              <ButtonText>{plan.slug === 'free' ? 'Cadastre-se' : 'Iniciar trial'}</ButtonText>
            )}
          </SubscribeButton>
        </PlanCard>
      ))}
    </Container>
  );
}
