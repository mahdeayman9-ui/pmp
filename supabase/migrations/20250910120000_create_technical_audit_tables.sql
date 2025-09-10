-- Create technical audit reports table
CREATE TABLE IF NOT EXISTS technical_audit_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    submitted_to TEXT,
    prepared_by TEXT,
    audited_entity TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    executing_entity TEXT,
    report_date DATE DEFAULT CURRENT_DATE,
    signature_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create technical audit checklist items table
CREATE TABLE IF NOT EXISTS technical_audit_checklist_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES technical_audit_reports(id) ON DELETE CASCADE,
    section_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    item_text TEXT NOT NULL,
    status TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create technical audit media table
CREATE TABLE IF NOT EXISTS technical_audit_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES technical_audit_reports(id) ON DELETE CASCADE,
    section_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE technical_audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_audit_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_audit_media ENABLE ROW LEVEL SECURITY;

-- Create policies for technical_audit_reports
CREATE POLICY "Users can view their own technical audit reports" ON technical_audit_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own technical audit reports" ON technical_audit_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own technical audit reports" ON technical_audit_reports
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own technical audit reports" ON technical_audit_reports
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for technical_audit_checklist_items
CREATE POLICY "Users can view checklist items for their reports" ON technical_audit_checklist_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM technical_audit_reports
            WHERE technical_audit_reports.id = technical_audit_checklist_items.report_id
            AND technical_audit_reports.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert checklist items for their reports" ON technical_audit_checklist_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM technical_audit_reports
            WHERE technical_audit_reports.id = technical_audit_checklist_items.report_id
            AND technical_audit_reports.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update checklist items for their reports" ON technical_audit_checklist_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM technical_audit_reports
            WHERE technical_audit_reports.id = technical_audit_checklist_items.report_id
            AND technical_audit_reports.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete checklist items for their reports" ON technical_audit_checklist_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM technical_audit_reports
            WHERE technical_audit_reports.id = technical_audit_checklist_items.report_id
            AND technical_audit_reports.user_id = auth.uid()
        )
    );

-- Create policies for technical_audit_media
CREATE POLICY "Users can view media for their reports" ON technical_audit_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM technical_audit_reports
            WHERE technical_audit_reports.id = technical_audit_media.report_id
            AND technical_audit_reports.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert media for their reports" ON technical_audit_media
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM technical_audit_reports
            WHERE technical_audit_reports.id = technical_audit_media.report_id
            AND technical_audit_reports.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update media for their reports" ON technical_audit_media
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM technical_audit_reports
            WHERE technical_audit_reports.id = technical_audit_media.report_id
            AND technical_audit_reports.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete media for their reports" ON technical_audit_media
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM technical_audit_reports
            WHERE technical_audit_reports.id = technical_audit_media.report_id
            AND technical_audit_reports.user_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_technical_audit_reports_user_id ON technical_audit_reports(user_id);
CREATE INDEX idx_technical_audit_reports_created_at ON technical_audit_reports(created_at);
CREATE INDEX idx_technical_audit_checklist_items_report_id ON technical_audit_checklist_items(report_id);
CREATE INDEX idx_technical_audit_media_report_id ON technical_audit_media(report_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_technical_audit_reports_updated_at
    BEFORE UPDATE ON technical_audit_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: Projects already have RLS policy "Team members can view team projects"
-- The TechnicalAuditReport component will use team-based project access