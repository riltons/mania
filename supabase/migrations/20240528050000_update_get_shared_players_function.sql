-- Atualizar a função get_shared_players para incluir suporte a busca
CREATE OR REPLACE FUNCTION public.get_shared_players(
  user_id uuid,
  search_term text DEFAULT NULL
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
  shared_by text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- Retorna jogadores compartilhados com o usuário, com opção de busca
  SELECT 
    p.id,
    p.name,
    p.nickname,
    p.phone,
    p.created_at,
    p.created_by,
    p.avatar_url,
    upr.is_primary,
    u.email as shared_by
  FROM 
    players p
    INNER JOIN user_player_relations upr ON p.id = upr.player_id
    INNER JOIN auth.users u ON p.created_by = u.id
  WHERE 
    upr.user_id = get_shared_players.user_id
    AND p.created_by != get_shared_players.user_id
    AND (
      get_shared_players.search_term IS NULL 
      OR p.name ILIKE '%' || get_shared_players.search_term || '%'
      OR p.nickname ILIKE '%' || get_shared_players.search_term || '%'
      OR p.phone ILIKE '%' || get_shared_players.search_term || '%'
    )
  ORDER BY 
    p.name ASC;
$$;

-- Garantir que a função seja executada com as permissões do usuário que a criou
ALTER FUNCTION public.get_shared_players(uuid, text) OWNER TO postgres;

-- Conceder permissões para a função ser executada por usuários autenticados
GRANTE EXECUTE ON FUNCTION public.get_shared_players(uuid, text) TO authenticated;

-- Comentário para documentação
COMMENT ON FUNCTION public.get_shared_players IS 'Função para obter jogadores compartilhados com um usuário, com suporte a busca por termo.';
