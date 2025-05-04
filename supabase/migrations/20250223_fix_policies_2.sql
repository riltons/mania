-- Remover todas as políticas antigas
DROP POLICY IF EXISTS "Organizadores podem ver suas próprias atribuições" ON public.community_organizers;
DROP POLICY IF EXISTS "Administradores podem gerenciar organizadores" ON public.community_organizers;
DROP POLICY IF EXISTS "Organizadores podem ver comunidades" ON public.communities;
DROP POLICY IF EXISTS "Permitir leitura de community_organizers" ON public.community_organizers;
DROP POLICY IF EXISTS "Ver comunidades como criador ou organizador" ON public.communities;

-- Desabilitar RLS temporariamente para debug
ALTER TABLE public.communities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_organizers DISABLE ROW LEVEL SECURITY;

-- Criar política mais simples
CREATE POLICY "community_organizers_policy"
    ON public.community_organizers
    FOR ALL
    TO authenticated
    USING (true);
