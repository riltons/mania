import { Platform } from 'react-native';
import {
  initConnection,
  getSubscriptions,
  requestSubscription,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  getAvailablePurchases,
  type Subscription,
  type PurchaseError,
  SubscriptionPurchase
} from 'react-native-iap';
import { supabase } from '@/lib/supabase';

// IDs dos produtos na Play Store (serão definidos no Google Play Console)
export const SUBSCRIPTION_SKUS = {
  PREMIUM_MONTHLY: 'dominomania.premium.monthly',
  PREMIUM_ANNUAL: 'dominomania.premium.annual',
};

// Tipos de planos
export type PlanType = 'free_trial' | 'premium_monthly' | 'premium_annual';

// Interface para informações do plano
export interface PlanInfo {
  id: string;
  name: string;
  slug: PlanType;
  price_cents: number;
  currency: string;
  interval: 'month' | 'year' | 'trial';
  features: string[];
  trial_days?: number;
}

// Planos disponíveis
export const PLANS: PlanInfo[] = [
  {
    id: 'free_trial',
    name: 'Plano Gratuito',
    slug: 'free_trial',
    price_cents: 0,
    currency: 'BRL',
    interval: 'trial',
    trial_days: 30,
    features: [
      'Acesso a todas as funcionalidades',
      'Válido por 30 dias',
      'Sem compromisso',
    ],
  },
  {
    id: SUBSCRIPTION_SKUS.PREMIUM_MONTHLY,
    name: 'Premium Mensal',
    slug: 'premium_monthly',
    price_cents: 1990, // R$ 19,90 (será atualizado com o preço real da Play Store)
    currency: 'BRL',
    interval: 'month',
    features: [
      'Acesso a todas as funcionalidades',
      'Suporte prioritário',
      'Sem anúncios',
    ],
  },
  {
    id: SUBSCRIPTION_SKUS.PREMIUM_ANNUAL,
    name: 'Premium Anual',
    slug: 'premium_annual',
    price_cents: 19900, // R$ 199,00 (será atualizado com o preço real da Play Store)
    currency: 'BRL',
    interval: 'year',
    features: [
      'Acesso a todas as funcionalidades',
      'Suporte prioritário',
      'Sem anúncios',
      'Economia de 17% em relação ao plano mensal',
    ],
  },
];

// Interface para assinatura do usuário
export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'expired' | 'trial';
  created_at: string;
  ends_at: string | null;
  canceled_at: string | null;
  purchase_token?: string;
  platform: 'android' | 'ios' | 'web';
}

// Interface para assinatura com informações do plano
export interface SubscriptionWithPlan extends UserSubscription {
  plan: PlanInfo;
}

class PlayBillingService {
  private purchaseUpdateSubscription: any;
  private purchaseErrorSubscription: any;
  private isConnected: boolean = false;

  // Inicializar conexão com a Play Store
  async init() {
    if (Platform.OS !== 'android') {
      console.log('PlayBillingService: Plataforma não suportada');
      return false;
    }

    try {
      await initConnection();
      this.isConnected = true;
      
      // Ouvir atualizações de compras
      this.purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase) => {
        console.log('Compra atualizada:', purchase);
        
        // Verificar se é uma assinatura
        if (purchase) {
          try {
            // Validar e processar a compra
            await this.handlePurchase(purchase);
            
            // Finalizar a transação
            await finishTransaction({
              purchase,
              isConsumable: false,
            });
          } catch (error) {
            console.error('Erro ao processar compra:', error);
          }
        }
      });
      
      // Ouvir erros de compra
      this.purchaseErrorSubscription = purchaseErrorListener((error: PurchaseError) => {
        console.error('Erro na compra:', error);
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao inicializar Play Billing:', error);
      return false;
    }
  }

  // Obter assinaturas disponíveis da Play Store
  async getAvailableSubscriptions() {
    if (!this.isConnected) {
      await this.init();
    }

    try {
      const subscriptions = await getSubscriptions({
        skus: Object.values(SUBSCRIPTION_SKUS),
      });
      
      // Atualizar preços dos planos com os valores reais da Play Store
      const updatedPlans = [...PLANS];
      
      subscriptions.forEach((sub: Subscription) => {
        const planIndex = updatedPlans.findIndex(p => p.id === sub.productId);
        if (planIndex !== -1) {
          const priceString = sub.localizedPrice.replace(/[^0-9]/g, '');
          updatedPlans[planIndex].price_cents = parseInt(priceString, 10);
          updatedPlans[planIndex].currency = sub.currency || 'BRL';
        }
      });
      
      return updatedPlans;
    } catch (error) {
      console.error('Erro ao obter assinaturas:', error);
      return PLANS; // Retorna os planos padrão em caso de erro
    }
  }

  // Iniciar processo de assinatura
  async subscribe(sku: string) {
    if (!this.isConnected) {
      await this.init();
    }

    try {
      // Solicitar assinatura
      await requestSubscription({
        sku,
        andDangerouslyFinishTransactionAutomaticallyIPromise: false,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao assinar:', error);
      return { success: false, error };
    }
  }

  // Processar compra após confirmação
  async handlePurchase(purchase: SubscriptionPurchase) {
    try {
      const { user } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Verificar qual plano foi comprado
      const planId = purchase.productId;
      const purchaseToken = purchase.transactionReceipt;
      
      // Enviar para o backend para validação e registro
      const { data, error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan_id: planId,
          status: 'active',
          purchase_token: purchaseToken,
          platform: 'android',
          // A data de expiração será calculada no backend com base na resposta da API do Google
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao processar compra:', error);
      throw error;
    }
  }

  // Verificar assinaturas ativas do usuário
  async getUserSubscription(userId: string): Promise<SubscriptionWithPlan | null> {
    try {
      // Verificar no Supabase
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') { // Código para "nenhum resultado"
          console.error('Erro ao buscar assinatura:', error);
        }
        return null;
      }
      
      if (!data) {
        return null;
      }
      
      // Verificar se é uma assinatura válida
      const plan = PLANS.find(p => p.id === data.plan_id);
      
      if (!plan) {
        return null;
      }
      
      return {
        ...data,
        plan,
      } as SubscriptionWithPlan;
    } catch (error) {
      console.error('Erro ao buscar assinatura do usuário:', error);
      return null;
    }
  }

  // Verificar assinaturas restauráveis (para casos de reinstalação do app)
  async restorePurchases(userId: string) {
    if (!this.isConnected) {
      await this.init();
    }

    try {
      // Obter compras disponíveis
      const purchases = await getAvailablePurchases();
      
      if (purchases.length === 0) {
        return { success: false, message: 'Nenhuma assinatura encontrada para restaurar' };
      }
      
      // Filtrar apenas assinaturas válidas
      const validSubscriptions = purchases.filter(
        purchase => Object.values(SUBSCRIPTION_SKUS).includes(purchase.productId)
      );
      
      if (validSubscriptions.length === 0) {
        return { success: false, message: 'Nenhuma assinatura válida encontrada' };
      }
      
      // Processar cada assinatura encontrada
      for (const purchase of validSubscriptions) {
        await this.handlePurchase(purchase);
      }
      
      return { success: true, message: 'Assinaturas restauradas com sucesso' };
    } catch (error) {
      console.error('Erro ao restaurar compras:', error);
      return { success: false, error };
    }
  }

  // Verificar se o usuário tem uma assinatura ativa
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    return !!subscription;
  }

  // Verificar se o usuário está no período de trial
  async isInTrialPeriod(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'trial')
        .single();
      
      if (error || !data) {
        return false;
      }
      
      // Verificar se o trial ainda é válido
      if (data.ends_at) {
        const endDate = new Date(data.ends_at);
        return endDate > new Date();
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao verificar período de trial:', error);
      return false;
    }
  }

  // Iniciar período de trial para um usuário
  async startTrialPeriod(userId: string): Promise<boolean> {
    try {
      // Verificar se o usuário já teve um trial antes
      const { data: existingTrial } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('plan_id', 'free_trial')
        .maybeSingle();
      
      if (existingTrial) {
        return false; // Usuário já teve um trial
      }
      
      // Calcular data de término (30 dias a partir de hoje)
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(now.getDate() + 30);
      
      // Registrar o trial
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: 'free_trial',
          status: 'trial',
          created_at: now.toISOString(),
          ends_at: endDate.toISOString(),
          platform: 'android',
        });
      
      return !error;
    } catch (error) {
      console.error('Erro ao iniciar período de trial:', error);
      return false;
    }
  }

  // Limpar recursos ao desmontar componentes
  cleanup() {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
      this.purchaseUpdateSubscription = null;
    }
    
    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
      this.purchaseErrorSubscription = null;
    }
  }
}

export const playBillingService = new PlayBillingService();
