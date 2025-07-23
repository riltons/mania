-- Função para criar uma competição com verificação de permissões
CREATE OR REPLACE FUNCTION create_competition(
    p_name TEXT,
    p_description TEXT,
    p_community_id UUID,
    p_created_by UUID
)
RETURNS competitions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_authorized BOOLEAN;
    v_competition competitions;
BEGIN
    -- Verifica se o usuário é criador da comunidade ou organizador
    SELECT EXISTS (
        SELECT 1
        FROM communities c
        WHERE c.id = p_community_id
        AND c.created_by = p_created_by
    ) OR EXISTS (
        SELECT 1
        FROM community_organizers co
        WHERE co.community_id = p_community_id
        AND co.user_id = p_created_by
    ) INTO v_is_authorized;

    IF NOT v_is_authorized THEN
        RAISE EXCEPTION 'Usuário não tem permissão para criar competições nesta comunidade';
    END IF;

    -- Cria a competição
    INSERT INTO competitions (
        name,
        description,
        community_id,
        created_by,
        start_date,
        status
    ) VALUES (
        p_name,
        p_description,
        p_community_id,
        p_created_by,
        NOW(),
        'pending'
    )
    RETURNING * INTO v_competition;

    RETURN v_competition;
END;
$$;

-- Função para buscar competições de uma comunidade
CREATE OR REPLACE FUNCTION get_community_competitions(
    p_community_id UUID,
    p_user_id UUID
)
RETURNS SETOF competitions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verifica se o usuário tem acesso à comunidade
    IF EXISTS (
        SELECT 1
        FROM communities c
        WHERE c.id = p_community_id
        AND c.created_by = p_user_id
    ) OR EXISTS (
        SELECT 1
        FROM community_organizers co
        WHERE co.community_id = p_community_id
        AND co.user_id = p_user_id
    ) OR EXISTS (
        SELECT 1
        FROM community_members cm
        WHERE cm.community_id = p_community_id
        AND cm.player_id = p_user_id
    ) THEN
        RETURN QUERY
        SELECT c.*
        FROM competitions c
        WHERE c.community_id = p_community_id
        ORDER BY c.start_date DESC;
    END IF;

    RETURN;
END;
$$;

-- Função para buscar uma competição específica
CREATE OR REPLACE FUNCTION get_competition_by_id(
    p_competition_id UUID,
    p_user_id UUID
)
RETURNS competitions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_competition competitions;
    v_community_id UUID;
BEGIN
    -- Obtém o ID da comunidade da competição
    SELECT community_id INTO v_community_id
    FROM competitions
    WHERE id = p_competition_id;

    -- Verifica se o usuário tem acesso à comunidade
    IF EXISTS (
        SELECT 1
        FROM communities c
        WHERE c.id = v_community_id
        AND c.created_by = p_user_id
    ) OR EXISTS (
        SELECT 1
        FROM community_organizers co
        WHERE co.community_id = v_community_id
        AND co.user_id = p_user_id
    ) OR EXISTS (
        SELECT 1
        FROM community_members cm
        WHERE cm.community_id = v_community_id
        AND cm.player_id = p_user_id
    ) THEN
        SELECT c.*
        INTO v_competition
        FROM competitions c
        WHERE c.id = p_competition_id;

        RETURN v_competition;
    END IF;

    RETURN NULL;
END;
$$;

-- Remove as políticas antigas da tabela competitions
DROP POLICY IF EXISTS "Permitir select para membros da comunidade" ON competitions;
DROP POLICY IF EXISTS "Permitir insert para organizadores" ON competitions;
DROP POLICY IF EXISTS "Permitir update para organizadores" ON competitions;
DROP POLICY IF EXISTS "Permitir delete para organizadores" ON competitions;

-- Cria novas políticas simplificadas
CREATE POLICY "Acesso via funções RPC apenas"
ON competitions
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Garante que a tabela está configurada para RLS
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
