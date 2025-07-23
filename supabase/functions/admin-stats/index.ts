import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Lidar com requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Configuração do Supabase com chave de serviço
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar contagem de assinaturas
    const { count: subsCount, error: countError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Buscar assinaturas com status
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('status');

    if (subsError) throw subsError;

    // Calcular contagem por status
    const byStatus = subscriptions.reduce((acc, sub) => {
      const status = sub.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Buscar usuários recentes
    const { data: recentUsers, error: usersError } = await supabase
      .from('auth.users')
      .select('email,created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (usersError) throw usersError;

    // Buscar contagem de usuários únicos com assinaturas
    const { data: uniqueUsers, error: uniqueError } = await supabase
      .from('subscriptions')
      .select('user_id')
      .is('user_id', 'not.null');

    if (uniqueError) throw uniqueError;

    // Extrair IDs de usuário únicos
    const uniqueUserIds = new Set(uniqueUsers.map(u => u.user_id));

    // Preparar resposta
    const responseData = {
      totalUsers: uniqueUserIds.size,
      totalSubscriptions: subsCount || 0,
      byStatus,
      recentUsers: recentUsers || []
    };

    // Retornar dados
    return new Response(JSON.stringify(responseData), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Erro na função admin-stats:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
