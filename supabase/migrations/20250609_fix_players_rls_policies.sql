-- Remove as políticas existentes com nome incorreto
DROP POLICY IF EXISTS "Usuários podem criar jogadores" ON players;
DROP POLICY IF EXISTS "Usuários podem atualizar seus jogadores" ON players;
DROP POLICY IF EXISTS "Usuários podem deletar seus jogadores" ON players;

-- Cria novas políticas usando a coluna correta created_by
CREATE POLICY "Usuários podem criar jogadores"
    ON players
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Usuários podem atualizar seus jogadores"
    ON players
    FOR UPDATE
    USING (auth.uid() = created_by);

CREATE POLICY "Usuários podem deletar seus jogadores"
    ON players
    FOR DELETE
    USING (auth.uid() = created_by);

-- Mantenha a política de visualização sem alteração
DROP POLICY IF EXISTS "Todos podem ver jogadores" ON players;
CREATE POLICY "Todos podem ver jogadores"
    ON players
    FOR SELECT
    USING (true);
