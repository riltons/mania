-- Criar tabela de organizadores da comunidade
CREATE TABLE IF NOT EXISTS public.community_organizers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(community_id, user_id)
);

-- Comentários da tabela
COMMENT ON TABLE public.community_organizers IS 'Tabela que armazena os organizadores das comunidades';
COMMENT ON COLUMN public.community_organizers.id IS 'ID único do organizador da comunidade';
COMMENT ON COLUMN public.community_organizers.community_id IS 'ID da comunidade';
COMMENT ON COLUMN public.community_organizers.user_id IS 'ID do usuário organizador';
COMMENT ON COLUMN public.community_organizers.created_by IS 'ID do administrador que nomeou o organizador';

-- Habilitar RLS
ALTER TABLE public.community_organizers ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
CREATE POLICY "Organizadores podem ver suas próprias atribuições"
    ON public.community_organizers
    FOR SELECT
    USING (auth.uid() = user_id);

-- Apenas administradores da comunidade podem gerenciar organizadores
CREATE POLICY "Administradores podem gerenciar organizadores"
    ON public.community_organizers
    FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.communities
            WHERE id = community_id
            AND created_by = auth.uid()
        )
    );

-- Criar função para atualizar o updated_at
CREATE TRIGGER update_community_organizers_updated_at
    BEFORE UPDATE
    ON public.community_organizers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();