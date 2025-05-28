-- Remover as funções conflitantes
DROP FUNCTION IF EXISTS public.get_shared_players(text, uuid);
DROP FUNCTION IF EXISTS public.get_shared_players(uuid, text);

-- Criar uma nova função com um nome diferente
CREATE OR REPLACE FUNCTION public.fetch_shared_players(
  p_user_id uuid,
  p_search_term text DEFAULT NULL
)
RETURNS SETOF players
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT p.*
  FROM players p
  JOIN user_player_relations upr ON p.id = upr.player_id
  WHERE upr.user_id = p_user_id
  AND p.created_by != p_user_id  -- Jogadores criados por outros usuários
  AND (
    p_search_term IS NULL
    OR p.name ILIKE '%' || p_search_term || '%'
    OR p.nickname ILIKE '%' || p_search_term || '%'
    OR p.phone ILIKE '%' || p_search_term || '%'
  )
  ORDER BY p.name ASC;
$$;
