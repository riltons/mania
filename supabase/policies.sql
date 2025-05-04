-- Remover políticas existentes
DROP POLICY IF EXISTS "Usuários podem ver todos os perfis" ON user_profiles;
DROP POLICY IF EXISTS "Usuários só podem editar seu próprio perfil" ON user_profiles;
DROP POLICY IF EXISTS "Todos podem ver jogadores" ON players;
DROP POLICY IF EXISTS "Usuários podem criar jogadores" ON players;
DROP POLICY IF EXISTS "Usuários podem atualizar seus jogadores" ON players;
DROP POLICY IF EXISTS "Usuários podem deletar seus jogadores" ON players;

-- Criar novas políticas para user_profiles
CREATE POLICY "Usuários podem criar seu próprio perfil"
    ON user_profiles 
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
    ON user_profiles 
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Todos podem ver perfis"
    ON user_profiles 
    FOR SELECT
    USING (true);

-- Criar políticas para players
DROP POLICY IF EXISTS "Todos podem ver jogadores" ON players;
DROP POLICY IF EXISTS "Usuários podem criar jogadores" ON players;
DROP POLICY IF EXISTS "Usuários podem atualizar seus jogadores" ON players;
DROP POLICY IF EXISTS "Usuários podem deletar seus jogadores" ON players;

CREATE POLICY "Todos podem ver jogadores"
    ON players
    FOR SELECT
    USING (true);

CREATE POLICY "Usuários podem criar jogadores"
    ON players
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus jogadores"
    ON players
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus jogadores"
    ON players
    FOR DELETE
    USING (auth.uid() = user_id);

-- Habilitar RLS nas tabelas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
