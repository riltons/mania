-- Adiciona campos para controlar quando um time estava perdendo de 5x0
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS team1_was_losing_5_0 boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS team2_was_losing_5_0 boolean DEFAULT false;
