-- Remover política de seleção existente
DROP POLICY IF EXISTS "Usuários autenticados podem ver jogos" ON games;

-- Nova política para SELECT - Usuários só podem ver jogos das competições que participam ou organizam
CREATE POLICY "Usuários podem ver jogos das competições que participam ou organizam" ON games
FOR SELECT USING (
    auth.role() = 'authenticated' AND (
        -- Usuário é membro da competição
        EXISTS (
            SELECT 1
            FROM competition_members cm
            JOIN players p ON cm.player_id = p.id
            WHERE cm.competition_id = games.competition_id
            AND p.created_by = auth.uid()
        )
        OR
        -- OU usuário é criador da comunidade
        EXISTS (
            SELECT 1
            FROM competitions c
            JOIN communities comm ON comm.id = c.community_id
            WHERE c.id = games.competition_id
            AND comm.created_by = auth.uid()
        )
        OR
        -- OU usuário é organizador da comunidade
        EXISTS (
            SELECT 1
            FROM competitions c
            JOIN community_organizers co ON co.community_id = c.community_id
            WHERE c.id = games.competition_id
            AND co.user_id = auth.uid()
        )
    )
);

-- Garantir que RLS está habilitado
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
