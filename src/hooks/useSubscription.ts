import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './useAuth';
import { 
  playBillingService, 
  type SubscriptionWithPlan, 
  type PlanInfo 
} from '@/services/playBillingService';

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionWithPlan | null>(null);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Carregar assinatura do usuário
  const loadSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      return;
    }

    try {
      const userSubscription = await playBillingService.getUserSubscription(user.id);
      setSubscription(userSubscription);
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error);
    }
  }, [user]);

  // Carregar planos disponíveis
  const loadPlans = useCallback(async () => {
    try {
      const availablePlans = await playBillingService.getAvailableSubscriptions();
      setPlans(availablePlans);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  }, []);

  // Iniciar assinatura
  const subscribe = useCallback(async (planId: string) => {
    if (!user) {
      Alert.alert('Erro', 'Você precisa estar logado para assinar um plano');
      return { success: false };
    }

    try {
      setRefreshing(true);
      const result = await playBillingService.subscribe(planId);
      
      if (result.success) {
        // A compra será processada pelo listener de compras
        // Atualizar assinatura após um breve intervalo
        setTimeout(() => {
          loadSubscription();
          setRefreshing(false);
        }, 2000);
      } else {
        setRefreshing(false);
        Alert.alert('Erro', 'Não foi possível processar a assinatura');
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao assinar:', error);
      setRefreshing(false);
      return { success: false, error };
    }
  }, [user, loadSubscription]);

  // Restaurar compras
  const restorePurchases = useCallback(async () => {
    if (!user) {
      Alert.alert('Erro', 'Você precisa estar logado para restaurar suas compras');
      return { success: false };
    }

    try {
      setRefreshing(true);
      const result = await playBillingService.restorePurchases(user.id);
      
      if (result.success) {
        await loadSubscription();
        Alert.alert('Sucesso', 'Suas compras foram restauradas com sucesso');
      } else {
        Alert.alert('Aviso', result.message || 'Não foi possível restaurar suas compras');
      }
      
      setRefreshing(false);
      return result;
    } catch (error) {
      console.error('Erro ao restaurar compras:', error);
      setRefreshing(false);
      Alert.alert('Erro', 'Ocorreu um erro ao restaurar suas compras');
      return { success: false, error };
    }
  }, [user, loadSubscription]);

  // Iniciar período de trial
  const startTrial = useCallback(async () => {
    if (!user) {
      Alert.alert('Erro', 'Você precisa estar logado para iniciar o período de teste');
      return false;
    }

    try {
      setRefreshing(true);
      const result = await playBillingService.startTrialPeriod(user.id);
      
      if (result) {
        await loadSubscription();
        Alert.alert('Sucesso', 'Seu período de teste foi iniciado com sucesso');
      } else {
        Alert.alert('Aviso', 'Você já utilizou seu período de teste gratuito');
      }
      
      setRefreshing(false);
      return result;
    } catch (error) {
      console.error('Erro ao iniciar trial:', error);
      setRefreshing(false);
      Alert.alert('Erro', 'Ocorreu um erro ao iniciar seu período de teste');
      return false;
    }
  }, [user, loadSubscription]);

  // Verificar se o usuário tem acesso premium (assinatura ativa ou trial válido)
  const hasPremiumAccess = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const hasActive = await playBillingService.hasActiveSubscription(user.id);
      if (hasActive) return true;

      const isInTrial = await playBillingService.isInTrialPeriod(user.id);
      return isInTrial;
    } catch (error) {
      console.error('Erro ao verificar acesso premium:', error);
      return false;
    }
  }, [user]);

  // Verificar dias restantes do trial ou da assinatura
  const getRemainingDays = useCallback((): number => {
    if (!subscription || !subscription.ends_at) return 0;

    const endDate = new Date(subscription.ends_at);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }, [subscription]);

  // Atualizar quando o usuário mudar
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await playBillingService.init();
      await Promise.all([loadPlans(), loadSubscription()]);
      setLoading(false);
    };

    initialize();

    // Limpar recursos ao desmontar
    return () => {
      playBillingService.cleanup();
    };
  }, [loadPlans, loadSubscription]);

  return {
    subscription,
    plans,
    loading,
    refreshing,
    subscribe,
    restorePurchases,
    startTrial,
    hasPremiumAccess,
    getRemainingDays,
    refresh: loadSubscription,
  };
}
