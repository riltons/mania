-- Remove políticas existentes
DROP POLICY IF EXISTS "Criador tem acesso total aos membros" ON competition_members;
DROP POLICY IF EXISTS "Membros da comunidade podem ler membros da competição" ON competition_members;
DROP POLICY IF EXISTS "Membros da comunidade podem adicionar membros à competição" ON competition_members;
DROP POLICY IF EXISTS "Membros da comunidade podem remover membros da competição" ON competition_members;

-- Habilita RLS
ALTER TABLE competition_members ENABLE ROW LEVEL SECURITY;

-- Política para SELECT - Qualquer usuário autenticado pode ver membros das competições
CREATE POLICY "Visualizar membros da competição"
    ON competition_members FOR SELECT
    TO authenticated
    USING (true);

-- Política para INSERT - Apenas criadores da competição podem adicionar membros
CREATE POLICY "Adicionar membros à competição"
    ON competition_members FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM competitions c
            WHERE c.id = competition_id
            AND c.created_by = auth.uid()
        )
    );

-- Política para DELETE - Apenas criadores da competição podem remover membros
CREATE POLICY "Remover membros da competição"
    ON competition_members FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM competitions c
            WHERE c.id = competition_id
            AND c.created_by = auth.uid()
        )
    );