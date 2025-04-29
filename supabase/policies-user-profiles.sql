-- Remover políticas existentes da tabela user_profiles
DROP POLICY IF EXISTS "Usuários podem criar seu próprio perfil" ON user_profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON user_profiles;
DROP POLICY IF EXISTS "Todos podem ver perfis" ON user_profiles;
DROP POLICY IF EXISTS "Administradores podem gerenciar perfis" ON user_profiles;

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

CREATE POLICY "Administradores podem gerenciar perfis"
    ON user_profiles
    FOR ALL
    USING (EXISTS (
        SELECT 1
        FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    ));

-- Adicionar coluna para papel do usuário se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'user_profiles' AND column_name = 'role') THEN
        ALTER TABLE user_profiles ADD COLUMN role TEXT DEFAULT 'player';
    END IF;
END $$;

-- Garantir que RLS está habilitado
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
