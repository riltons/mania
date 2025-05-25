-- Remover constraints e índices existentes
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_phone_number_key;

DROP INDEX IF EXISTS user_profiles_phone_number_unique_idx;

-- Criar um índice parcial que garante unicidade apenas para números não vazios
CREATE UNIQUE INDEX user_profiles_phone_number_unique_idx 
ON public.user_profiles (phone_number) 
WHERE phone_number IS NOT NULL AND phone_number != '';
