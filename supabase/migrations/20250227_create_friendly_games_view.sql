-- Criar view para exibir informações amigáveis dos jogos
CREATE OR REPLACE VIEW public.friendly_games_view AS
SELECT 
    g.id,
    g.competition_id,
    comp.name as competition_name,
    comp.community_id,
    comm.name as community_name,
    g.team1_score,
    g.team2_score,
    g.status,
    g.is_buchuda,
    g.is_buchuda_de_re,
    g.created_at,
    g.updated_at,
    (
        SELECT json_agg(json_build_object(
            'id', gp.id,
            'player_id', gp.player_id,
            'player_name', gp.player_name,
            'team', gp.team
        ))
        FROM game_players gp
        WHERE gp.game_id = g.id AND gp.team = 1
    ) as team1_players,
    (
        SELECT json_agg(json_build_object(
            'id', gp.id,
            'player_id', gp.player_id,
            'player_name', gp.player_name,
            'team', gp.team
        ))
        FROM game_players gp
        WHERE gp.game_id = g.id AND gp.team = 2
    ) as team2_players,
    (
        SELECT json_build_object(
            'rounds_count', COALESCE(array_length(g.rounds, 1), 0),
            'last_round_was_tie', g.last_round_was_tie,
            'team1_was_losing_5_0', g.team1_was_losing_5_0,
            'team2_was_losing_5_0', g.team2_was_losing_5_0
        )
    ) as game_details
FROM 
    games g
    LEFT JOIN competitions comp ON comp.id = g.competition_id
    LEFT JOIN communities comm ON comm.id = comp.community_id;

-- As views herdam automaticamente as permissões das tabelas base
-- Não é possível criar políticas RLS diretamente em views no PostgreSQL
-- As views já estarão acessíveis para usuários autenticados que têm permissão para acessar as tabelas base