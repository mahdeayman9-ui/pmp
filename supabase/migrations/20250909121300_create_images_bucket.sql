-- Create images bucket in Supabase Storage for gallery images
-- This bucket will store all uploaded images for the gallery

-- Note: This SQL file is for documentation purposes.
-- The bucket must be created manually in the Supabase Dashboard:
-- 1. Go to Storage in your Supabase project
-- 2. Click "Create bucket"
-- 3. Name it "images"
-- 4. Set it to public (so images can be viewed)
-- 5. Add the following bucket policies:

-- Bucket Policies to add in Supabase Storage:
-- Policy 1: Allow authenticated users to upload images
-- Policy 2: Allow public access to view images
-- Policy 3: Allow users to delete their own images

-- SQL equivalent (for reference only - execute in Supabase SQL Editor):
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);

-- Create policies for the images bucket
CREATE POLICY "Images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Comments for documentation
COMMENT ON POLICY "Images are publicly accessible" ON storage.objects IS 'Allow public access to view images in the images bucket';
COMMENT ON POLICY "Users can upload images" ON storage.objects IS 'Allow authenticated users to upload images to the images bucket';
COMMENT ON POLICY "Users can update their own images" ON storage.objects IS 'Allow users to update their own uploaded images';
COMMENT ON POLICY "Users can delete their own images" ON storage.objects IS 'Allow users to delete their own uploaded images';