-- Remove políticas existentes
DROP POLICY IF EXISTS "Usuários autenticados podem ler competições" ON competitions;
DROP POLICY IF EXISTS "Usuários autenticados podem criar competições" ON competitions;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar competições" ON competitions;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar competições" ON competitions;

-- Habilita RLS
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

-- Política para SELECT - Usuários podem ver suas próprias competições
CREATE POLICY "Usuários podem ver suas competições" ON competitions
FOR SELECT USING (auth.uid() = created_by);

-- Política para INSERT - Usuários podem criar competições
CREATE POLICY "Usuários podem criar competições" ON competitions
FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Política para UPDATE - Usuários podem atualizar suas competições
CREATE POLICY "Usuários podem atualizar suas competições" ON competitions
FOR UPDATE USING (auth.uid() = created_by);

-- Política para DELETE - Usuários podem deletar suas competições
CREATE POLICY "Usuários podem deletar suas competições" ON competitions
FOR DELETE USING (auth.uid() = created_by);