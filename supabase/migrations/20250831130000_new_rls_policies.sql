-- New RLS Policies and Team Creation Trigger
-- This migration drops all existing policies and creates new ones based on requirements

-- ===========================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Companies are viewable by authenticated users" ON companies;
DROP POLICY IF EXISTS "Companies are manageable by admins" ON companies;
DROP POLICY IF EXISTS "Users can view their teams" ON teams;
DROP POLICY IF EXISTS "Admins can manage teams" ON teams;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view team projects" ON projects;
DROP POLICY IF EXISTS "Users can manage team projects" ON projects;
DROP POLICY IF EXISTS "Users can view assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Users can manage assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Users can manage own achievements" ON daily_achievements;

-- Drop any policies on phases if exist
DROP POLICY IF EXISTS "Users can view phases" ON phases;
DROP POLICY IF EXISTS "Users can manage phases" ON phases;

-- ===========================================
-- STEP 2: CREATE NEW POLICIES
-- ===========================================

-- Companies: Admin full access, others can view
CREATE POLICY "Companies viewable by authenticated" ON companies
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Companies managed by admin" ON companies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Teams: Admin full access, managers and members can view their team
CREATE POLICY "Teams viewable by team members" ON teams
  FOR SELECT USING (
    id IN (SELECT team_id FROM profiles WHERE id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Teams managed by admin" ON teams
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Profiles: Admin full access, users can view all, manage own
CREATE POLICY "Profiles viewable by authenticated" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Profiles managed by admin or self" ON profiles
  FOR ALL USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Projects: Admin full access, team members can view, managers can manage their team's projects
CREATE POLICY "Projects viewable by team members" ON projects
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()) OR
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Projects managed by admin or team managers" ON projects
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager') AND
     team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()))
  );

-- Phases: Similar to projects
CREATE POLICY "Phases viewable by team members" ON phases
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE
      team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()) OR
      created_by = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    )
  );

CREATE POLICY "Phases managed by admin or team managers" ON phases
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager') AND
     project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())))
  );

-- Tasks: Admin full access, managers can add/update for their team, users can view/manage assigned
CREATE POLICY "Tasks viewable by team members" ON tasks
  FOR SELECT USING (
    assigned_to_user_id = auth.uid() OR
    assigned_to_team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()) OR
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Tasks managed by admin or managers for team" ON tasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
    assigned_to_user_id = auth.uid() OR
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager') AND
     assigned_to_team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())) OR
    created_by = auth.uid()
  );

-- Daily Achievements: Users manage own, managers manage for their team's tasks
CREATE POLICY "Achievements managed by user or team manager" ON daily_achievements
  FOR ALL USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager') AND
     task_id IN (SELECT id FROM tasks WHERE assigned_to_team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())))
  );

-- ===========================================
-- STEP 3: FUNCTION TO CREATE MANAGER USER
-- ===========================================

CREATE OR REPLACE FUNCTION create_manager_for_team()
RETURNS TRIGGER AS $$
DECLARE
  manager_user_id UUID;
  random_username TEXT;
  random_password TEXT;
  random_email TEXT;
BEGIN
  -- Generate random username and password
  random_username := 'manager_' || NEW.id::text;
  random_password := md5(random()::text || now()::text);
  random_email := random_username || '@pmp.local';

  -- Create user in auth.users
  SELECT auth.admin_create_user(random_email, random_password, '{"username": "' || random_username || '"}') INTO manager_user_id;

  -- Insert into profiles
  INSERT INTO profiles (id, email, name, role, username, team_id, company_id)
  VALUES (manager_user_id, random_email, 'Manager ' || NEW.name, 'manager', random_username, NEW.id, NEW.company_id);

  -- Log the created user (optional)
  RAISE NOTICE 'Created manager user: % with password: %', random_email, random_password;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- STEP 4: TRIGGER ON TEAMS INSERT
-- ===========================================

CREATE TRIGGER create_manager_on_team_insert
  AFTER INSERT ON teams
  FOR EACH ROW
  EXECUTE FUNCTION create_manager_for_team();

-- ===========================================
-- MIGRATION COMPLETE
-- ===========================================