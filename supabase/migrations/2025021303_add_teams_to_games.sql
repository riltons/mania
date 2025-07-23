-- Adiciona colunas de times na tabela games
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS team1 uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS team2 uuid[] DEFAULT '{}';
