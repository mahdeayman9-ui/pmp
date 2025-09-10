-- Create project documents table for PDF archive
CREATE TABLE IF NOT EXISTS project_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    document_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    company_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for project_documents
CREATE POLICY "Users can view documents for their company's projects" ON project_documents
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert documents for their company's projects" ON project_documents
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
        AND uploaded_by = auth.uid()
    );

CREATE POLICY "Users can update their own documents" ON project_documents
    FOR UPDATE USING (
        uploaded_by = auth.uid()
        AND company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own documents" ON project_documents
    FOR DELETE USING (
        uploaded_by = auth.uid()
        AND company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_project_documents_project_id ON project_documents(project_id);
CREATE INDEX idx_project_documents_company_id ON project_documents(company_id);
CREATE INDEX idx_project_documents_uploaded_by ON project_documents(uploaded_by);
CREATE INDEX idx_project_documents_created_at ON project_documents(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_project_documents_updated_at
    BEFORE UPDATE ON project_documents
    FOR EACH ROW EXECUTE FUNCTION update_project_documents_updated_at();