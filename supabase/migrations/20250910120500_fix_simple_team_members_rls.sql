-- Fix RLS policies for simple_team_members table
-- Allow users to manage members of teams they created or are members of
-- Allow admins to manage all team members

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view simple team members" ON simple_team_members;
DROP POLICY IF EXISTS "Users can manage simple team members" ON simple_team_members;

-- Create new policies that allow proper team member management
CREATE POLICY "Users can view simple team members" ON simple_team_members
  FOR SELECT USING (
    -- Allow if user is admin
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    ) OR
    -- Allow if user is member of the team
    team_id IN (
      SELECT team_id FROM profiles WHERE id = auth.uid()
    ) OR
    -- Allow if user created the team (check teams table)
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage simple team members" ON simple_team_members
  FOR ALL USING (
    -- Allow if user is admin
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    ) OR
    -- Allow if user is member of the team
    team_id IN (
      SELECT team_id FROM profiles WHERE id = auth.uid()
    ) OR
    -- Allow if user created the team (check teams table)
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

-- Also update teams table RLS to ensure proper access
DROP POLICY IF EXISTS "Users can view teams" ON teams;
DROP POLICY IF EXISTS "Users can manage teams" ON teams;

CREATE POLICY "Users can view teams" ON teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    ) OR
    created_by = auth.uid() OR
    id IN (
      SELECT team_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage teams" ON teams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    ) OR
    created_by = auth.uid()
  );