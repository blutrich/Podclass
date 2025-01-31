-- Create saved_lessons table
CREATE TABLE saved_lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN content::json->>'title' IS NOT NULL 
            THEN content::json->>'title'
            ELSE 'Untitled Lesson'
        END
    ) STORED
);

-- Add indexes for better query performance
CREATE INDEX saved_lessons_episode_id_idx ON saved_lessons(episode_id);
CREATE INDEX saved_lessons_user_id_idx ON saved_lessons(user_id);
CREATE INDEX saved_lessons_created_at_idx ON saved_lessons(created_at DESC);

-- Add RLS policies
ALTER TABLE saved_lessons ENABLE ROW LEVEL SECURITY;

-- Users can only read their own saved lessons
CREATE POLICY "Users can read their own saved lessons"
    ON saved_lessons
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own lessons
CREATE POLICY "Users can insert their own lessons"
    ON saved_lessons
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own lessons
CREATE POLICY "Users can delete their own lessons"
    ON saved_lessons
    FOR DELETE
    USING (auth.uid() = user_id);
