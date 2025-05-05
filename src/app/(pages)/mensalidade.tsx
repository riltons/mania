import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import styled from 'styled-components/native';
import { useAuth } from '@/core/hooks/useAuth';
import { supabase } from '@/core/lib/supabase';
import { Header } from '@/components/layout/Header';
import { useTheme } from '@/core/contexts/ThemeProvider';
import { useRouter } from 'expo-router';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionWithPlan } from '@/services/playBillingService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PageTransition } from '@/components/Transitions';
import AlertModal from '@/components/feedback/AlertModal';

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }: { theme: any }) => theme.colors.backgroundDark};
  padding: 20px;
`;

const Card = styled.View`
  background-color: ${({ theme }: { theme: any }) => theme.colors.backgroundLight};
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  elevation: 3;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
`;

const Title = styled.Text`
  color: ${({ theme }: { theme: any }) => theme.colors.textPrimary};
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 16px;
`;

const SectionTitle = styled.Text`
  color: ${({ theme }: { theme: any }) => theme.colors.textPrimary};
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 12px;
  margin-top: 8px;
`;

const InfoText = styled.Text`
  color: ${({ theme }: { theme: any }) => theme.colors.textSecondary};
  font-size: 16px;
  margin-bottom: 8px;
`;

const HighlightText = styled.Text`
  color: ${({ theme }: { theme: any }) => theme.colors.primary};
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
`;

const WarningText = styled.Text`
  color: ${({ theme }: { theme: any }) => theme.colors.warning};
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
`;

const ActionButton = styled.TouchableOpacity<{disabled?: boolean}>`
  background-color: ${({ theme }: { theme: any }) => theme.colors.primary};
  padding: 16px;
  border-radius: 8px;
  align-items: center;
  margin-top: 20px;
  opacity: ${({ disabled }: { disabled?: boolean }) => (disabled ? 0.6 : 1)};
`;

const SecondaryButton = styled.TouchableOpacity`
  background-color: ${({ theme }: { theme: any }) => theme.colors.secondary};
  padding: 16px;
  border-radius: 8px;
  align-items: center;
  margin-top: 12px;
`;

const ButtonText = styled.Text`
  color: ${({ theme }: { theme: any }) => theme.colors.white};
  font-size: 16px;
  font-weight: bold;
`;

const FeatureItem = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 8px;
`;

const FeatureText = styled.Text`
  color: ${({ theme }: { theme: any }) => theme.colors.textSecondary};
  font-size: 14px;
  margin-left: 8px;
`;

const Divider = styled.View`
  height: 1px;
  background-color: ${({ theme }: { theme: any }) => theme.colors.border};
  margin-vertical: 16px;
`;

export default function MensalidadeScreen() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const { 
    subscription: sub, 
    loading: subscriptionLoading, 
    refreshing, 
    getRemainingDays,
    restorePurchases,
    hasPremiumAccess
  } = useSubscription();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alertModal, setAlertModal] = useState({
    visible: false,
    title: '',
    message: '',
    confirmAction: () => {},
    cancelAction: () => {},
  });

  // Verificar se o usuário está autenticado
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const { data } = await supabase.auth.getSession();
        console.log('[MensalidadeScreen] Verificando sessão:', data?.session ? 'Sessão ativa' : 'Sem sessão');
        
        if (!data?.session) {
          console.log('[MensalidadeScreen] Usuário não autenticado, redirecionando para login');
          router.replace('/login');
          return;
        }
        
        if (user) {
          console.log('[MensalidadeScreen] Verificando status premium para o usuário:', user.id);
          await checkPremiumStatus();
        }
      } catch (error) {
        console.error('[MensalidadeScreen] Erro ao verificar autenticação:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [user, router]);

  const checkPremiumStatus = async () => {
    if (user) {
      const premium = await hasPremiumAccess();
      setIsPremium(premium);
    }
  };
  
  // Mostrar indicador de carregamento enquanto verifica a autenticação
  if (loading || subscriptionLoading) {
    return (
      <PageTransition>
        <Header title="Gerenciar Mensalidade" showBackButton />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 10, color: colors.textSecondary }}>Carregando informações...</Text>
        </View>
      </PageTransition>
    );
  }
  
  // Se não estiver autenticado, não renderizar nada (o redirecionamento já foi feito no useEffect)
  if (!isAuthenticated) {
    return null;
  }
  
  // Função para restaurar compras
  const handleRestorePurchases = async () => {
    await restorePurchases();
    checkPremiumStatus();
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

  const showUpgradeMessage = () => {
    if (Platform.OS === 'web') {
      setAlertModal({
        visible: true,
        title: 'Upgrade em Breve',
        message: 'O upgrade para planos premium estará disponível em breve, após o lançamento do aplicativo na Play Store.',
        confirmAction: () => setAlertModal(prev => ({ ...prev, visible: false })),
        cancelAction: () => {},
      });
    } else {
      Alert.alert(
        'Upgrade em Breve',
        'O upgrade para planos premium estará disponível em breve, após o lançamento do aplicativo na Play Store.'
      );
    }
  };

  if (loading || refreshing) return (
    <>
      <Header title="Gerenciar Mensalidade" showBackButton />
      <ActivityIndicator style={{ flex: 1 }} color={colors.primary} size="large" />
    </>
  );

  return (
    <PageTransition>
      <AlertModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        onConfirm={alertModal.confirmAction}
        onCancel={alertModal.cancelAction}
        onClose={() => setAlertModal(prev => ({ ...prev, visible: false }))}
      />
      <Header title="Gerenciar Mensalidade" showBackButton />
      <ScrollView>
        <Container>
          <Title>Detalhes da Mensalidade</Title>
          
          <Card>
            <SectionTitle>Status da Assinatura</SectionTitle>
            {!sub && (
              <InfoText>Você está utilizando o plano gratuito.</InfoText>
            )}
            
            {sub && (
              <>
                <InfoText>Plano atual: <HighlightText>{sub.plan.name}</HighlightText></InfoText>
                <InfoText>
                  Status: {sub.status === 'trialing' ? 'Período de teste' : 
                          sub.status === 'active' ? 'Ativa' : 'Cancelada'}
                </InfoText>
                
                {sub.ends_at && (
                  <>
                    <InfoText>
                      Início: {new Date(sub.created_at).toLocaleDateString('pt-BR')}
                    </InfoText>
                    <InfoText>
                      Término: {new Date(sub.ends_at).toLocaleDateString('pt-BR')}
                    </InfoText>
                    {(sub.status === 'trialing' || sub.canceled_at) && (
                      <WarningText>
                        {getRemainingDaysText()}
                      </WarningText>
                    )}
                  </>
                )}
              </>
            )}
          </Card>
          
          <Card>
            <SectionTitle>Benefícios da Assinatura Premium</SectionTitle>
            <FeatureItem>
              <MaterialCommunityIcons name="check-circle" size={20} color={colors.accent} />
              <FeatureText>Sem limite de jogadores cadastrados</FeatureText>
            </FeatureItem>
            <FeatureItem>
              <MaterialCommunityIcons name="check-circle" size={20} color={colors.accent} />
              <FeatureText>Estatísticas avançadas de jogos</FeatureText>
            </FeatureItem>
            <FeatureItem>
              <MaterialCommunityIcons name="check-circle" size={20} color={colors.accent} />
              <FeatureText>Histórico completo de partidas</FeatureText>
            </FeatureItem>
            <FeatureItem>
              <MaterialCommunityIcons name="check-circle" size={20} color={colors.accent} />
              <FeatureText>Suporte prioritário</FeatureText>
            </FeatureItem>
            <FeatureItem>
              <MaterialCommunityIcons name="check-circle" size={20} color={colors.accent} />
              <FeatureText>Sem anúncios</FeatureText>
            </FeatureItem>
          </Card>
          
          <Card>
            <SectionTitle>Planos Disponíveis</SectionTitle>
            <InfoText>Plano Mensal: R$ 39,90/mês</InfoText>
            <InfoText>Plano Anual: R$ 399,90/ano (economia de 17%)</InfoText>
            <InfoText>Plano Gratuito: Limitado a 5 jogadores</InfoText>
          </Card>
          
          {/* Botões de ação */}
          {sub?.status === 'trialing' && (
            <ActionButton onPress={showUpgradeMessage} disabled={true}>
              <ButtonText>Assinar plano premium (em breve)</ButtonText>
            </ActionButton>
          )}
          
          {sub?.status === 'active' && (
            <>
              <ActionButton onPress={showUpgradeMessage} disabled={true}>
                <ButtonText>
                  {sub.plan.slug === 'premium_monthly' ? 'Mudar para plano anual (em breve)' : 'Gerenciar assinatura (em breve)'}
                </ButtonText>
              </ActionButton>
              
              <InfoText style={{ marginTop: 20, fontSize: 12, textAlign: 'center' }}>
                Para cancelar sua assinatura, acesse as configurações da sua conta na Google Play Store.
              </InfoText>
            </>
          )}
          
          {(!sub || sub.status === 'canceled') && (
            <ActionButton onPress={showUpgradeMessage} disabled={true}>
              <ButtonText>Assinar plano premium (em breve)</ButtonText>
            </ActionButton>
          )}
          
          <SecondaryButton onPress={handleRestorePurchases}>
            <ButtonText>Restaurar compras</ButtonText>
          </SecondaryButton>
        </Container>
      </ScrollView>
    </PageTransition>
  );
}
