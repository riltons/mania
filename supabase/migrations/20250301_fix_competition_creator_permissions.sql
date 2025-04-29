-- Remove políticas existentes
DROP POLICY IF EXISTS "Usuários podem ver suas competições" ON competitions;
DROP POLICY IF EXISTS "Usuários podem criar competições" ON competitions;
DROP POLICY IF EXISTS "Usuários podem atualizar suas competições" ON competitions;
DROP POLICY IF EXISTS "Usuários podem deletar suas competições" ON competitions;
DROP POLICY IF EXISTS "Permitir todas operações para usuários autenticados" ON competitions;
DROP POLICY IF EXISTS "Qualquer um pode ler membros da competição" ON competition_members;
DROP POLICY IF EXISTS "Qualquer um pode adicionar membros à competição" ON competition_members;
DROP POLICY IF EXISTS "Qualquer um pode remover membros da competição" ON competition_members;

-- Habilita RLS
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_members ENABLE ROW LEVEL SECURITY;

-- Política para competições - Criador tem acesso total
CREATE POLICY "Criador tem acesso total à competição"
    ON competitions FOR ALL
    TO authenticated
    USING (
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM competition_members cm
            WHERE cm.competition_id = id
            AND EXISTS (
                SELECT 1 FROM players p
                WHERE p.id = cm.player_id
                AND p.created_by = auth.uid()
            )
        )
    )
    WITH CHECK (auth.uid() = created_by);

-- Política para membros da competição - Criador tem acesso total
CREATE POLICY "Criador tem acesso total aos membros"
    ON competition_members FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM competitions c
            WHERE c.id = competition_id
            AND c.created_by = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM players p
            WHERE p.id = player_id
            AND p.created_by = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM competitions c
            WHERE c.id = competition_id
            AND c.created_by = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM players p
            WHERE p.id = player_id
            AND p.created_by = auth.uid()
        )
    );