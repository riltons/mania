-- Adiciona a coluna is_primary na tabela user_player_relations
ALTER TABLE public.user_player_relations 
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- Atualiza os registros existentes para definir como true para o usuário que criou o jogador
UPDATE public.user_player_relations upr
SET is_primary = true
FROM public.players p
WHERE upr.player_id = p.id AND upr.user_id = p.created_by;

-- Cria um índice para melhorar a performance nas consultas
CREATE INDEX IF NOT EXISTS idx_user_player_relations_player_id ON public.user_player_relations(player_id);
CREATE INDEX IF NOT EXISTS idx_user_player_relations_user_id ON public.user_player_relations(user_id);
