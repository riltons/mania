-- Migração para corrigir a estrutura da tabela user_player_relations

-- 1. Adiciona a coluna is_primary se não existir
DO $$
BEGIN
    -- Verifica se a coluna is_primary já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_player_relations' 
        AND column_name = 'is_primary'
    ) THEN
        -- Adiciona a coluna is_primary
        ALTER TABLE public.user_player_relations 
        ADD COLUMN is_primary BOOLEAN DEFAULT false;
        
        -- Atualiza os registros existentes para definir como true para o usuário que criou o jogador
        UPDATE public.user_player_relations upr
        SET is_primary = true
        FROM public.players p
        WHERE upr.player_id = p.id AND upr.user_id = p.created_by;
        
        -- Torna a coluna NOT NULL após atualizar todos os registros
        ALTER TABLE public.user_player_relations 
        ALTER COLUMN is_primary SET NOT NULL;
    END IF;
    
    -- Verifica se a coluna is_primary_user existe e a remove se existir
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_player_relations' 
        AND column_name = 'is_primary_user'
    ) THEN
        -- Remove a coluna is_primary_user
        ALTER TABLE public.user_player_relations 
        DROP COLUMN is_primary_user;
    END IF;
END $$;

-- 2. Recria os índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_user_player_relations_player_id 
ON public.user_player_relations(player_id);

CREATE INDEX IF NOT EXISTS idx_user_player_relations_user_id 
ON public.user_player_relations(user_id);

-- 3. Atualiza as políticas de segurança
DROP POLICY IF EXISTS "Usuários podem ver suas próprias relações" ON public.user_player_relations;
DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias relações" ON public.user_player_relations;

-- Recria as políticas com a nova coluna
CREATE POLICY "Usuários podem ver suas próprias relações"
    ON public.user_player_relations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem gerenciar suas próprias relações"
    ON public.user_player_relations
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
