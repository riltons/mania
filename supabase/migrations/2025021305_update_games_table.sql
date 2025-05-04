-- Adiciona novas colunas na tabela games
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS rounds jsonb[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_round_was_tie boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_buchuda boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_buchuda_de_re boolean DEFAULT false;
