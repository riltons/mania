-- Remove as políticas existentes
drop policy if exists "Membros podem criar competições" on competitions;
drop policy if exists "Membros podem ler competições" on competitions;
drop policy if exists "Membros podem atualizar competições" on competitions;
drop policy if exists "Membros podem deletar competições" on competitions;

-- Política simples para teste
create policy "Permitir todas operações para usuários autenticados"
    on competitions for all
    to authenticated
    using (true)
    with check (true);
