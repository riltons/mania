-- Criação da função para obter o jogador primário do usuário
CREATE OR REPLACE FUNCTION public.get_primary_player(
  p_user_id uuid
)
RETURNS TABLE (
  id uuid,
  name text,
  nickname text,
  phone text,
  created_at timestamptz,
  created_by uuid,
  avatar_url text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- Retorna o jogador primário do usuário, se existir
  SELECT 
    p.id,
    p.name,
    p.nickname,
    p.phone,
    p.created_at,
    p.created_by,
    p.avatar_url
  FROM 
    players p
    INNER JOIN user_player_relations upr ON p.id = upr.player_id
  WHERE 
    upr.user_id = p_user_id
    AND upr.is_primary = true
  LIMIT 1;
$$;

-- Garantir que a função seja executada com as permissões do usuário que a criou
ALTER FUNCTION public.get_primary_player(uuid) OWNER TO postgres;

-- Conceder permissões para a função ser executada por usuários autenticados
GRANTE EXECUTE ON FUNCTION public.get_primary_player(uuid) TO authenticated;

-- Comentário para documentação
COMMENT ON FUNCTION public.get_primary_player IS 'Função para obter o jogador primário de um usuário de forma eficiente.';
