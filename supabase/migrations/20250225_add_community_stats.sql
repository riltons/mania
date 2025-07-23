-- Remover funções existentes
drop function if exists public.get_community_player_stats(uuid);
drop function if exists public.get_community_pair_stats(uuid);

-- Função para calcular estatísticas individuais dos jogadores na comunidade
create or replace function public.get_community_player_stats(community_id uuid)
returns table (
    id uuid,
    name text,
    score bigint,
    wins bigint,
    losses bigint,
    buchudas_given bigint,
    buchudas_taken bigint,
    buchudas_de_re_given bigint,
    buchudas_de_re_taken bigint
)
language sql
security definer
as $$
    select 
        p.id,
        p.name,
        coalesce(sum(case 
            when g.team1 @> array[p.id] then g.team1_score
            when g.team2 @> array[p.id] then g.team2_score
            else 0
        end), 0) as score,
        coalesce(count(*) filter (where 
            (g.team1 @> array[p.id] and g.team1_score > g.team2_score) or
            (g.team2 @> array[p.id] and g.team2_score > g.team1_score)
        ), 0) as wins,
        coalesce(count(*) filter (where 
            (g.team1 @> array[p.id] and g.team1_score < g.team2_score) or
            (g.team2 @> array[p.id] and g.team2_score < g.team1_score)
        ), 0) as losses,
        coalesce(count(*) filter (where 
            (g.team1 @> array[p.id] and g.is_buchuda and g.team1_score > g.team2_score) or
            (g.team2 @> array[p.id] and g.is_buchuda and g.team2_score > g.team1_score)
        ), 0) as buchudas_given,
        coalesce(count(*) filter (where 
            (g.team1 @> array[p.id] and g.is_buchuda and g.team1_score < g.team2_score) or
            (g.team2 @> array[p.id] and g.is_buchuda and g.team2_score < g.team1_score)
        ), 0) as buchudas_taken,
        coalesce(count(*) filter (where 
            (g.team1 @> array[p.id] and g.is_buchuda_de_re and g.team1_score > g.team2_score) or
            (g.team2 @> array[p.id] and g.is_buchuda_de_re and g.team2_score > g.team1_score)
        ), 0) as buchudas_de_re_given,
        coalesce(count(*) filter (where 
            (g.team1 @> array[p.id] and g.is_buchuda_de_re and g.team1_score < g.team2_score) or
            (g.team2 @> array[p.id] and g.is_buchuda_de_re and g.team2_score < g.team1_score)
        ), 0) as buchudas_de_re_taken
    from players p
    join community_members cm on cm.player_id = p.id
    left join competitions c on c.community_id = cm.community_id
    left join games g on g.competition_id = c.id and g.status = 'finished'
    where cm.community_id = get_community_player_stats.community_id
    group by p.id, p.name
    order by 
        wins desc,
        losses asc,
        score desc,
        buchudas_given desc,
        buchudas_de_re_given desc,
        buchudas_taken asc,
        buchudas_de_re_taken asc;
$$;

-- Função para calcular estatísticas das duplas na comunidade
create or replace function public.get_community_pair_stats(community_id uuid)
returns table (
    players jsonb,
    score bigint,
    wins bigint,
    losses bigint,
    buchudas_given bigint,
    buchudas_taken bigint,
    buchudas_de_re_given bigint,
    buchudas_de_re_taken bigint
)
language sql
security definer
as $$
    with pair_games as (
        select 
            g.id,
            g.team1_score,
            g.team2_score,
            g.is_buchuda,
            g.is_buchuda_de_re,
            jsonb_build_array(
                jsonb_build_object(
                    'id', p1.id,
                    'name', p1.name
                ),
                jsonb_build_object(
                    'id', p2.id,
                    'name', p2.name
                )
            ) as player_pair,
            case 
                when array[p1.id, p2.id] <@ g.team1 then 1
                when array[p1.id, p2.id] <@ g.team2 then 2
                else null
            end as team_number,
            case 
                when array[p1.id, p2.id] <@ g.team1 and g.team1_score > g.team2_score then true
                when array[p1.id, p2.id] <@ g.team2 and g.team2_score > g.team1_score then true
                else false
            end as won_game
        from games g
        join competitions c on c.id = g.competition_id
        cross join (
            select distinct p1.id as id1, p2.id as id2
            from players p1
            join community_members cm1 on cm1.player_id = p1.id
            join players p2 on p2.id > p1.id
            join community_members cm2 on cm2.player_id = p2.id
            where cm1.community_id = get_community_pair_stats.community_id
            and cm2.community_id = get_community_pair_stats.community_id
        ) pairs
        join players p1 on p1.id = pairs.id1
        join players p2 on p2.id = pairs.id2
        where c.community_id = get_community_pair_stats.community_id
        and g.status = 'finished'
        and (
            array[p1.id, p2.id] <@ g.team1 or
            array[p1.id, p2.id] <@ g.team2
        )
    )
    select 
        pg.player_pair as players,
        coalesce(sum(case 
            when pg.team_number = 1 then pg.team1_score
            when pg.team_number = 2 then pg.team2_score
            else 0
        end), 0) as score,
        coalesce(count(*) filter (where 
            (pg.team_number = 1 and pg.team1_score > pg.team2_score) or
            (pg.team_number = 2 and pg.team2_score > pg.team1_score)
        ), 0) as wins,
        coalesce(count(*) filter (where 
            (pg.team_number = 1 and pg.team1_score < pg.team2_score) or
            (pg.team_number = 2 and pg.team2_score < pg.team1_score)
        ), 0) as losses,
        coalesce(count(*) filter (where 
            pg.is_buchuda and pg.won_game
        ), 0) as buchudas_given,
        coalesce(count(*) filter (where 
            pg.is_buchuda and not pg.won_game
        ), 0) as buchudas_taken,
        coalesce(count(*) filter (where 
            pg.is_buchuda_de_re and pg.won_game
        ), 0) as buchudas_de_re_given,
        coalesce(count(*) filter (where 
            pg.is_buchuda_de_re and not pg.won_game
        ), 0) as buchudas_de_re_taken
    from pair_games pg
    group by pg.player_pair
    order by 
        wins desc,
        losses asc,
        score desc,
        buchudas_given desc,
        buchudas_de_re_given desc,
        buchudas_taken asc,
        buchudas_de_re_taken asc;
$$;
