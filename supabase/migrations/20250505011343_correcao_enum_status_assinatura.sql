-- Script para corrigir o problema do enum subscription_status
-- Verifica se o tipo enum subscription_status existe e atualiza para incluir 'trialing'

DO $$
BEGIN
    -- Verifica se o tipo enum subscription_status existe
    IF EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'subscription_status'
    ) THEN
        -- Verifica se o valor 'trialing' já existe no enum
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'subscription_status'
            AND e.enumlabel = 'trialing'
        ) THEN
            -- Adiciona o valor 'trialing' ao enum
            ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'trialing';
            
            -- Atualiza os registros existentes com status 'trial' para 'trialing'
            UPDATE public.subscriptions
            SET status = 'trialing'
            WHERE status = 'trial';
            
            RAISE NOTICE 'Enum subscription_status atualizado com sucesso e registros atualizados.';
        ELSE
            RAISE NOTICE 'O valor "trialing" já existe no enum subscription_status.';
        END IF;
    ELSE
        -- Se o tipo enum não existir, cria um novo com os valores corretos
        CREATE TYPE subscription_status AS ENUM (
            'active',
            'canceled',
            'expired',
            'trialing'
        );
        
        RAISE NOTICE 'Tipo enum subscription_status criado com sucesso.';
    END IF;
END $$;

-- Atualiza o trigger para usar 'trialing' em vez de 'trial'
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
            plano_id,
            'trialing',
            NOW(),
            NOW(),
            end_date,
            'web'
        )
        ON CONFLICT (user_id, plan_id) DO NOTHING; -- Evitar duplicatas
    EXCEPTION
        WHEN OTHERS THEN
            -- Registrar o erro para debug
            RAISE LOG 'Erro ao criar assinatura automática: %', SQLERRM;
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