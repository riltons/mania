-- Criação da função para criar ou vincular um jogador em uma transação
CREATE OR REPLACE FUNCTION public.create_or_link_player(
  p_name text,
  p_nickname text,
  p_phone text,
  p_avatar_url text,
  p_user_id uuid
)
RETURNS TABLE (
  id uuid,
  name text,
  nickname text,
  phone text,
  avatar_url text,
  created_at timestamptz,
  created_by uuid,
  is_shared boolean,
  is_primary boolean,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_player_id uuid;
  v_player_exists boolean;
  v_relation_exists boolean;
  v_is_primary boolean;
  v_error_message text;
  v_created_player_id uuid;
  v_created_by_other_user boolean := false;
  v_result RECORD;
BEGIN
  -- Iniciar uma transação
  BEGIN
    -- Verificar se já existe um jogador com o mesmo nome e telefone
    SELECT id, created_by != p_user_id INTO v_player_id, v_created_by_other_user
    FROM players
    WHERE (name = p_name OR phone = p_phone)
    LIMIT 1;
    
    -- Se o jogador não existir, criar um novo
    IF v_player_id IS NULL THEN
      INSERT INTO players (
        id, 
        name, 
        nickname, 
        phone, 
        avatar_url, 
        created_by, 
        created_at
      ) VALUES (
        gen_random_uuid(),
        p_name,
        p_nickname,
        p_phone,
        p_avatar_url,
        p_user_id,
        NOW()
      )
      RETURNING id INTO v_player_id;
      
      -- Definir que o jogador não é compartilhado (foi criado pelo usuário atual)
      v_created_by_other_user := false;
    ELSE
      -- Se o jogador for de outro usuário, marcar como compartilhado
      IF v_created_by_other_user THEN
        -- Verificar se já existe uma relação
        SELECT EXISTS (
          SELECT 1 
          FROM user_player_relations 
          WHERE user_id = p_user_id 
          AND player_id = v_player_id
        ) INTO v_relation_exists;
        
        -- Se não existir, criar a relação
        IF NOT v_relation_exists THEN
          -- Verificar se este é o primeiro jogador do usuário (será definido como primário)
          SELECT NOT EXISTS (
            SELECT 1 
            FROM user_player_relations 
            WHERE user_id = p_user_id
          ) INTO v_is_primary;
          
          INSERT INTO user_player_relations (
            user_id,
            player_id,
            is_primary,
            created_at
          ) VALUES (
            p_user_id,
            v_player_id,
            v_is_primary,
            NOW()
          );
        END IF;
      END IF;
    END IF;
    
    -- Se o jogador foi criado pelo usuário atual, garantir que exista uma relação
    IF NOT v_created_by_other_user THEN
      -- Verificar se já existe uma relação
      SELECT EXISTS (
        SELECT 1 
        FROM user_player_relations 
        WHERE user_id = p_user_id 
        AND player_id = v_player_id
      ) INTO v_relation_exists;
      
      -- Se não existir, criar a relação
      IF NOT v_relation_exists THEN
        -- Verificar se este é o primeiro jogador do usuário (será definido como primário)
        SELECT NOT EXISTS (
          SELECT 1 
          FROM user_player_relations 
          WHERE user_id = p_user_id
        ) INTO v_is_primary;
        
        INSERT INTO user_player_relations (
          user_id,
          player_id,
          is_primary,
          created_at
        ) VALUES (
          p_user_id,
          v_player_id,
          v_is_primary,
          NOW()
        );
      END IF;
    END IF;
    
    -- Buscar os dados completos do jogador para retornar
    RETURN QUERY
    SELECT 
      p.id,
      p.name,
      p.nickname,
      p.phone,
      p.avatar_url,
      p.created_at,
      p.created_by,
      (p.created_by != p_user_id) as is_shared,
      COALESCE(upr.is_primary, false) as is_primary,
      NULL::text as error_message
    FROM 
      players p
      LEFT JOIN user_player_relations upr ON p.id = upr.player_id AND upr.user_id = p_user_id
    WHERE 
      p.id = v_player_id;
      
  EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro, retornar mensagem de erro
    GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
    
    RETURN QUERY
    SELECT 
      NULL::uuid as id,
      NULL::text as name,
      NULL::text as nickname,
      NULL::text as phone,
      NULL::text as avatar_url,
      NULL::timestamptz as created_at,
      NULL::uuid as created_by,
      false as is_shared,
      false as is_primary,
      v_error_message as error_message
    LIMIT 1;
  END;
END;
$$;

-- Garantir que a função seja executada com as permissões do usuário que a criou
ALTER FUNCTION public.create_or_link_player(text, text, text, text, uuid) OWNER TO postgres;

-- Conceder permissões para a função ser executada por usuários autenticados
GRANTE EXECUTE ON FUNCTION public.create_or_link_player(text, text, text, text, uuid) TO authenticated;

-- Comentário para documentação
COMMENT ON FUNCTION public.create_or_link_player IS 'Função para criar um novo jogador ou vincular um jogador existente ao usuário atual. Retorna os dados do jogador com informações adicionais sobre o relacionamento.';
