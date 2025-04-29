-- Habilita RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Política para SELECT
CREATE POLICY "Usuários podem ver jogos das competições que participam" ON games
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM competitions c
        JOIN competition_members cm ON c.id = cm.competition_id
        WHERE c.id = games.competition_id
        AND cm.player_id = auth.uid()
    )
);

-- Política para INSERT
CREATE POLICY "Usuários podem criar jogos em competições que participam" ON games
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM competitions c
        JOIN competition_members cm ON c.id = cm.competition_id
        WHERE c.id = competition_id
        AND cm.player_id = auth.uid()
    )
);

-- Política para UPDATE
CREATE POLICY "Usuários podem atualizar jogos das competições que participam" ON games
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM competitions c
        JOIN competition_members cm ON c.id = cm.competition_id
        WHERE c.id = games.competition_id
        AND cm.player_id = auth.uid()
    )
);
