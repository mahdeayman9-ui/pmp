-- Migrate member data from profiles to simple_team_members table
-- This migration moves all member data to the dedicated team_members table

-- Insert existing member data from profiles to simple_team_members
INSERT INTO simple_team_members (
  team_id,
  name,
  email,
  role,
  department,
  job_title,
  salary,
  id_photo_url,
  pdf_file_url,
  created_at
)
SELECT
  team_id,
  name,
  email,
  role,
  department,
  job_title,
  salary,
  id_photo_url,
  pdf_file_url,
  created_at
FROM profiles
WHERE team_id IS NOT NULL;

-- Remove the added columns from profiles table (revert changes)
ALTER TABLE profiles DROP COLUMN IF EXISTS department;
ALTER TABLE profiles DROP COLUMN IF EXISTS job_title;
ALTER TABLE profiles DROP COLUMN IF EXISTS salary;
ALTER TABLE profiles DROP COLUMN IF EXISTS id_photo_url;
ALTER TABLE profiles DROP COLUMN IF EXISTS pdf_file_url;

-- Drop the indexes we created for profiles
DROP INDEX IF EXISTS idx_profiles_department;
DROP INDEX IF EXISTS idx_profiles_job_title;

-- Add back the email column to profiles if it was removed
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;

-- Update profiles to have email back (you may need to handle this based on your auth setup)
-- Note: This assumes you have the email in auth.users or need to handle it differently