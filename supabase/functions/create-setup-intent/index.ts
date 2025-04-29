import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@11.16.0?target=deno';

// Get the database connection details from environment variables (secrets)
const databaseUrl = Deno.env.get('DATABASE_URL');
const databaseServiceRoleKey = Deno.env.get('DATABASE_SERVICE_ROLE_KEY');
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');

if (!databaseUrl || !databaseServiceRoleKey || !stripeKey) {
  console.error('Missing environment variables: DATABASE_URL, DATABASE_SERVICE_ROLE_KEY, or STRIPE_SECRET_KEY');
  // Optionally handle this error more gracefully, e.g., return an error response
}

// Create a dedicated Supabase client for database operations using the secrets
const supabaseDb = createClient(databaseUrl!, databaseServiceRoleKey!);

// Initialize Stripe
const stripe = new Stripe(stripeKey!, {
  apiVersion: '2022-11-15',
});

// Desativar CORS para permitir requisições de qualquer origem
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Lidar com requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }
    // Extrair plan_id e user_id do corpo da requisição
    const { plan_id, user_id } = await req.json();
    
    // Validar parâmetros obrigatórios
    if (!plan_id) {
      return new Response(JSON.stringify({ error: 'plan_id is required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    console.log(`Processando requisição para plan_id: ${plan_id}, user_id: ${user_id}`);
    
    // Não precisamos mais verificar o token JWT, pois estamos recebendo o user_id diretamente

    const { data: plan, error: planError } = await supabaseDb
      .from('plans')
      .select('stripe_price_id')
      .eq('id', plan_id)
      .single();
    if (planError || !plan?.stripe_price_id) {
      return new Response(JSON.stringify({ error: 'Plan not found or missing Stripe price ID' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    let stripeCustomerId: string;
    const { data: customerRow, error: customerError } = await supabaseDb
      .from('customers')
      .select('stripe_customer_id')
      .eq('user_id', user_id)
      .single();
    if (customerError || !customerRow) {
      const customer = await stripe.customers.create({ metadata: { supabase_user_id: user_id } });
      await supabaseDb.from('customers').insert({ user_id: user_id, stripe_customer_id: customer.id });
      stripeCustomerId = customer.id;
    } else {
      stripeCustomerId = customerRow.stripe_customer_id;
    }

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: stripeCustomerId },
      { apiVersion: '2022-11-15' }
    );
    const setupIntent = await stripe.setupIntents.create({ customer: stripeCustomerId, payment_method_types: ['card'] });
    const publishableKey = Deno.env.get('STRIPE_PUBLISHABLE_KEY')!;

    return new Response(
      JSON.stringify({ ephemeralKey, setupIntent, customer: stripeCustomerId, publishableKey }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (err) {
    console.error('create-setup-intent error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
