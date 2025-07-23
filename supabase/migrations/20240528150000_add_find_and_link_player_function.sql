-- Função para encontrar um jogador pelo telefone e vinculá-lo ao usuário atual
CREATE OR REPLACE FUNCTION public.find_and_link_player(
  p_phone text,
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
  v_normalized_phone text;
BEGIN
  -- Normalizar o telefone (remover caracteres não numéricos)
  v_normalized_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
  
  -- Iniciar uma transação
  BEGIN
    -- Buscar o jogador pelo telefone
    SELECT id INTO v_player_id
    FROM players
    WHERE phone = v_normalized_phone
    LIMIT 1;
    
    -- Se o jogador for encontrado, verificar se já existe uma relação com o usuário
    IF v_player_id IS NOT NULL THEN
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
    ELSE
      -- Jogador não encontrado
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
        'Jogador não encontrado'::text;
    END IF;
      
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
