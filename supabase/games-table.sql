-- Remover tabela se existir
DROP TABLE IF EXISTS games CASCADE;

-- Criar tabela de jogos
CREATE TABLE IF NOT EXISTS games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE NOT NULL,
    team1 UUID[] DEFAULT '{}',
    team2 UUID[] DEFAULT '{}',
    team1_score INTEGER DEFAULT 0,
    team2_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'finished')),
    rounds JSONB[] DEFAULT '{}',
    last_round_was_tie BOOLEAN DEFAULT false,
    team1_was_losing_5_0 BOOLEAN DEFAULT false,
    team2_was_losing_5_0 BOOLEAN DEFAULT false,
    is_buchuda BOOLEAN DEFAULT false,
    is_buchuda_de_re BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
CREATE POLICY "Usuários autenticados podem ver jogos"
    ON games FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem criar jogos"
    ON games FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar jogos"
    ON games FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar jogos"
    ON games FOR DELETE
    USING (auth.role() = 'authenticated');

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS games_competition_id_idx ON games(competition_id);
CREATE INDEX IF NOT EXISTS games_status_idx ON games(status);