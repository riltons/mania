-- Remover políticas existentes da tabela players
DROP POLICY IF EXISTS "Todos podem ver jogadores" ON players;
DROP POLICY IF EXISTS "Usuários podem criar jogadores" ON players;
DROP POLICY IF EXISTS "Usuários podem atualizar seus jogadores" ON players;
DROP POLICY IF EXISTS "Usuários podem deletar seus jogadores" ON players;

-- Criar novas políticas para players
CREATE POLICY "Usuários podem ver seus jogadores"
    ON players
    FOR SELECT
    USING (auth.uid() = created_by);

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

-- Garantir que RLS está habilitado
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
