-- Adicionar coluna is_primary_user à tabela user_player_relations
ALTER TABLE public.user_player_relations
ADD COLUMN IF NOT EXISTS is_primary_user BOOLEAN DEFAULT false;

-- Atualizar registros existentes para ter is_primary_user = true
UPDATE public.user_player_relations
SET is_primary_user = true
WHERE id IN (
    SELECT DISTINCT ON (player_id) id
    FROM public.user_player_relations
    ORDER BY player_id, created_at ASC
);

-- Criar um índice para melhorar a performance de consultas
CREATE INDEX IF NOT EXISTS idx_user_player_relations_is_primary_user
ON public.user_player_relations(is_primary_user);

-- Atualizar as políticas de segurança
DROP POLICY IF EXISTS "Usuários podem ver suas próprias relações" ON public.user_player_relations;
DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias relações" ON public.user_player_relations;

CREATE POLICY "Usuários podem ver suas próprias relações"
    ON public.user_player_relations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem gerenciar suas próprias relações"
    ON public.user_player_relations
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);
