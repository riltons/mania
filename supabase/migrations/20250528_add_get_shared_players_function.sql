-- Função para obter jogadores compartilhados (criados por outros usuários)
CREATE OR REPLACE FUNCTION public.get_shared_players(user_id UUID)
RETURNS SETOF players
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Retorna jogadores que estão vinculados ao usuário atual mas foram criados por outros usuários
  RETURN QUERY
  SELECT p.*
  FROM players p
  JOIN user_player_relations upr ON p.id = upr.player_id
  WHERE upr.user_id = get_shared_players.user_id
  AND p.created_by != get_shared_players.user_id;
END;
$$;

-- Adiciona comentário à função
COMMENT ON FUNCTION public.get_shared_players IS 'Retorna jogadores que foram criados por outros usuários mas estão vinculados ao usuário atual';
