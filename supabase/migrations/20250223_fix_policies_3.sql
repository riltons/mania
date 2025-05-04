-- Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Organizadores podem ver suas próprias atribuições" ON public.community_organizers;
DROP POLICY IF EXISTS "Administradores podem gerenciar organizadores" ON public.community_organizers;
DROP POLICY IF EXISTS "Organizadores podem ver comunidades" ON public.communities;
DROP POLICY IF EXISTS "Permitir leitura de community_organizers" ON public.community_organizers;
DROP POLICY IF EXISTS "Ver comunidades como criador ou organizador" ON public.communities;
DROP POLICY IF EXISTS "community_organizers_policy" ON public.community_organizers;

-- Desabilitar RLS em todas as tabelas relevantes
ALTER TABLE public.communities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_organizers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.games DISABLE ROW LEVEL SECURITY;

-- Criar uma única política simples para communities
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "communities_select_policy"
    ON public.communities
    FOR SELECT
    TO authenticated
    USING (true);
