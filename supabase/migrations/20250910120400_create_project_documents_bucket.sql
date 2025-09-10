-- Create storage bucket for project documents (PDFs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-documents', 'project-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy for project documents bucket
CREATE POLICY "Users can upload their company's project documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'project-documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their company's project documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'project-documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their company's project documents" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'project-documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their company's project documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'project-documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );