-- Add media and voice_notes columns to daily_achievements table
ALTER TABLE daily_achievements ADD COLUMN media JSONB DEFAULT '[]'::jsonb;
ALTER TABLE daily_achievements ADD COLUMN voice_notes JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN daily_achievements.media IS 'Array of media items (images/videos) uploaded for this achievement';
COMMENT ON COLUMN daily_achievements.voice_notes IS 'Array of voice note recordings for this achievement';