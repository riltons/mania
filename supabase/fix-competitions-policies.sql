-- Remove as políticas existentes
drop policy if exists "Usuários autenticados podem criar competições" on competitions;
drop policy if exists "Usuários autenticados podem ler competições" on competitions;
drop policy if exists "Usuários autenticados podem atualizar competições" on competitions;
drop policy if exists "Usuários autenticados podem deletar competições" on competitions;

-- Cria política para permitir leitura para membros da comunidade
create policy "Membros podem ler competições"
    on competitions for select
    using (
        exists (
            select 1 from community_members
            where community_members.community_id = competitions.community_id
            and community_members.player_id = auth.uid()
        )
    );

-- Cria política para permitir inserção para membros da comunidade
create policy "Membros podem criar competições"
    on competitions for insert
    with check (
        exists (
            select 1 from community_members
            where community_members.community_id = community_id
            and community_members.player_id = auth.uid()
        )
    );

-- Cria política para permitir atualização para membros da comunidade
create policy "Membros podem atualizar competições"
    on competitions for update
    using (
        exists (
            select 1 from community_members
            where community_members.community_id = competitions.community_id
            and community_members.player_id = auth.uid()
        )
    );

-- Cria política para permitir deleção para membros da comunidade
create policy "Membros podem deletar competições"
    on competitions for delete
    using (
        exists (
            select 1 from community_members
            where community_members.community_id = competitions.community_id
            and community_members.player_id = auth.uid()
        )
    );
