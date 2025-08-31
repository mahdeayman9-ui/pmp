-- Fix RLS policy for profiles to allow new users to insert their own profile
-- This addresses the chicken-and-egg problem where new users can't create profiles

-- Drop ALL existing policies on profiles table
DROP POLICY IF EXISTS "Profiles managed by admin or self" ON profiles;
DROP POLICY IF EXISTS "Profiles select" ON profiles;
DROP POLICY IF EXISTS "Profiles insert" ON profiles;
DROP POLICY IF EXISTS "Profiles update" ON profiles;
DROP POLICY IF EXISTS "Profiles delete" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;

-- Create separate policies for each operation type (avoiding infinite recursion)
CREATE POLICY "Profiles select" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Profiles insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Profiles delete" ON profiles
  FOR DELETE USING (auth.uid() = id);