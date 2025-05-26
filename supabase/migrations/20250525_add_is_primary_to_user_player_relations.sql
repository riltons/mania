-- Adiciona a coluna is_primary à tabela user_player_relations
ALTER TABLE public.user_player_relations
ADD COLUMN is_primary BOOLEAN DEFAULT FALSE NOT NULL;

-- Atualiza as políticas de segurança para incluir a nova coluna
DROP POLICY IF EXISTS "Usuários podem ver suas próprias relações" ON public.user_player_relations;
DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias relações" ON public.user_player_relations;

-- Recria as políticas com a nova coluna
CREATE POLICY "Usuários podem ver suas próprias relações"
    ON public.user_player_relations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem gerenciar suas próprias relações"
    ON public.user_player_relations
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Atualiza as relações existentes para definir is_primary como TRUE para o primeiro jogador de cada usuário
WITH ranked_players AS (
    SELECT id, user_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as rn
    FROM user_player_relations
)
UPDATE user_player_relations upr
SET is_primary = TRUE
FROM ranked_players rp
WHERE upr.id = rp.id AND rp.rn = 1;
