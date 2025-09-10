-- Update simple_team_members table to include all required member fields
-- This migration adds the new fields required for member management

-- Add new required fields for members to simple_team_members table
ALTER TABLE simple_team_members ADD COLUMN IF NOT EXISTS department VARCHAR(255);
ALTER TABLE simple_team_members ADD COLUMN IF NOT EXISTS job_title VARCHAR(255);
ALTER TABLE simple_team_members ADD COLUMN IF NOT EXISTS salary DECIMAL(10,2);
ALTER TABLE simple_team_members ADD COLUMN IF NOT EXISTS id_photo_url TEXT;
ALTER TABLE simple_team_members ADD COLUMN IF NOT EXISTS pdf_file_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN simple_team_members.department IS 'Department or section the member belongs to';
COMMENT ON COLUMN simple_team_members.job_title IS 'Job title or position of the member';
COMMENT ON COLUMN simple_team_members.salary IS 'Monthly salary of the member';
COMMENT ON COLUMN simple_team_members.id_photo_url IS 'URL to the member ID photo';
COMMENT ON COLUMN simple_team_members.pdf_file_url IS 'URL to uploaded PDF file for the member';

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_simple_team_members_department ON simple_team_members(department);
CREATE INDEX IF NOT EXISTS idx_simple_team_members_job_title ON simple_team_members(job_title);