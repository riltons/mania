-- Função para buscar jogadores compartilhados com um usuário
CREATE OR REPLACE FUNCTION public.get_shared_players(user_id uuid)
RETURNS TABLE (
    id uuid,
    name text,
    phone text,
    created_at timestamptz,
    nickname text,
    created_by uuid,
    avatar_url text,
    is_primary boolean
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.name,
    p.phone,
    p.created_at,
    p.nickname,
    p.created_by,
    p.avatar_url,
    upr.is_primary
  FROM 
    players p
    JOIN user_player_relations upr ON p.id = upr.player_id
  WHERE 
    upr.user_id = user_id
    AND p.created_by != user_id;
$$;

-- Permissões para a função
GRANTE EXECUTE ON FUNCTION public.get_shared_players(uuid) TO authenticated, service_role;
