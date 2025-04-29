-- Drop políticas existentes
DROP POLICY IF EXISTS "Usuários podem ver seus próprios papéis" ON public.user_roles;
DROP POLICY IF EXISTS "Administradores podem gerenciar papéis" ON public.user_roles;

-- Criar novas políticas de segurança
CREATE POLICY "Permitir leitura para todos os usuários autenticados"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Usuários podem atualizar seus próprios papéis"
    ON public.user_roles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios papéis"
    ON public.user_roles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios papéis"
    ON public.user_roles
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
