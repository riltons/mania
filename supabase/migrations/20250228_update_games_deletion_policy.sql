-- Drop existing delete policy
DROP POLICY IF EXISTS "Usuários autenticados podem deletar jogos" ON games;

-- Create new delete policy that allows community creators to delete games
CREATE POLICY "Criadores da comunidade podem deletar jogos" ON games
FOR DELETE USING (
    EXISTS (
        SELECT 1 
        FROM competitions c
        JOIN communities comm ON comm.id = c.community_id
        WHERE c.id = games.competition_id
        AND comm.created_by = auth.uid()
    )
);

-- Create policy for competition members to delete games in pending status
CREATE POLICY "Membros podem deletar jogos pendentes" ON games
FOR DELETE USING (
    status = 'pending'
    AND EXISTS (
        SELECT 1 
        FROM competitions c
        JOIN competition_members cm ON c.id = cm.competition_id
        WHERE c.id = games.competition_id
        AND cm.player_id = auth.uid()
    )
);