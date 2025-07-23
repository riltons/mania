create table public.competitions (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    description text,
    community_id uuid references public.communities(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilita RLS (Row Level Security)
alter table public.competitions enable row level security;

-- Cria política para permitir leitura para todos os usuários autenticados
create policy "Usuários autenticados podem ler competições"
    on public.competitions for select
    to authenticated
    using (true);

-- Cria política para permitir inserção para usuários autenticados
create policy "Usuários autenticados podem criar competições"
    on public.competitions for insert
    to authenticated
    with check (true);

-- Cria política para permitir atualização para usuários autenticados
create policy "Usuários autenticados podem atualizar competições"
    on public.competitions for update
    to authenticated
    using (true);

-- Cria política para permitir deleção para usuários autenticados
create policy "Usuários autenticados podem deletar competições"
    on public.competitions for delete
    to authenticated
    using (true);

-- Função para atualizar o updated_at automaticamente
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$;

-- Trigger para atualizar o updated_at
create trigger handle_competitions_updated_at
    before update on public.competitions
    for each row
    execute function public.handle_updated_at();
