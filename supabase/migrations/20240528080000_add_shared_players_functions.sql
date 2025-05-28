-- Criação da função para buscar jogadores compartilhados com informações adicionais
CREATE OR REPLACE FUNCTION public.get_shared_players_with_details(p_user_id uuid)
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
  shared_by_email text,
  shared_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.name,
    p.nickname,
    p.phone,
    p.avatar_url,
    p.created_at,
    p.created_by,
    true as is_shared,
    COALESCE(upr.is_primary, false) as is_primary,
    u.email as shared_by_email,
    upr.created_at as shared_at
  FROM 
    user_player_relations upr
    JOIN players p ON upr.player_id = p.id
    LEFT JOIN auth.users u ON p.created_by = u.id
  WHERE 
    upr.user_id = p_user_id
    AND p.created_by != p_user_id
  ORDER BY 
    upr.created_at DESC;
$$;

-- Criação da função para compartilhar um jogador com um usuário
CREATE OR REPLACE FUNCTION public.share_player_with_user(
  p_player_id uuid,
  p_target_user_id uuid,
  p_is_primary boolean,
  p_shared_by uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_relation_exists boolean;
  v_has_primary boolean;
  v_shared_by_email text;
BEGIN
  -- Verificar se o jogador existe e pertence ao usuário que está compartilhando
  IF NOT EXISTS (
    SELECT 1 
    FROM players 
    WHERE id = p_player_id AND created_by = p_shared_by
  ) THEN
    RAISE EXCEPTION 'Você só pode compartilhar jogadores que você criou';
  END IF;
  
  -- Verificar se o usuário de destino existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_target_user_id) THEN
    RAISE EXCEPTION 'Usuário de destino não encontrado';
  END IF;
  
  -- Verificar se o jogador já está compartilhado com o usuário
  SELECT EXISTS (
    SELECT 1 
    FROM user_player_relations 
    WHERE user_id = p_target_user_id 
    AND player_id = p_player_id
  ) INTO v_relation_exists;
  
  IF v_relation_exists THEN
    RAISE EXCEPTION 'Este jogador já está compartilhado com o usuário';
  END IF;
  
  -- Verificar se o usuário já tem um jogador principal
  IF p_is_primary THEN
    -- Se for para definir como principal, remover a flag de principal dos outros jogadores
    UPDATE user_player_relations 
    SET is_primary = false 
    WHERE user_id = p_target_user_id;
  END IF;
  
  -- Obter o email do usuário que está compartilhando para registro
  SELECT email INTO v_shared_by_email 
  FROM auth.users 
  WHERE id = p_shared_by;
  
  -- Inserir a relação de compartilhamento
  INSERT INTO user_player_relations (
    user_id,
    player_id,
    is_primary,
    created_by,
    metadata
  ) VALUES (
    p_target_user_id,
    p_player_id,
    COALESCE(p_is_primary, false),
    p_shared_by,
    jsonb_build_object('shared_by', v_shared_by_email)
  );
  
  -- Se o usuário não tiver nenhum jogador principal e este for o primeiro, definir como principal
  IF NOT EXISTS (
    SELECT 1 
    FROM user_player_relations 
    WHERE user_id = p_target_user_id 
    AND is_primary = true
  ) THEN
    UPDATE user_player_relations 
    SET is_primary = true 
    WHERE user_id = p_target_user_id 
    AND player_id = p_player_id;
  END IF;
  
  -- Registrar o compartilhamento em uma tabela de auditoria (opcional)
  INSERT INTO player_share_audit (
    player_id,
    shared_by,
    shared_with,
    shared_at,
    is_primary
  ) VALUES (
    p_player_id,
    p_shared_by,
    p_target_user_id,
    NOW(),
    p_is_primary
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Registrar o erro e propagar
  RAISE EXCEPTION 'Erro ao compartilhar jogador: %', SQLERRM;
END;
$$;

-- Criar tabela de auditoria para compartilhamentos (se não existir)
CREATE TABLE IF NOT EXISTS public.player_share_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  shared_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  shared_with uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_at timestamptz NOT NULL DEFAULT NOW(),
  is_primary boolean NOT NULL DEFAULT false,
  revoked_at timestamptz,
  revoked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Garantir que as funções tenham as permissões corretas
ALTER FUNCTION public.get_shared_players_with_details(uuid) OWNER TO postgres;
ALTER FUNCTION public.share_player_with_user(uuid, uuid, boolean, uuid) OWNER TO postgres;

-- Conceder permissões para as funções
GRANTE EXECUTE ON FUNCTION public.get_shared_players_with_details(uuid) TO authenticated;
GRANTE EXECUTE ON FUNCTION public.share_player_with_user(uuid, uuid, boolean, uuid) TO authenticated;

-- Comentários para documentação
COMMENT ON FUNCTION public.get_shared_players_with_details IS 'Retorna a lista de jogadores compartilhados com o usuário, incluindo informações adicionais como quem compartilhou e quando.';

COMMENT ON FUNCTION public.share_player_with_user IS 'Compartilha um jogador com outro usuário, com opção de definir como jogador principal. Apenas o criador do jogador pode compartilhá-lo.';

-- Criar índices para melhorar o desempenho
CREATE INDEX IF NOT EXISTS idx_user_player_relations_user_id ON public.user_player_relations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_player_relations_player_id ON public.user_player_relations(player_id);
CREATE INDEX IF NOT EXISTS idx_player_share_audit_player_id ON public.player_share_audit(player_id);
CREATE INDEX IF NOT EXISTS idx_player_share_audit_shared_with ON public.player_share_audit(shared_with);
