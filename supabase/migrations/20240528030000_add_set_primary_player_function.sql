-- Criação da função que será executada em uma transação
CREATE OR REPLACE FUNCTION public.set_primary_player_transaction(
  p_user_id uuid,
  p_player_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  v_has_access boolean;
BEGIN
  -- Verificar se o usuário tem acesso ao jogador
  SELECT EXISTS (
    SELECT 1 
    FROM user_player_relations 
    WHERE user_id = p_user_id 
    AND player_id = p_player_id
  ) INTO v_has_access;
  
  IF NOT v_has_access THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Usuário não tem permissão para acessar este jogador'
    );
  END IF;
  
  -- Iniciar transação implícita
  BEGIN
    -- Remover status de primário de todos os jogadores do usuário
    UPDATE user_player_relations
    SET is_primary = false
    WHERE user_id = p_user_id;
    
    -- Definir o jogador selecionado como primário
    UPDATE user_player_relations
    SET is_primary = true
    WHERE user_id = p_user_id 
    AND player_id = p_player_id;
    
    -- Se chegou até aqui, tudo ocorreu bem
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Jogador definido como primário com sucesso'
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro, fazer rollback e retornar mensagem de erro
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Erro ao definir jogador primário: ' || SQLERRM
    );
  END;
END;
$$;

-- Garantir que a função seja executada com as permissões do usuário que a criou
ALTER FUNCTION public.set_primary_player_transaction(uuid, uuid) OWNER TO postgres;

-- Conceder permissões para a função ser executada por usuários autenticados
GRANTE EXECUTE ON FUNCTION public.set_primary_player_transaction(uuid, uuid) TO authenticated;

-- Comentário para documentação
COMMENT ON FUNCTION public.set_primary_player_transaction IS 'Função para definir um jogador como primário para um usuário, garantindo consistência transacional.';
