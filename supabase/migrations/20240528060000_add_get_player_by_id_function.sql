-- Criação da função para buscar um jogador por ID com verificações de permissão
CREATE OR REPLACE FUNCTION public.get_player_by_id(
  p_player_id uuid,
  p_user_id uuid
)
RETURNS TABLE (
  id uuid,
  name text,
  nickname text,
  phone text,
  created_at timestamptz,
  created_by uuid,
  avatar_url text,
  is_primary boolean,
  is_shared_with_user boolean,
  shared_by text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- Verificar se o jogador existe e se o usuário tem permissão para acessá-lo
  WITH player_permissions AS (
    SELECT 
      p.*,
      upr.is_primary,
      (p.created_by = p_user_id) as is_owner,
      (EXISTS (
        SELECT 1 
        FROM user_player_relations upr2 
        WHERE upr2.user_id = p_user_id 
        AND upr2.player_id = p.id
        AND upr2.user_id != p.created_by
      )) as is_shared_with_user,
      u.email as shared_by_email
    FROM 
      players p
      LEFT JOIN user_player_relations upr ON p.id = upr.player_id AND upr.user_id = p_user_id
      LEFT JOIN auth.users u ON p.created_by = u.id
    WHERE 
      p.id = p_player_id
      AND (
        p.created_by = p_user_id -- O usuário é o criador
        OR EXISTS ( -- Ou o jogador foi compartilhado com o usuário
          SELECT 1 
          FROM user_player_relations upr3 
          WHERE upr3.user_id = p_user_id 
          AND upr3.player_id = p.id
        )
      )
  )
  
  SELECT 
    id,
    name,
    nickname,
    phone,
    created_at,
    created_by,
    avatar_url,
    COALESCE(is_primary, false) as is_primary,
    COALESCE(is_shared_with_user, false) as is_shared_with_user,
    CASE 
      WHEN is_owner THEN NULL 
      ELSE shared_by_email 
    END as shared_by
  FROM 
    player_permissions
  LIMIT 1;
$$;

-- Garantir que a função seja executada com as permissões do usuário que a criou
ALTER FUNCTION public.get_player_by_id(uuid, uuid) OWNER TO postgres;

-- Conceder permissões para a função ser executada por usuários autenticados
GRANTE EXECUTE ON FUNCTION public.get_player_by_id(uuid, uuid) TO authenticated;

-- Comentário para documentação
COMMENT ON FUNCTION public.get_player_by_id IS 'Função para buscar um jogador por ID com verificações de permissão. Retorna o jogador apenas se o usuário for o criador ou se o jogador tiver sido compartilhado com ele.';
