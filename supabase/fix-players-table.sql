-- Remover a constraint unique do user_id
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_user_id_key;

-- Recriar a tabela com a estrutura correta caso necessário
CREATE TABLE IF NOT EXISTS players (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    nickname TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
