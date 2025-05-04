-- Create a function to get competitions for a community
CREATE OR REPLACE FUNCTION get_community_competitions(
    p_community_id UUID,
    p_user_id UUID
)
RETURNS SETOF competitions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT c.*
    FROM competitions c
    WHERE c.community_id = p_community_id
    AND (
        -- User is the creator of the competition
        c.created_by = p_user_id
        OR
        -- User is the creator of the community
        EXISTS (
            SELECT 1
            FROM communities comm
            WHERE comm.id = c.community_id
            AND comm.created_by = p_user_id
        )
        OR
        -- User is an organizer of the community
        EXISTS (
            SELECT 1
            FROM community_organizers co
            WHERE co.community_id = c.community_id
            AND co.user_id = p_user_id
        )
        OR
        -- User has a player in the competition
        EXISTS (
            SELECT 1
            FROM competition_members cm
            JOIN players p ON p.id = cm.player_id
            WHERE cm.competition_id = c.id
            AND p.created_by = p_user_id
        )
    )
    ORDER BY c.created_at DESC;
END;
$$;