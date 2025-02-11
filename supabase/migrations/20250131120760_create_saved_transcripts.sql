-- Create saved_transcripts table
CREATE TABLE saved_transcripts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    episode_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add indexes for better query performance
CREATE INDEX saved_transcripts_episode_id_idx ON saved_transcripts(episode_id);
CREATE INDEX saved_transcripts_user_id_idx ON saved_transcripts(user_id);
CREATE INDEX saved_transcripts_created_at_idx ON saved_transcripts(created_at DESC);

-- Add unique constraint to prevent duplicate saves
CREATE UNIQUE INDEX saved_transcripts_user_episode_idx ON saved_transcripts(user_id, episode_id);

-- Add RLS policies
ALTER TABLE saved_transcripts ENABLE ROW LEVEL SECURITY;

-- Users can only read their own saved transcripts
CREATE POLICY "Users can read their own saved transcripts"
    ON saved_transcripts
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own transcripts
CREATE POLICY "Users can insert their own transcripts"
    ON saved_transcripts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own transcripts
CREATE POLICY "Users can delete their own transcripts"
    ON saved_transcripts
    FOR DELETE
    USING (auth.uid() = user_id); 