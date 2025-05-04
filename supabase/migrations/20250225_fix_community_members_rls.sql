-- Habilitar RLS
alter table community_members enable row level security;

-- Remover políticas existentes
drop policy if exists "Permitir select para membros e organizadores" on community_members;
drop policy if exists "Permitir insert para organizadores" on community_members;
drop policy if exists "Permitir delete para organizadores" on community_members;

-- Criar novas políticas
create policy "Permitir select para membros e organizadores"
on community_members for select
using (
    exists (
        -- Usuário é organizador da comunidade
        select 1 from community_organizers 
        where community_id = community_members.community_id
        and user_id = auth.uid()
    ) or
    exists (
        -- Usuário é dono de algum jogador da comunidade
        select 1 from players p 
        where p.created_by = auth.uid()
        and p.id = community_members.player_id
    )
);

create policy "Permitir insert para organizadores e donos"
on community_members for insert
with check (
    exists (
        -- Usuário é organizador da comunidade
        select 1 from community_organizers 
        where community_id = community_members.community_id
        and user_id = auth.uid()
    ) or
    exists (
        -- Usuário é dono do jogador sendo adicionado
        select 1 from players p 
        where p.created_by = auth.uid()
        and p.id = community_members.player_id
    )
);

create policy "Permitir delete para organizadores e donos"
on community_members for delete
using (
    exists (
        -- Usuário é organizador da comunidade
        select 1 from community_organizers 
        where community_id = community_members.community_id
        and user_id = auth.uid()
    ) or
    exists (
        -- Usuário é dono do jogador sendo removido
        select 1 from players p 
        where p.created_by = auth.uid()
        and p.id = community_members.player_id
    )
);
