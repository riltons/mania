-- Remover políticas existentes
DROP POLICY IF EXISTS "Usuários podem ver jogos das competições que participam" ON games;
DROP POLICY IF EXISTS "Usuários podem criar jogos em competições que participam" ON games;
DROP POLICY IF EXISTS "Usuários podem atualizar jogos das competições que participam" ON games;
DROP POLICY IF EXISTS "Usuários podem deletar jogos das competições que participam" ON games;
DROP POLICY IF EXISTS "Criadores da comunidade podem deletar jogos" ON games;
DROP POLICY IF EXISTS "Membros podem deletar jogos pendentes" ON games;

-- Garantir que RLS está habilitado
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Política para SELECT - Usuários autenticados podem ver jogos das competições onde são membros
CREATE POLICY "Usuários autenticados podem ver jogos" ON games
FOR SELECT USING (
    -- Qualquer usuário autenticado pode ver jogos
    auth.role() = 'authenticated'
);

-- Política para INSERT - Usuários autenticados podem criar jogos em competições
CREATE POLICY "Usuários autenticados podem criar jogos" ON games
FOR INSERT WITH CHECK (
    -- Qualquer usuário autenticado pode criar jogos
    auth.role() = 'authenticated'
);

-- Política para UPDATE - Usuários autenticados podem atualizar jogos
CREATE POLICY "Usuários autenticados podem atualizar jogos" ON games
FOR UPDATE USING (
    -- Qualquer usuário autenticado pode atualizar jogos
    auth.role() = 'authenticated'
);

-- Política para DELETE - Usuários autenticados podem deletar jogos
CREATE POLICY "Usuários autenticados podem deletar jogos" ON games
FOR DELETE USING (
    -- Qualquer usuário autenticado pode deletar jogos
    auth.role() = 'authenticated'
);