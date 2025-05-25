-- Primeiro, vamos verificar e garantir que o RLS está habilitado
alter table community_members enable row level security;

-- Remover TODAS as políticas existentes para começar do zero
drop policy if exists "community_members_select_policy" on community_members;
drop policy if exists "community_members_insert_policy" on community_members;
drop policy if exists "community_members_delete_policy" on community_members;
drop policy if exists "Permitir select para membros e organizadores" on community_members;
drop policy if exists "Permitir insert para organizadores" on community_members;
drop policy if exists "Permitir delete para organizadores" on community_members;
drop policy if exists "Permitir insert para organizadores e donos" on community_members;
drop policy if exists "Permitir delete para organizadores e donos" on community_members;

-- Remover TODAS as políticas da tabela community_organizers
drop policy if exists "community_organizers_select_policy" on community_organizers;
drop policy if exists "community_organizers_insert_policy" on community_organizers;
drop policy if exists "community_organizers_delete_policy" on community_organizers;

-- Política básica para permitir SELECT
create policy "community_members_select_policy"
on community_members for select
to authenticated
using (true);  -- Permitir select para todos os usuários autenticados

-- Política para INSERT
create policy "community_members_insert_policy"
on community_members for insert
to authenticated
with check (
    -- O usuário é um organizador da comunidade
    exists (
        select 1 from community_organizers
        where community_id = community_members.community_id
        and user_id = auth.uid()
    )
);

-- Política para DELETE
create policy "community_members_delete_policy"
on community_members for delete
to authenticated
using (
    -- O usuário é um organizador da comunidade
    exists (
        select 1 from community_organizers
        where community_id = community_members.community_id
        and user_id = auth.uid()
    )
);

-- Garantir que a tabela community_organizers também tem RLS habilitado
alter table community_organizers enable row level security;

-- Política básica para permitir SELECT em community_organizers
create policy "community_organizers_select_policy"
on community_organizers for select
to authenticated
using (true);  -- Permitir select para todos os usuários autenticados

-- Verificar se o usuário atual é organizador
create or replace function is_community_organizer(community_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 
    from community_organizers
    where community_id = $1
    and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;
