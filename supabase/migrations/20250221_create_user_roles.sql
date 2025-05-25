-- Criar tabela de papéis de usuário
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'player',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id)
);

-- Comentários da tabela
COMMENT ON TABLE public.user_roles IS 'Tabela que armazena os papéis dos usuários';
COMMENT ON COLUMN public.user_roles.id IS 'ID único do papel do usuário';
COMMENT ON COLUMN public.user_roles.user_id IS 'ID do usuário';
COMMENT ON COLUMN public.user_roles.role IS 'Papel do usuário (admin, player, etc)';

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
CREATE POLICY "Usuários podem ver seus próprios papéis"
    ON public.user_roles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Apenas administradores podem gerenciar papéis
CREATE POLICY "Administradores podem gerenciar papéis"
    ON public.user_roles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Criar função para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar o updated_at
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE
    ON public.user_roles
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Nota: A inserção do usuário admin deve ser feita após a criação do usuário no auth.users
-- Exemplo de como inserir um admin:
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('id-do-usuario-real', 'admin')
-- ON CONFLICT (user_id) DO NOTHING;