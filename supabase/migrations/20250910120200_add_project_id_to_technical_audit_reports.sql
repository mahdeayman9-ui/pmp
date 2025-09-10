-- Add project_id column to technical_audit_reports table if it doesn't exist
-- This handles the case where the table was created without the project_id column

DO $$
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'technical_audit_reports'
        AND column_name = 'project_id'
        AND table_schema = 'public'
    ) THEN
        -- Add the column
        ALTER TABLE technical_audit_reports
        ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

        -- Create index for the new column
        CREATE INDEX IF NOT EXISTS idx_technical_audit_reports_project_id
        ON technical_audit_reports(project_id);

        RAISE NOTICE 'Added project_id column to technical_audit_reports table';
    ELSE
        RAISE NOTICE 'project_id column already exists in technical_audit_reports table';
    END IF;
END $$;