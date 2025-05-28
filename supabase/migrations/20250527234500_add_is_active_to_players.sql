-- Adiciona a coluna is_active à tabela players
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Cria um índice para melhorar a performance das consultas por is_active
CREATE INDEX IF NOT EXISTS idx_players_is_active ON public.players (is_active);

-- Atualiza todos os registros existentes para terem is_active = true
-- Isso é importante para garantir que os jogadores existentes continuem visíveis
UPDATE public.players SET is_active = true WHERE is_active IS NULL;
