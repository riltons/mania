-- Correção do trigger para criação automática de perfil de usuário após registro

-- Primeiro, vamos verificar se o trigger já existe e removê-lo se necessário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Agora vamos criar a função que será chamada pelo trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir um novo registro na tabela user_profiles
  INSERT INTO public.user_profiles (user_id, full_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), 
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Registrar o erro para debug
    RAISE LOG 'Erro ao criar perfil de usuário: %', SQLERRM;
    -- Retornar o novo usuário mesmo se houver erro para não bloquear a criação do usuário
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o trigger para executar a função quando um novo usuário for criado
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Garantir que a tabela user_profiles exista
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configurar RLS para a tabela user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam seus próprios perfis
CREATE POLICY IF NOT EXISTS "Usuários podem ver seus próprios perfis"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Política para permitir que usuários atualizem seus próprios perfis
CREATE POLICY IF NOT EXISTS "Usuários podem atualizar seus próprios perfis"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Política para permitir que o serviço de backend acesse todos os perfis
CREATE POLICY IF NOT EXISTS "Service role pode acessar todos os perfis"
ON public.user_profiles
FOR ALL
USING (auth.role() = 'service_role');

-- Conceder permissões à role authenticated
GRANT SELECT, UPDATE ON public.user_profiles TO authenticated;
