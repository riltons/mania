-- Migração para remover a restrição UNIQUE na coluna user_id da tabela user_player_relations
-- e criar a função RPC link_player_to_user para permitir vincular jogadores a múltiplos usuários

-- 1. Remover a restrição UNIQUE na coluna user_id
DO $$
BEGIN
    -- Verifica se a restrição existe antes de tentar removê-la
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
        AND table_name = 'user_player_relations'
        AND constraint_name LIKE '%user_id%'
        AND constraint_type = 'UNIQUE'
    ) THEN
        -- Remove a restrição UNIQUE
        EXECUTE (
            SELECT 'ALTER TABLE public.user_player_relations DROP CONSTRAINT ' || constraint_name
            FROM information_schema.table_constraints
            WHERE constraint_schema = 'public'
            AND table_name = 'user_player_relations'
            AND constraint_name LIKE '%user_id%'
            AND constraint_type = 'UNIQUE'
            LIMIT 1
        );
    END IF;
END $$;

-- 2. Criar uma restrição UNIQUE composta para evitar duplicatas de relação usuário-jogador
ALTER TABLE public.user_player_relations
ADD CONSTRAINT user_player_relations_user_player_unique UNIQUE (user_id, player_id);

-- 3. Remover a função existente e criar a nova função RPC link_player_to_user
DROP FUNCTION IF EXISTS public.link_player_to_user(uuid, uuid, boolean);

CREATE FUNCTION public.link_player_to_user(
    player_id UUID,
    user_id UUID,
    is_primary BOOLEAN DEFAULT false
) RETURNS BOOLEAN AS $$
DECLARE
    result BOOLEAN;
BEGIN
    -- Insere o registro na tabela user_player_relations
    INSERT INTO public.user_player_relations (
        user_id,
        player_id,
        is_primary
    )
    VALUES (
        user_id,
        player_id,
        is_primary
    )
    ON CONFLICT (user_id, player_id) 
    DO UPDATE SET
        is_primary = EXCLUDED.is_primary
    RETURNING true INTO result;

    -- Retorna o resultado da operação
    RETURN COALESCE(result, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Comentário para documentar a função
COMMENT ON FUNCTION public.link_player_to_user IS 'Vincula um jogador a um usuário, permitindo que um jogador seja vinculado a múltiplos usuários.';
