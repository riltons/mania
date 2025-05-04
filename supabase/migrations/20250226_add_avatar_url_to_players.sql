-- Add avatar_url column to players table
ALTER TABLE public.players
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create storage bucket for player avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('player-avatars', 'player-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policy to allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own player avatars"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'player-avatars' AND (
        -- Check if the player is created by the user
        EXISTS (
            SELECT 1 FROM public.players
            WHERE id::text = SPLIT_PART(storage.objects.name, '/', 1)
            AND created_by = auth.uid()
        )
    ));

-- Allow users to update their own player avatars
CREATE POLICY "Users can update their own player avatars"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'player-avatars' AND (
        -- Check if the player is created by the user
        EXISTS (
            SELECT 1 FROM public.players
            WHERE id::text = SPLIT_PART(storage.objects.name, '/', 1)
            AND created_by = auth.uid()
        )
    ));

-- Allow users to delete their own player avatars
CREATE POLICY "Users can delete their own player avatars"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'player-avatars' AND (
        -- Check if the player is created by the user
        EXISTS (
            SELECT 1 FROM public.players
            WHERE id::text = SPLIT_PART(storage.objects.name, '/', 1)
            AND created_by = auth.uid()
        )
    ));

-- Allow authenticated users to view player avatars
CREATE POLICY "Anyone can view player avatars"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'player-avatars');