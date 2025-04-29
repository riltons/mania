-- Criar tabela de membros da competição
create table public.competition_members (
    id uuid default gen_random_uuid() primary key,
    competition_id uuid references public.competitions(id) on delete cascade not null,
    player_id uuid references public.players(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(competition_id, player_id)
);

-- Habilitar RLS
alter table public.competition_members enable row level security;

-- Política para leitura
create policy "Membros da comunidade podem ler membros da competição"
    on competition_members for select
    using (
        exists (
            select 1 from community_members cm
            join competitions c on c.community_id = cm.community_id
            where c.id = competition_members.competition_id
            and cm.player_id = auth.uid()
        )
    );

-- Política para inserção
create policy "Membros da comunidade podem adicionar membros à competição"
    on competition_members for insert
    with check (
        exists (
            select 1 from community_members cm
            join competitions c on c.community_id = cm.community_id
            where c.id = competition_id
            and cm.player_id = auth.uid()
        )
    );

-- Política para deleção
create policy "Membros da comunidade podem remover membros da competição"
    on competition_members for delete
    using (
        exists (
            select 1 from community_members cm
            join competitions c on c.community_id = cm.community_id
            where c.id = competition_members.competition_id
            and cm.player_id = auth.uid()
        )
    );
