-- Remover a chave estrangeira adicionada em 20250303_add_competition_members_foreign_key.sql
ALTER TABLE competition_members
DROP CONSTRAINT IF EXISTS fk_competition_members_player;

-- Remover as políticas criadas em 20250302_fix_competition_members_policies.sql
DROP POLICY IF EXISTS "Visualizar membros da competição" ON competition_members;
DROP POLICY IF EXISTS "Adicionar membros à competição" ON competition_members;
DROP POLICY IF EXISTS "Remover membros da competição" ON competition_members;

-- Recriar as políticas originais
CREATE POLICY "Criador tem acesso total aos membros"
    ON competition_members FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM competitions c
            WHERE c.id = competition_id
            AND c.created_by = auth.uid()
        )
    );

CREATE POLICY "Membros da comunidade podem ler membros da competição"
    ON competition_members FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Membros da comunidade podem adicionar membros à competição"
    ON competition_members FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Membros da comunidade podem remover membros da competição"
    ON competition_members FOR DELETE
    TO authenticated
    USING (true);