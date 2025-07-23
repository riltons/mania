-- Drop existing policies
DROP POLICY IF EXISTS "Criador tem acesso total aos membros" ON competition_members;

-- Enable RLS
ALTER TABLE competition_members ENABLE ROW LEVEL SECURITY;

-- Create new policy for competition_members
CREATE POLICY "Gerenciar membros da competição"
    ON competition_members FOR ALL
    TO authenticated
    USING (
        -- User is the creator of the competition
        EXISTS (
            SELECT 1 FROM competitions c
            WHERE c.id = competition_id
            AND c.created_by = auth.uid()
        )
        OR
        -- User is the creator of the community
        EXISTS (
            SELECT 1 FROM competitions c
            JOIN communities comm ON comm.id = c.community_id
            WHERE c.id = competition_id
            AND comm.created_by = auth.uid()
        )
        OR
        -- User is an organizer of the community
        EXISTS (
            SELECT 1 FROM competitions c
            JOIN community_organizers co ON co.community_id = c.community_id
            WHERE c.id = competition_id
            AND co.user_id = auth.uid()
        )
        OR
        -- User is the owner of the player being added/viewed
        EXISTS (
            SELECT 1 FROM players p
            WHERE p.id = player_id
            AND p.created_by = auth.uid()
        )
    )
    WITH CHECK (
        -- User is the creator of the competition
        EXISTS (
            SELECT 1 FROM competitions c
            WHERE c.id = competition_id
            AND c.created_by = auth.uid()
        )
        OR
        -- User is the creator of the community
        EXISTS (
            SELECT 1 FROM competitions c
            JOIN communities comm ON comm.id = c.community_id
            WHERE c.id = competition_id
            AND comm.created_by = auth.uid()
        )
        OR
        -- User is an organizer of the community
        EXISTS (
            SELECT 1 FROM competitions c
            JOIN community_organizers co ON co.community_id = c.community_id
            WHERE c.id = competition_id
            AND co.user_id = auth.uid()
        )
        OR
        -- User is the owner of the player being added
        EXISTS (
            SELECT 1 FROM players p
            WHERE p.id = player_id
            AND p.created_by = auth.uid()
        )
    );