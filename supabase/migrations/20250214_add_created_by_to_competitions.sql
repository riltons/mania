-- Adiciona a coluna created_by à tabela competitions
ALTER TABLE competitions
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Atualiza a coluna created_by para registros existentes
DO $$
DECLARE
    v_competition RECORD;
    v_creator_id UUID;
BEGIN
    FOR v_competition IN
        SELECT c.id, c.name, c.community_id
        FROM competitions c
        WHERE c.created_by IS NULL
    LOOP
        -- Tenta encontrar um criador válido
        SELECT creator_id INTO v_creator_id
        FROM (
            -- Primeiro tenta pegar o created_by da comunidade
            SELECT c.created_by as creator_id
            FROM communities c
            WHERE c.id = v_competition.community_id
            AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = c.created_by)
            UNION
            -- Depois tenta pegar o primeiro membro da competição
            SELECT cm.player_id
            FROM competition_members cm
            WHERE cm.competition_id = v_competition.id
            AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = cm.player_id)
            UNION
            -- Por último tenta pegar o primeiro membro da comunidade
            SELECT cm.player_id
            FROM community_members cm
            WHERE cm.community_id = v_competition.community_id
            AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = cm.player_id)
            LIMIT 1
        ) potential_creators;

        IF v_creator_id IS NOT NULL THEN
            UPDATE competitions
            SET created_by = v_creator_id
            WHERE id = v_competition.id;
            RAISE NOTICE 'Competição atualizada - ID: %, Nome: %, Novo criador: %',
                v_competition.id, v_competition.name, v_creator_id;
        ELSE
            RAISE NOTICE 'Não foi possível encontrar um criador válido para a competição - ID: %, Nome: %, ID da Comunidade: %',
                v_competition.id, v_competition.name, v_competition.community_id;
        END IF;
    END LOOP;

    -- Verifica se ainda existem registros sem criador
    IF EXISTS (SELECT 1 FROM competitions WHERE created_by IS NULL) THEN
        RAISE EXCEPTION 'Ainda existem competições sem criador válido. Por favor, verifique as mensagens acima e atribua manualmente um criador para cada competição listada.';
    END IF;

    -- Torna a coluna created_by NOT NULL para futuros registros
    ALTER TABLE competitions
    ALTER COLUMN created_by SET NOT NULL;
END $$;

-- Verifica se ainda existem registros com created_by NULL e fornece informações detalhadas
DO $$
DECLARE
    v_competition RECORD;
BEGIN
    FOR v_competition IN
        SELECT c.id, c.name, c.community_id
        FROM competitions c
        WHERE c.created_by IS NULL
    LOOP
        RAISE NOTICE 'Competição sem criador - ID: %, Nome: %, Community ID: %',
            v_competition.id,
            v_competition.name,
            v_competition.community_id;
    END LOOP;

    IF EXISTS (SELECT 1 FROM competitions WHERE created_by IS NULL) THEN
        RAISE EXCEPTION 'Existem competições sem criador definido. Por favor, verifique as informações acima e atribua manualmente um criador para cada competição listada.';
    END IF;
END $$;

-- Verifica se ainda existem registros com created_by NULL e fornece informações detalhadas
DO $$
DECLARE
    v_competition RECORD;
BEGIN
    FOR v_competition IN
        SELECT c.id, c.name, c.community_id
        FROM competitions c
        WHERE c.created_by IS NULL
    LOOP
        RAISE NOTICE 'Competição sem criador - ID: %, Nome: %, Community ID: %',
            v_competition.id,
            v_competition.name,
            v_competition.community_id;
    END LOOP;

    IF EXISTS (SELECT 1 FROM competitions WHERE created_by IS NULL) THEN
        RAISE EXCEPTION 'Existem competições sem criador definido. Por favor, verifique as informações acima e atribua manualmente um criador para cada competição listada.';
    END IF;
END $$;

-- Verifica se ainda existem registros com created_by NULL e fornece informações detalhadas
DO $$
DECLARE
    v_competition RECORD;
BEGIN
    FOR v_competition IN
        SELECT c.id, c.name, c.community_id
        FROM competitions c
        WHERE c.created_by IS NULL
    LOOP
        RAISE NOTICE 'Competição sem criador - ID: %, Nome: %, Community ID: %',
            v_competition.id,
            v_competition.name,
            v_competition.community_id;
    END LOOP;

    IF EXISTS (SELECT 1 FROM competitions WHERE created_by IS NULL) THEN
        RAISE EXCEPTION 'Existem competições sem criador definido. Por favor, verifique as informações acima e atribua manualmente um criador para cada competição listada.';
    END IF;
END $$;

-- Torna a coluna created_by NOT NULL para futuros registros
ALTER TABLE competitions
ALTER COLUMN created_by SET NOT NULL;