-- Remover políticas existentes
DROP POLICY IF EXISTS "Usuários podem ver todos os jogadores" ON public.players;
DROP POLICY IF EXISTS "Usuários podem criar jogadores" ON public.players;
DROP POLICY IF EXISTS "Usuários podem atualizar seus jogadores" ON public.players;

-- Habilitar RLS na tabela players se ainda não estiver habilitado
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Permitir que usuários autenticados vejam todos os jogadores
CREATE POLICY "Usuários podem ver todos os jogadores"
    ON public.players
    FOR SELECT
    TO authenticated
    USING (true);

-- Permitir que usuários autenticados criem jogadores
CREATE POLICY "Usuários podem criar jogadores"
    ON public.players
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Permitir que usuários autenticados atualizem jogadores vinculados a eles
CREATE POLICY "Usuários podem atualizar seus jogadores"
    ON public.players
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.user_player_relations 
            WHERE user_player_relations.player_id = players.id 
            AND user_player_relations.user_id = auth.uid()
        )
    );

-- Criar índice único para telefone (ignorando valores nulos/vazios)
DROP INDEX IF EXISTS players_phone_unique_idx;
CREATE UNIQUE INDEX players_phone_unique_idx 
ON public.players (phone) 
WHERE phone IS NOT NULL AND phone != '';
