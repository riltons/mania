-- Adicionar política para permitir que organizadores vejam as comunidades
CREATE POLICY "Organizadores podem ver comunidades"
    ON public.communities
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.community_organizers
            WHERE community_id = id
            AND user_id = auth.uid()
        )
    );
