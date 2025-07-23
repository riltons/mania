-- Adiciona a relação de chave estrangeira entre competition_members e players
ALTER TABLE competition_members
ADD CONSTRAINT fk_competition_members_player
FOREIGN KEY (player_id)
REFERENCES players(id);