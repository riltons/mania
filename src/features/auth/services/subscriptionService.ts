import { supabaseMCP } from '@/core/lib/supabaseMCP';

export type Plan = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionRow = {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'trialing' | 'active' | 'canceled' | 'expired';
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionWithPlan = SubscriptionRow & {
  plans: Plan;
};

export const subscriptionService = {
  getPlans: async (): Promise<Plan[]> => {
    const { data, error } = await supabaseMCP.from('plans').select('*');
    if (error) throw error;
    return data ?? [];
  },

  getUserSubscription: async (
    userId: string
  ): Promise<SubscriptionWithPlan | null> => {
    const { data, error } = await supabaseMCP
      .from('subscriptions')
      .select('*, plans(*)')
      .eq('user_id', userId)
      .order('starts_at', { ascending: false })
      .limit(1)
      .single();
    // PGRST116: no rows
    if (error && (error as any).code === 'PGRST116') return null;
    if (error) throw error;
    return data as SubscriptionWithPlan;
  },
  // adiciona métodos para iniciar trial de 14 dias e cancelar assinatura
  startUserTrial: async (userId: string, planSlug: string): Promise<SubscriptionWithPlan> => {
    const { data: plan, error: planError } = await supabaseMCP
      .from('plans')
      .select('*')
      .eq('slug', planSlug)
      .single();
    if (planError || !plan) throw planError ?? new Error('Plano não encontrado');
    const endsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const startsAt = new Date().toISOString();
    const { data, error } = await supabaseMCP
      .from('subscriptions')
      .upsert({ user_id: userId, plan_id: plan.id, status: 'trialing', starts_at: startsAt, ends_at: endsAt }, { onConflict: ['user_id', 'plan_id'] })
      .select('*, plans(*)')
      .single();
    if (error) throw error;
    return data as SubscriptionWithPlan;
  },
  cancelSubscription: async (subscriptionId: string): Promise<SubscriptionRow> => {
    const { data, error } = await supabaseMCP
      .from('subscriptions')
      .update({ status: 'canceled', ends_at: new Date().toISOString() })
      .eq('id', subscriptionId)
      .select()
      .single();
    if (error) throw error;
    return data as SubscriptionRow;
  },
  assignFreePlan: async (userId: string): Promise<SubscriptionRow> => {
    // Atribui o plano gratuito ao usuário
    const { data: plan, error: planError } = await supabaseMCP
      .from('plans')
      .select('id')
      .eq('slug', 'free')
      .single();
    if (planError || !plan) throw planError ?? new Error('Plano gratuito não encontrado');
    const now = new Date().toISOString();
    const { data, error } = await supabaseMCP
      .from('subscriptions')
      .upsert(
        { user_id: userId, plan_id: plan.id, status: 'active', starts_at: now, ends_at: null },
        { onConflict: ['user_id', 'plan_id'] }
      )
      .single();
    if (error) throw error;
    return data as SubscriptionRow;
  },
  createSubscription: async (userId: string, planId: string): Promise<SubscriptionWithPlan> => {
    const now = new Date().toISOString();
    const { data, error } = await supabaseMCP
      .from('subscriptions')
      .upsert({ user_id: userId, plan_id: planId, status: 'active', starts_at: now, ends_at: null }, { onConflict: ['user_id', 'plan_id'] })
      .select('*, plans(*)')
      .single();
    if (error) throw error;
    return data as SubscriptionWithPlan;
  },
};

