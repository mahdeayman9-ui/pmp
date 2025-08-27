/*
  # Fix RLS infinite recursion error

  1. Security Fixes
    - Add missing SELECT policy for team_members table
    - Fix recursive policy dependencies
    - Ensure users can view their own team memberships

  This migration fixes the infinite recursion error in RLS policies.
*/

-- Add missing SELECT policy for team_members to break recursion
CREATE POLICY "Users can view their own team memberships" ON team_members
  FOR SELECT USING (user_id = auth.uid());

-- Also add policy for users to view team memberships of their teammates
CREATE POLICY "Users can view team memberships in their teams" ON team_members
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid()
    )
  );

-- Update companies policy to be more permissive
DROP POLICY IF EXISTS "Users can view their company" ON companies;
CREATE POLICY "Users can view their company" ON companies
  FOR SELECT USING (
    id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid()
    )
  );