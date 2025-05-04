-- Remover políticas existentes
drop policy if exists "Membros da comunidade podem adicionar membros à competição" on competition_members;
drop policy if exists "Membros da comunidade podem remover membros da competição" on competition_members;
drop policy if exists "Membros da comunidade podem ler membros da competição" on competition_members;

-- Política para leitura (mais permissiva para debug)
create policy "Qualquer um pode ler membros da competição"
    on competition_members for select
    using (true);

-- Política para inserção (mais permissiva para debug)
create policy "Qualquer um pode adicionar membros à competição"
    on competition_members for insert
    with check (true);

-- Política para deleção (mais permissiva para debug)
create policy "Qualquer um pode remover membros da competição"
    on competition_members for delete
    using (true);
