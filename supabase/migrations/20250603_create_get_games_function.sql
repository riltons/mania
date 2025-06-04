-- Função para buscar jogos por competição, ignorando RLS
CREATE OR REPLACE FUNCTION get_games_by_competition(competition_id_param UUID)
RETURNS SETOF games
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM games
    WHERE competition_id = competition_id_param
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Conceder permissão para usuários autenticados executarem a função
GRANT EXECUTE ON FUNCTION get_games_by_competition(UUID) TO authenticated;
