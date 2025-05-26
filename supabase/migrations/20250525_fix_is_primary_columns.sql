-- Migração para corrigir a inconsistência entre as colunas is_primary e is_primary_user

-- 1. Verifica se a coluna is_primary_user existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_player_relations' 
        AND column_name = 'is_primary_user'
    ) THEN
        -- 2. Se existir, copia os valores para is_primary
        RAISE NOTICE 'Copiando valores de is_primary_user para is_primary...';
        UPDATE public.user_player_relations
        SET is_primary = is_primary_user
        WHERE is_primary = FALSE;
        
        -- 3. Remove a coluna is_primary_user
        RAISE NOTICE 'Removendo a coluna is_primary_user...';
        ALTER TABLE public.user_player_relations
        DROP COLUMN is_primary_user;
    ELSE
        RAISE NOTICE 'A coluna is_primary_user não existe, nada a fazer.';
    END IF;
END $$;
