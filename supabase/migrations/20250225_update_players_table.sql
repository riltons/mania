-- Remover constraint existente
ALTER TABLE public.players
DROP CONSTRAINT IF EXISTS players_created_by_fkey;

-- Atualizar a estrutura da tabela players
ALTER TABLE public.players
ALTER COLUMN created_by SET DEFAULT auth.uid(),
ALTER COLUMN created_by SET NOT NULL;

-- Adicionar nova foreign key
ALTER TABLE public.players
ADD CONSTRAINT players_created_by_fkey 
    FOREIGN KEY (created_by) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
