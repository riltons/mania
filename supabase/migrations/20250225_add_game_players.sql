-- Create game_players table
create table if not exists public.game_players (
    id uuid default gen_random_uuid() primary key,
    game_id uuid not null references public.games(id) on delete cascade,
    player_id uuid not null references public.players(id) on delete restrict,
    player_name text not null,
    team integer not null check (team in (1, 2)),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(game_id, player_id)
);

-- Add RLS policies
alter table public.game_players enable row level security;

create policy "Game players are viewable by authenticated users"
    on public.game_players for select
    to authenticated
    using (true);

create policy "Game players can be inserted by game owners"
    on public.game_players for insert
    to authenticated
    with check (
        exists (
            select 1 from public.games g
            inner join public.competitions c on c.id = g.competition_id
            inner join public.community_organizers co on co.community_id = c.community_id
            where g.id = game_players.game_id
            and co.user_id = auth.uid()
        )
    );

create policy "Game players can be updated by game owners"
    on public.game_players for update
    to authenticated
    using (
        exists (
            select 1 from public.games g
            inner join public.competitions c on c.id = g.competition_id
            inner join public.community_organizers co on co.community_id = c.community_id
            where g.id = game_players.game_id
            and co.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.games g
            inner join public.competitions c on c.id = g.competition_id
            inner join public.community_organizers co on co.community_id = c.community_id
            where g.id = game_players.game_id
            and co.user_id = auth.uid()
        )
    );

create policy "Game players can be deleted by game owners"
    on public.game_players for delete
    to authenticated
    using (
        exists (
            select 1 from public.games g
            inner join public.competitions c on c.id = g.competition_id
            inner join public.community_organizers co on co.community_id = c.community_id
            where g.id = game_players.game_id
            and co.user_id = auth.uid()
        )
    );

-- Create function to update updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$;

-- Create trigger for updated_at
create trigger handle_game_players_updated_at
    before update on public.game_players
    for each row
    execute function public.handle_updated_at();
