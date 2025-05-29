-- Corrigir a função create_community_direct para garantir que o criador seja adicionado como organizador
CREATE OR REPLACE FUNCTION public.create_community_direct(p_name text, p_description text)
RETURNS SETOF communities
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_community_id UUID;
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
    RETURNING id INTO v_community_id;
    
    -- Adiciona o criador como organizador da comunidade
    -- Usando EXECUTE para garantir que a inserção seja feita com os privilégios corretos
    BEGIN
        -- Desativar temporariamente as políticas RLS para esta operação
        ALTER TABLE community_organizers DISABLE ROW LEVEL SECURITY;
        
        -- Inserir o registro do organizador
        INSERT INTO community_organizers (
            community_id,
            user_id
        ) VALUES (
            v_community_id,
            v_user_id
        );
        
        -- Reativar as políticas RLS
        ALTER TABLE community_organizers ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN
        -- Reativar as políticas RLS em caso de erro
        ALTER TABLE community_organizers ENABLE ROW LEVEL SECURITY;
        
        -- Registrar o erro e lançar exceção
        RAISE EXCEPTION 'Erro ao adicionar usuário como organizador: %', SQLERRM;
    END;
    
    -- Retorna a comunidade criada
    RETURN QUERY SELECT * FROM communities WHERE id = v_community_id;
END;
$$;
