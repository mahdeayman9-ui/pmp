-- Create function to get all tasks for admin users, bypassing RLS
CREATE OR REPLACE FUNCTION get_all_tasks_for_admin()
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  status TEXT,
  priority TEXT,
  assigned_to_team_id UUID,
  assigned_to_user_id UUID,
  start_date DATE,
  end_date DATE,
  progress INTEGER,
  phase_id UUID,
  project_id UUID,
  created_at TIMESTAMPTZ,
  total_target INTEGER,
  actual_start_date TIMESTAMPTZ,
  actual_end_date TIMESTAMPTZ,
  planned_effort_hours INTEGER,
  actual_effort_hours INTEGER,
  risk_level TEXT,
  completion_rate INTEGER,
  time_spent INTEGER,
  is_overdue BOOLEAN,
  last_activity TIMESTAMPTZ,
  profiles JSONB
) AS $$
BEGIN
  -- Check if current user is admin
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    -- Return all tasks with profile info
    RETURN QUERY
    SELECT
      t.id,
      t.title,
      t.description,
      t.status,
      t.priority,
      t.assigned_to_team_id,
      t.assigned_to_user_id,
      t.start_date,
      t.end_date,
      t.progress,
      t.phase_id,
      t.project_id,
      t.created_at,
      t.total_target,
      t.actual_start_date,
      t.actual_end_date,
      t.planned_effort_hours,
      t.actual_effort_hours,
      t.risk_level,
      t.completion_rate,
      t.time_spent,
      t.is_overdue,
      t.last_activity,
      CASE
        WHEN p.name IS NOT NULL THEN jsonb_build_object('name', p.name)
        ELSE NULL
      END as profiles
    FROM tasks t
    LEFT JOIN profiles p ON t.assigned_to_user_id = p.id;
  ELSE
    -- For non-admin users, return empty result
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_tasks_for_admin() TO authenticated;