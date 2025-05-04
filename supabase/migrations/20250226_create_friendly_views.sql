-- Criar view para exibir informações amigáveis dos jogadores
CREATE OR REPLACE VIEW public.friendly_players_view AS
SELECT 
    p.id,
    p.name,
    p.phone,
    p.nickname,
    p.created_at,
    p.created_by,
    up.full_name as created_by_name,
    COALESCE((
        SELECT json_build_object(
            'user_id', upr.user_id,
            'name', up2.full_name,
            'email', au.email
        )
        FROM user_player_relations upr
        LEFT JOIN user_profiles up2 ON up2.user_id = upr.user_id
        LEFT JOIN auth.users au ON au.id = upr.user_id
        WHERE upr.player_id = p.id
        AND upr.is_primary_user = true
        LIMIT 1
    ), NULL) as primary_user_info,
    (
        SELECT json_build_object(
            'total_games', COUNT(DISTINCT gp.game_id),
            'wins', COUNT(DISTINCT CASE 
                WHEN (gp.team = 1 AND g.team1_score > g.team2_score) OR 
                     (gp.team = 2 AND g.team2_score > g.team1_score) 
                THEN g.id END),
            'losses', COUNT(DISTINCT CASE 
                WHEN (gp.team = 1 AND g.team1_score < g.team2_score) OR 
                     (gp.team = 2 AND g.team2_score < g.team1_score) 
                THEN g.id END)
        )
        FROM game_players gp
        LEFT JOIN games g ON g.id = gp.game_id
        WHERE gp.player_id = p.id
    ) as stats
FROM 
    players p
    LEFT JOIN user_profiles up ON up.user_id = p.created_by;

-- Criar view para exibir informações amigáveis das comunidades
CREATE OR REPLACE VIEW public.friendly_communities_view AS
SELECT 
    c.id,
    c.name,
    c.description,
    c.created_at,
    c.created_by,
    up.full_name as created_by_name,
    (
        SELECT COUNT(*)
        FROM community_members cm
        WHERE cm.community_id = c.id
    ) as members_count,
    (
        SELECT COUNT(*)
        FROM games g
        JOIN competitions comp ON comp.id = g.competition_id
        WHERE comp.community_id = c.id
    ) as games_count,
    (
        SELECT json_agg(json_build_object(
            'user_id', co.user_id,
            'name', up2.full_name
        ))
        FROM community_organizers co
        LEFT JOIN user_profiles up2 ON up2.user_id = co.user_id
        WHERE co.community_id = c.id
    ) as organizers
FROM 
    communities c
    LEFT JOIN user_profiles up ON up.user_id = c.created_by;

-- Remover a alteração de proprietário que está causando o erro
-- ALTER VIEW public.friendly_players_view OWNER TO authenticated;
-- ALTER VIEW public.friendly_communities_view OWNER TO authenticated;

-- As views herdam automaticamente as permissões das tabelas base
-- Não é possível criar políticas RLS diretamente em views no PostgreSQL
-- As views já estarão acessíveis para usuários autenticados que têm permissão para acessar as tabelas base