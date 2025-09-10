-- Create storage bucket for technical audit files
-- Note: This will create the bucket. RLS policies should be configured through the Supabase dashboard
-- or by a database administrator with proper permissions.

-- Insert bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'technical-audit-files',
    'technical-audit-files',
    false,
    52428800, -- 50MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg', 'audio/webm', 'audio/mp3', 'audio/wav']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;