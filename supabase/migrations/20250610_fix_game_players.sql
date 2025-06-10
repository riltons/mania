-- Migração para corrigir a tabela game_players
-- Data: 2025-06-10

-- Primeiro, limpamos a tabela existente para evitar duplicatas
TRUNCATE TABLE public.game_players;

-- Inserir jogadores do time 1
INSERT INTO public.game_players (game_id, player_id, player_name, team, created_at, updated_at)
SELECT 
    g.id as game_id,
    unnest(g.team1) as player_id,
    COALESCE(p.name, 'Jogador ' || unnest(g.team1)::text) as player_name,
    1 as team,
    g.created_at,
    g.updated_at
FROM 
    public.games g
LEFT JOIN 
    public.players p ON p.id = ANY(g.team1)
WHERE 
    g.team1 IS NOT NULL
    AND array_length(g.team1, 1) > 0
ON CONFLICT (game_id, player_id) DO NOTHING;

-- Inserir jogadores do time 2
INSERT INTO public.game_players (game_id, player_id, player_name, team, created_at, updated_at)
SELECT 
    g.id as game_id,
    unnest(g.team2) as player_id,
    COALESCE(p.name, 'Jogador ' || unnest(g.team2)::text) as player_name,
    2 as team,
    g.created_at,
    g.updated_at
FROM 
    public.games g
LEFT JOIN 
    public.players p ON p.id = ANY(g.team2)
WHERE 
    g.team2 IS NOT NULL
    AND array_length(g.team2, 1) > 0
ON CONFLICT (game_id, player_id) DO NOTHING;

-- Atualizar as estatísticas da tabela
ANALYZE public.game_players;

-- Log para verificação
SELECT 
    COUNT(*) as total_associacoes,
    COUNT(DISTINCT game_id) as jogos_com_jogadores,
    COUNT(DISTINCT player_id) as jogadores_unicos,
    team,
    COUNT(*) as total_por_time
FROM 
    public.game_players
group by 
    team
order by 
    team;
