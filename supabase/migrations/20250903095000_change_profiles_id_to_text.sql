-- Change profiles.id from UUID to TEXT to support non-UUID auth user IDs

-- First, drop the foreign key constraint
ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;

-- Change the id column to TEXT
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;

-- Note: Cannot add back foreign key constraint since auth.users.id is UUID and profiles.id is now TEXT
-- Profiles will be standalone, not linked to auth.users