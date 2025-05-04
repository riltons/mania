-- Dropar a tabela existente
DROP TABLE IF EXISTS public.user_profiles;

-- Criar a tabela user_profiles
CREATE TABLE public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    nickname TEXT,
    phone_number TEXT,
    UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Usuários podem ver seus próprios perfis"
    ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis"
    ON public.user_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios perfis"
    ON public.user_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Criar índice parcial para phone_number
CREATE UNIQUE INDEX user_profiles_phone_number_unique_idx 
ON public.user_profiles (phone_number) 
WHERE phone_number IS NOT NULL AND phone_number != '';
