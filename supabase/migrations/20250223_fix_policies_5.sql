-- Remover políticas antigas que possam conflitar
DROP POLICY IF EXISTS "Criadores podem ver membros" ON public.community_members;
DROP POLICY IF EXISTS "Criadores podem adicionar membros" ON public.community_members;
DROP POLICY IF EXISTS "Criadores podem remover membros" ON public.community_members;
DROP POLICY IF EXISTS "Organizadores podem ver membros" ON public.community_members;
DROP POLICY IF EXISTS "Organizadores podem adicionar membros" ON public.community_members;
DROP POLICY IF EXISTS "Organizadores podem remover membros" ON public.community_members;
DROP POLICY IF EXISTS "Ver membros da comunidade" ON public.community_members;
DROP POLICY IF EXISTS "Adicionar membros à comunidade" ON public.community_members;
DROP POLICY IF EXISTS "Remover membros da comunidade" ON public.community_members;
DROP POLICY IF EXISTS "Ver jogadores" ON public.players;
DROP POLICY IF EXISTS "Atualizar jogadores" ON public.players;
DROP POLICY IF EXISTS "Adicionar jogadores" ON public.players;
DROP POLICY IF EXISTS "Remover jogadores" ON public.players;

-- Habilitar RLS nas tabelas
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Política para permitir que criadores e organizadores vejam os membros
CREATE POLICY "Ver membros da comunidade"
    ON public.community_members
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.communities c
            WHERE c.id = community_id
            AND (
                c.created_by = auth.uid() -- Criador da comunidade
                OR EXISTS (
                    SELECT 1
                    FROM public.community_organizers co
                    WHERE co.community_id = c.id
                    AND co.user_id = auth.uid() -- Organizador da comunidade
                )
            )
        )
    );

-- Política para permitir que criadores e organizadores adicionem membros
CREATE POLICY "Adicionar membros à comunidade"
    ON public.community_members
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.communities c
            WHERE c.id = community_id
            AND (
                c.created_by = auth.uid() -- Criador da comunidade
                OR EXISTS (
                    SELECT 1
                    FROM public.community_organizers co
                    WHERE co.community_id = c.id
                    AND co.user_id = auth.uid() -- Organizador da comunidade
                )
            )
        )
    );

-- Política para permitir que criadores e organizadores removam membros
CREATE POLICY "Remover membros da comunidade"
    ON public.community_members
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM public.communities c
            WHERE c.id = community_id
            AND (
                c.created_by = auth.uid() -- Criador da comunidade
                OR EXISTS (
                    SELECT 1
                    FROM public.community_organizers co
                    WHERE co.community_id = c.id
                    AND co.user_id = auth.uid() -- Organizador da comunidade
                )
            )
        )
    );

-- Política para permitir que criadores e organizadores vejam os jogadores
CREATE POLICY "Ver jogadores"
    ON public.players
    FOR SELECT
    USING (
        -- Criador do jogador
        created_by = auth.uid()
        -- OU jogador está em uma comunidade onde o usuário é criador ou organizador
        OR EXISTS (
            SELECT 1
            FROM public.community_members cm
            JOIN public.communities c ON c.id = cm.community_id
            LEFT JOIN public.community_organizers co ON co.community_id = c.id
            WHERE cm.player_id = players.id
            AND (
                c.created_by = auth.uid() -- Criador da comunidade
                OR co.user_id = auth.uid() -- Organizador da comunidade
            )
        )
    );

-- Política para permitir que criadores e organizadores atualizem jogadores
CREATE POLICY "Atualizar jogadores"
    ON public.players
    FOR UPDATE
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Política para permitir que criadores e organizadores adicionem jogadores
CREATE POLICY "Adicionar jogadores"
    ON public.players
    FOR INSERT
    WITH CHECK (created_by = auth.uid());

-- Política para permitir que criadores removam seus próprios jogadores
CREATE POLICY "Remover jogadores"
    ON public.players
    FOR DELETE
    USING (created_by = auth.uid());
