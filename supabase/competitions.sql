-- Remover tabela se existir
DROP TABLE IF EXISTS competitions CASCADE;

-- Criar tabela de competições
CREATE TABLE IF NOT EXISTS competitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    prize_pool DECIMAL(10,2),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'finished', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
CREATE POLICY "competitions_select_policy"
ON competitions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM communities c
        WHERE c.id = community_id
        AND c.created_by = auth.uid()
    )
);

CREATE POLICY "competitions_insert_policy"
ON competitions FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM communities c
        WHERE c.id = community_id
        AND c.created_by = auth.uid()
    )
);

CREATE POLICY "competitions_update_policy"
ON competitions FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM communities c
        WHERE c.id = community_id
        AND c.created_by = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM communities c
        WHERE c.id = community_id
        AND c.created_by = auth.uid()
    )
);

CREATE POLICY "competitions_delete_policy"
ON competitions FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM communities c
        WHERE c.id = community_id
        AND c.created_by = auth.uid()
    )
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS competitions_community_id_idx ON competitions(community_id);
CREATE INDEX IF NOT EXISTS competitions_status_idx ON competitions(status);
