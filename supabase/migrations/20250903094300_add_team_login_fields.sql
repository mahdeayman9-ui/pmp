-- Add login fields to teams table for storing generated team leader credentials
ALTER TABLE teams ADD COLUMN login_email TEXT;
ALTER TABLE teams ADD COLUMN login_password TEXT;