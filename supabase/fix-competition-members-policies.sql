-- Remover políticas existentes
drop policy if exists "Membros da comunidade podem adicionar membros à competição" on competition_members;
drop policy if exists "Membros da comunidade podem remover membros da competição" on competition_members;
drop policy if exists "Membros da comunidade podem ler membros da competição" on competition_members;

-- Política para leitura
create policy "Membros da comunidade podem ler membros da competição"
    on competition_members for select
    using (
        exists (
            select 1 
            from community_members cm
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
            select 1 
            from community_members cm
            join competitions c on c.community_id = cm.community_id
            where c.id = competition_members.competition_id
            and cm.player_id = auth.uid()
        )
        and
        exists (
            select 1 
            from community_members cm2
            join competitions c2 on c2.community_id = cm2.community_id
            where c2.id = competition_members.competition_id
            and cm2.player_id = competition_members.player_id
        )
    );

-- Política para deleção
create policy "Membros da comunidade podem remover membros da competição"
    on competition_members for delete
    using (
        exists (
            select 1 
            from community_members cm
            join competitions c on c.community_id = cm.community_id
            where c.id = competition_members.competition_id
            and cm.player_id = auth.uid()
        )
    );
