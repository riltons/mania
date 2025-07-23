-- Cria a função create_community para criar comunidades
CREATE OR REPLACE FUNCTION create_community(
    p_name TEXT,
    p_description TEXT
)
RETURNS communities
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_community communities;
    v_community_count INTEGER;
BEGIN
    -- Obtém o ID do usuário atual
    v_user_id := auth.uid();
    
    -- Verifica se o usuário está autenticado
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Verifica se o usuário já atingiu o limite de comunidades (3)
    SELECT COUNT(*) INTO v_community_count
    FROM communities
    WHERE created_by = v_user_id;
    
    IF v_community_count >= 3 THEN
        RAISE EXCEPTION 'Você atingiu o limite máximo de 3 comunidades';
    END IF;
    
    -- Cria a comunidade
    INSERT INTO communities (
        name,
        description,
        created_by,
        disabled
    ) VALUES (
        p_name,
        p_description,
        v_user_id,
        false
    )
    RETURNING * INTO v_community;
    
    -- Adiciona o criador como organizador da comunidade
    INSERT INTO community_organizers (
        community_id,
        user_id
    ) VALUES (
        v_community.id,
        v_user_id
    );
    
    RETURN v_community;
END;
$$;
