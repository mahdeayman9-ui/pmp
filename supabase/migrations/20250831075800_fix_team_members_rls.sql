-- Fix infinite recursion in team_members RLS policies

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can view team memberships in their teams" ON team_members;

-- Create a security definer function to check team membership without triggering RLS
CREATE OR REPLACE FUNCTION is_user_in_team(team_uuid UUID, user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM team_members WHERE team_id = team_uuid AND user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the policy to use the function
CREATE POLICY "Users can view team memberships in their teams" ON team_members
  FOR SELECT USING (is_user_in_team(team_id));

-- Also ensure users can view their own memberships
CREATE POLICY "Users can view their own team memberships" ON team_members
  FOR SELECT USING (user_id = auth.uid());

-- Add policies for INSERT, UPDATE, DELETE if needed
-- Assuming team leaders or admins can manage team members
-- For now, keep it simple: users can manage their own memberships
CREATE POLICY "Users can insert their own team memberships" ON team_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own team memberships" ON team_members
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own team memberships" ON team_members
  FOR DELETE USING (user_id = auth.uid());