-- Trigger para inscrição automática de novos usuários no plano gratuito com período de teste de 30 dias

-- Primeiro, vamos criar um plano gratuito se não existir
DO $$
BEGIN
    -- Verificar se a tabela plans existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plans') THEN
        -- Criar tabela de planos
        CREATE TABLE public.plans (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            slug TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            price_cents INTEGER NOT NULL,
            currency TEXT NOT NULL DEFAULT 'BRL',
            interval TEXT NOT NULL,
            features JSONB,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- Adicionar políticas RLS
        ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
        
        -- Política para permitir que todos os usuários vejam os planos
        CREATE POLICY "Todos podem ver os planos" ON public.plans
        FOR SELECT USING (true);
        
        -- Conceder permissões
        GRANT SELECT ON public.plans TO authenticated, anon;
    END IF;
    
    -- Inserir plano gratuito se não existir
    IF NOT EXISTS (SELECT 1 FROM public.plans WHERE slug = 'plano-gratuito') THEN
        INSERT INTO public.plans (slug, name, description, price_cents, currency, interval, features)
        VALUES (
            'plano-gratuito',
            'Plano Gratuito',
            'Acesso básico ao aplicativo com recursos limitados',
            0,
            'BRL',
            'month',
            '{"max_players": 5, "max_games": 10, "features": ["basic_stats", "basic_reports"], "trial_days": 30}'::JSONB
        );
    END IF;
END$$;

-- Função para criar assinatura automática para novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
DECLARE
    trial_days INTEGER;
    end_date TIMESTAMPTZ;
    plano_id UUID;
BEGIN
    -- Obter os dias de trial do plano gratuito
    SELECT (p.features->>'trial_days')::INTEGER INTO trial_days
    FROM public.plans p
    WHERE p.slug = 'plano-gratuito';
    
    -- Calcular a data de término do período de trial
    IF trial_days IS NOT NULL THEN
        end_date := NOW() + (trial_days || ' days')::INTERVAL;
    ELSE
        end_date := NOW() + '30 days'::INTERVAL; -- Padrão de 30 dias se não especificado
    END IF;
    
    -- Obter o ID do plano gratuito
    BEGIN
        SELECT id INTO plano_id FROM public.plans WHERE slug = 'plano-gratuito';
        
        -- Criar assinatura em período de trial para o novo usuário
        INSERT INTO public.subscriptions (
            user_id,
            plan_id,
            status,
            created_at,
            updated_at,
            ends_at,
            platform
        )
        VALUES (
            NEW.id,
            plano_id::TEXT,
            'trial',
            NOW(),
            NOW(),
            end_date,
            'web'
        )
        ON CONFLICT (user_id, status) DO NOTHING; -- Evitar duplicatas
    END;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Registrar o erro para debug
        RAISE LOG 'Erro ao criar assinatura automática: %', SQLERRM;
        -- Retornar o novo usuário mesmo se houver erro para não bloquear a criação do usuário
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover o trigger se já existir
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;

-- Criar o trigger para executar a função quando um novo usuário for criado
CREATE TRIGGER on_auth_user_created_subscription
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

-- Conceder permissões necessárias
GRANT SELECT, INSERT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.plans TO authenticated, anon;
