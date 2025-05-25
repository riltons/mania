-- Drop existing table if exists
DROP TABLE IF EXISTS communities CASCADE;

-- Create the communities table
CREATE TABLE communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add updated_at column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'communities' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE communities 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());
    END IF;
END $$;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS update_communities_updated_at ON communities;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating timestamps
CREATE TRIGGER update_communities_updated_at
    BEFORE UPDATE ON communities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Drop existing policies
DROP POLICY IF EXISTS "Communities are viewable by everyone" ON communities;
DROP POLICY IF EXISTS "Users can create communities" ON communities;
DROP POLICY IF EXISTS "Users can update their own communities" ON communities;
DROP POLICY IF EXISTS "Users can delete their own communities" ON communities;

-- Enable RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- Policy for viewing communities (everyone can view)
CREATE POLICY "communities_select_policy"
ON communities FOR SELECT
TO authenticated
USING (created_by = auth.uid());

-- Policy for inserting communities (authenticated users can create)
CREATE POLICY "communities_insert_policy"
ON communities FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Policy for updating communities (only owner can update)
CREATE POLICY "communities_update_policy"
ON communities FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Policy for deleting communities (only owner can delete)
CREATE POLICY "communities_delete_policy"
ON communities FOR DELETE
TO authenticated
USING (created_by = auth.uid());
