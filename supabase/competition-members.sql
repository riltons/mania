-- Remover tabela se existir
DROP TABLE IF EXISTS competition_members CASCADE;

-- Criar tabela de membros da competição
CREATE TABLE IF NOT EXISTS competition_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(competition_id, player_id)
);

-- Habilitar RLS
ALTER TABLE competition_members ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
CREATE POLICY "competition_members_select_policy"
ON competition_members FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM players p
        WHERE p.id = player_id
        AND p.created_by = auth.uid()
    )
);

CREATE POLICY "competition_members_insert_policy"
ON competition_members FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM players p
        WHERE p.id = player_id
        AND p.created_by = auth.uid()
    )
);

CREATE POLICY "competition_members_update_policy"
ON competition_members FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM players p
        WHERE p.id = player_id
        AND p.created_by = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM players p
        WHERE p.id = player_id
        AND p.created_by = auth.uid()
    )
);

CREATE POLICY "competition_members_delete_policy"
ON competition_members FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM players p
        WHERE p.id = player_id
        AND p.created_by = auth.uid()
    )
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS competition_members_competition_id_idx ON competition_members(competition_id);
CREATE INDEX IF NOT EXISTS competition_members_player_id_idx ON competition_members(player_id);
