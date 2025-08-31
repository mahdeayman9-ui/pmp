-- FRESH CLEAN DATABASE SCHEMA FOR PMP
-- This is a complete reset and rebuild of the database
-- Run this to completely clean and recreate the schema

-- ===========================================
-- STEP 1: COMPLETE CLEANUP
-- ===========================================

-- Drop all existing tables (in reverse dependency order)
DROP TABLE IF EXISTS daily_achievements CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS phases CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS is_user_in_team(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ===========================================
-- STEP 2: ENABLE EXTENSIONS
-- ===========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- STEP 3: CREATE TABLES (Simple and Clean)
-- ===========================================

-- Companies table (simplified)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL DEFAULT 'إدارة المشاريع',
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#5f979d',
  secondary_color VARCHAR(7) DEFAULT '#b4e1e6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table (simplified)
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  username VARCHAR(100) UNIQUE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table (simplified - removed problematic references)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'planning',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Phases table
CREATE TABLE phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  total_target INTEGER DEFAULT 100,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'not-started',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo',
  priority VARCHAR(50) DEFAULT 'medium',
  assigned_to_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  assigned_to_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  phase_id UUID REFERENCES phases(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  total_target INTEGER DEFAULT 100,
  planned_effort_hours INTEGER DEFAULT 40,
  actual_effort_hours DECIMAL(6,2) DEFAULT 0,
  risk_level VARCHAR(50) DEFAULT 'low',
  completion_rate INTEGER DEFAULT 0 CHECK (completion_rate >= 0 AND completion_rate <= 100),
  time_spent INTEGER DEFAULT 0,
  is_overdue BOOLEAN DEFAULT FALSE,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily achievements table
CREATE TABLE daily_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_in_location JSONB,
  check_out_time TIMESTAMP WITH TIME ZONE,
  check_out_location JSONB,
  work_hours DECIMAL(4,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, date)
);

-- ===========================================
-- STEP 4: CREATE INDEXES
-- ===========================================

CREATE INDEX idx_profiles_team_id ON profiles(team_id);
CREATE INDEX idx_profiles_company_id ON profiles(company_id);
CREATE INDEX idx_projects_team_id ON projects(team_id);
CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_phase_id ON tasks(phase_id);
CREATE INDEX idx_tasks_assigned_to_team_id ON tasks(assigned_to_team_id);
CREATE INDEX idx_tasks_assigned_to_user_id ON tasks(assigned_to_user_id);
CREATE INDEX idx_daily_achievements_task_id ON daily_achievements(task_id);
CREATE INDEX idx_daily_achievements_user_id ON daily_achievements(user_id);
CREATE INDEX idx_daily_achievements_date ON daily_achievements(date);

-- ===========================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_achievements ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- STEP 6: SIMPLE RLS POLICIES
-- ===========================================

-- Companies: Allow all authenticated users to read, only admins to modify
CREATE POLICY "Companies are viewable by authenticated users" ON companies
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Companies are manageable by admins" ON companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Teams: Users can view teams they're members of
CREATE POLICY "Users can view their teams" ON teams
  FOR SELECT USING (
    id IN (
      SELECT team_id FROM profiles WHERE id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage teams" ON teams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Profiles: Users can manage their own profiles
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Projects: Users can view projects from their teams
CREATE POLICY "Users can view team projects" ON projects
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM profiles WHERE id = auth.uid()
    ) OR
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can manage team projects" ON projects
  FOR ALL USING (
    team_id IN (
      SELECT team_id FROM profiles WHERE id = auth.uid()
    ) OR
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Tasks: Users can view tasks assigned to them or their teams
CREATE POLICY "Users can view assigned tasks" ON tasks
  FOR SELECT USING (
    assigned_to_user_id = auth.uid() OR
    assigned_to_team_id IN (
      SELECT team_id FROM profiles WHERE id = auth.uid()
    ) OR
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can manage assigned tasks" ON tasks
  FOR ALL USING (
    assigned_to_user_id = auth.uid() OR
    assigned_to_team_id IN (
      SELECT team_id FROM profiles WHERE id = auth.uid()
    ) OR
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Daily achievements: Users can manage their own achievements
CREATE POLICY "Users can manage own achievements" ON daily_achievements
  FOR ALL USING (user_id = auth.uid());

-- ===========================================
-- STEP 7: INSERT DEFAULT DATA
-- ===========================================

-- Insert default company
INSERT INTO companies (name, primary_color, secondary_color)
VALUES ('إدارة المشاريع', '#5f979d', '#b4e1e6');

-- Insert default team
INSERT INTO teams (name, description, company_id)
SELECT 'فريق التطوير', 'الفريق الرئيسي للمشاريع', id
FROM companies
WHERE name = 'إدارة المشاريع'
LIMIT 1;

-- ===========================================
-- STEP 8: CREATE UPDATE TRIGGERS
-- ===========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phases_updated_at BEFORE UPDATE ON phases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- STEP 9: GRANT PERMISSIONS
-- ===========================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ===========================================
-- SETUP COMPLETE
-- ===========================================

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'PMP Database Schema Setup Complete!';
    RAISE NOTICE 'Default company and team have been created.';
    RAISE NOTICE 'RLS policies are configured for security.';
END
$$;