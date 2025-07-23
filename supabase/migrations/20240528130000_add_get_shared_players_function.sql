-- Criação da função para obter jogadores compartilhados com um usuário
CREATE OR REPLACE FUNCTION public.get_shared_players(
  user_id uuid,
  search_term text DEFAULT NULL
)
RETURNS SETOF players
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT p.*
  FROM players p
  JOIN user_player_relations upr ON p.id = upr.player_id
  WHERE upr.user_id = user_id
  AND p.created_by != user_id  -- Jogadores criados por outros usuários
  AND (
    search_term IS NULL
    OR p.name ILIKE '%' || search_term || '%'
    OR p.nickname ILIKE '%' || search_term || '%'
    OR p.phone ILIKE '%' || search_term || '%'
  )
  ORDER BY p.name ASC;
$$;
