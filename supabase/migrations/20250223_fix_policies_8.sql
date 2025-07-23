-- Remover políticas antigas que possam conflitar
DROP POLICY IF EXISTS "Ver jogadores" ON public.players;
DROP POLICY IF EXISTS "Atualizar jogadores" ON public.players;
DROP POLICY IF EXISTS "Adicionar jogadores" ON public.players;
DROP POLICY IF EXISTS "Remover jogadores" ON public.players;

-- Política para permitir que usuários vejam seus próprios jogadores e jogadores das comunidades onde são organizadores
CREATE POLICY "Ver jogadores"
    ON public.players
    FOR SELECT
    USING (
        -- Jogadores criados pelo usuário
        created_by = auth.uid()
        -- OU jogadores em comunidades onde é organizador
        OR EXISTS (
            SELECT 1
            FROM public.community_members cm
            JOIN public.communities c ON c.id = cm.community_id
            JOIN public.community_organizers co ON co.community_id = c.id
            WHERE cm.player_id = players.id
            AND co.user_id = auth.uid()
        )
    );

-- Política para permitir que criadores atualizem jogadores
CREATE POLICY "Atualizar jogadores"
    ON public.players
    FOR UPDATE
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Política para permitir que criadores adicionem jogadores
CREATE POLICY "Adicionar jogadores"
    ON public.players
    FOR INSERT
    WITH CHECK (created_by = auth.uid());

-- Política para permitir que criadores removam seus próprios jogadores
CREATE POLICY "Remover jogadores"
    ON public.players
    FOR DELETE
    USING (created_by = auth.uid());
