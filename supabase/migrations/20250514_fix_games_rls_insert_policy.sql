-- Corrigir políticas RLS para a tabela games

-- Remover a política atual de INSERT que está causando problemas
DROP POLICY IF EXISTS "Usuários autenticados podem criar jogos" ON games;

-- Criar uma nova política mais específica para INSERT
CREATE POLICY "Usuários podem criar jogos em competições que participam" ON games
FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated' AND
    (
        -- Verificar se o usuário é membro da competição
        EXISTS (
            SELECT 1
            FROM competition_members cm
            JOIN players p ON cm.player_id = p.id
            WHERE cm.competition_id = games.competition_id
            AND p.created_by = auth.uid()
        )
        OR
        -- OU se o usuário é o criador da comunidade à qual a competição pertence
        EXISTS (
            SELECT 1
            FROM competitions c
            JOIN communities comm ON comm.id = c.community_id
            WHERE c.id = games.competition_id
            AND comm.created_by = auth.uid()
        )
        OR
        -- OU se o usuário é um organizador da comunidade
        EXISTS (
            SELECT 1
            FROM competitions c
            JOIN community_organizers co ON co.community_id = c.community_id
            WHERE c.id = games.competition_id
            AND co.user_id = auth.uid()
        )
    )
);

-- Garantir que RLS está habilitado
ALTER TABLE games ENABLE ROW LEVEL SECURITY;