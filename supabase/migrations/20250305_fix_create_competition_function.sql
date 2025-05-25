-- Atualiza a função create_competition para incluir o parâmetro start_date
CREATE OR REPLACE FUNCTION create_competition(
    p_name TEXT,
    p_description TEXT,
    p_community_id UUID,
    p_created_by UUID,
    p_start_date TIMESTAMP WITH TIME ZONE
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
        p_start_date,
        'pending'
    )
    RETURNING * INTO v_competition;

    RETURN v_competition;
END;
$$;