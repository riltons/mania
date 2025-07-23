-- Correção da função create_or_link_player para garantir que jogadores existentes
-- sejam vinculados ao usuário atual, mesmo quando criados por outros usuários
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
    -- Verificar se já existe um jogador com o mesmo telefone
    SELECT id, created_by != p_user_id INTO v_player_id, v_created_by_other_user
    FROM players
    WHERE phone = p_phone
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
    END IF;
    
    -- Verificar se já existe uma relação entre o usuário e o jogador
    SELECT EXISTS (
      SELECT 1 
      FROM user_player_relations 
      WHERE user_id = p_user_id 
      AND player_id = v_player_id
    ) INTO v_relation_exists;
    
    -- Se não existir relação, criar uma nova
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
      
  EXCEPTION
    WHEN OTHERS THEN
      -- Em caso de erro, retornar uma mensagem de erro
      v_error_message := 'Erro ao processar o jogador: ' || SQLERRM;
      
      RETURN QUERY
      SELECT 
        NULL::uuid,
        NULL::text,
        NULL::text,
        NULL::text,
        NULL::text,
        NULL::timestamptz,
        NULL::uuid,
        NULL::boolean,
        NULL::boolean,
        v_error_message;
  END;
END;
$$;
