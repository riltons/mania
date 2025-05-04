-- Adicionar organizadores para comunidades existentes onde não existe organizador
insert into community_organizers (community_id, user_id, created_by)
select 
    c.id as community_id,
    c.created_by as user_id,
    c.created_by as created_by
from communities c
where not exists (
    select 1 
    from community_organizers co 
    where co.community_id = c.id 
    and co.user_id = c.created_by
);

-- Criar trigger para adicionar criador como organizador automaticamente
create or replace function add_creator_as_organizer()
returns trigger as $$
begin
    insert into community_organizers (community_id, user_id, created_by)
    values (NEW.id, NEW.created_by, NEW.created_by);
    return NEW;
end;
$$ language plpgsql;

drop trigger if exists add_creator_as_organizer_trigger on communities;

create trigger add_creator_as_organizer_trigger
    after insert
    on communities
    for each row
    execute function add_creator_as_organizer();
