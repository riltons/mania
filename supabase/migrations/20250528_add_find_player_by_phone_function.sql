-- Migração para adicionar a função RPC find_player_by_phone
-- e melhorar a busca de jogadores por telefone

-- 1. Criar a função RPC find_player_by_phone
CREATE OR REPLACE FUNCTION public.find_player_by_phone(search_phone TEXT)
RETURNS SETOF public.players AS $$
DECLARE
    normalized_phone TEXT;
BEGIN
    -- Normaliza o telefone de busca (remove caracteres não numéricos)
    normalized_phone := regexp_replace(search_phone, '[^0-9]', '', 'g');
    
    -- Busca exata pelo telefone normalizado
    RETURN QUERY 
    SELECT * FROM public.players 
    WHERE phone = normalized_phone;
    
    -- Se não encontrou, tenta buscar pelo sufixo (últimos 9 dígitos)
    IF NOT FOUND AND length(normalized_phone) >= 9 THEN
        RETURN QUERY 
        SELECT * FROM public.players 
        WHERE phone LIKE '%' || right(normalized_phone, 9)
        LIMIT 5;
    END IF;
    
    -- Se ainda não encontrou e o telefone tem mais de 8 dígitos, 
    -- tenta buscar pelos últimos 8 dígitos
    IF NOT FOUND AND length(normalized_phone) >= 8 THEN
        RETURN QUERY 
        SELECT * FROM public.players 
        WHERE phone LIKE '%' || right(normalized_phone, 8)
        LIMIT 5;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Comentário para documentar a função
COMMENT ON FUNCTION public.find_player_by_phone IS 'Busca jogadores pelo número de telefone, usando várias estratégias de correspondência.';
