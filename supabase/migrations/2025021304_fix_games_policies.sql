-- Remove políticas existentes
DROP POLICY IF EXISTS "Usuários podem ver jogos das competições que participam" ON games;
DROP POLICY IF EXISTS "Usuários podem criar jogos em competições que participam" ON games;
DROP POLICY IF EXISTS "Usuários podem atualizar jogos das competições que participam" ON games;

-- Habilita RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Política para SELECT - Usuários podem ver jogos das competições que participam
CREATE POLICY "Usuários podem ver jogos das competições que participam" ON games
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM competition_members cm
        WHERE cm.competition_id = games.competition_id
        AND cm.player_id = auth.uid()
    )
);

-- Política para INSERT - Usuários podem criar jogos em competições que participam
CREATE POLICY "Usuários podem criar jogos em competições que participam" ON games
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM competition_members cm
        WHERE cm.competition_id = competition_id
        AND cm.player_id = auth.uid()
    )
);

-- Política para UPDATE - Usuários podem atualizar jogos das competições que participam
CREATE POLICY "Usuários podem atualizar jogos das competições que participam" ON games
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM competition_members cm
        WHERE cm.competition_id = games.competition_id
        AND cm.player_id = auth.uid()
    )
);

-- Política para DELETE - Usuários podem deletar jogos das competições que participam
CREATE POLICY "Usuários podem deletar jogos das competições que participam" ON games
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM competition_members cm
        WHERE cm.competition_id = games.competition_id
        AND cm.player_id = auth.uid()
    )
);
