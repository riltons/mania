-- Migrate players from games table to game_players
insert into public.game_players (game_id, player_id, player_name, team)
select distinct
    g.id as game_id,
    p.id as player_id,
    p.name as player_name,
    1 as team
from public.games g, public.players p
where p.id = any(g.team1)
union all
select distinct
    g.id as game_id,
    p.id as player_id,
    p.name as player_name,
    2 as team
from public.games g, public.players p
where p.id = any(g.team2);
