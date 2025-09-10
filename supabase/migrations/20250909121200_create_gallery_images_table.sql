-- Create gallery_images table for storing image gallery data
-- This table stores all images uploaded to the gallery with metadata

CREATE TABLE gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_gallery_images_company_id ON gallery_images(company_id);
CREATE INDEX idx_gallery_images_uploaded_by ON gallery_images(uploaded_by);
CREATE INDEX idx_gallery_images_created_at ON gallery_images(created_at);

-- Enable Row Level Security
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view gallery images from their company" ON gallery_images
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can upload gallery images to their company" ON gallery_images
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update their own gallery images" ON gallery_images
  FOR UPDATE USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can delete their own gallery images" ON gallery_images
  FOR DELETE USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_gallery_images_updated_at
  BEFORE UPDATE ON gallery_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE gallery_images IS 'Table for storing gallery images with metadata';
COMMENT ON COLUMN gallery_images.title IS 'Title or name of the image';
COMMENT ON COLUMN gallery_images.description IS 'Optional description of the image';
COMMENT ON COLUMN gallery_images.image_url IS 'URL of the uploaded image in storage';
COMMENT ON COLUMN gallery_images.uploaded_by IS 'User who uploaded the image';
COMMENT ON COLUMN gallery_images.company_id IS 'Company that owns the image';