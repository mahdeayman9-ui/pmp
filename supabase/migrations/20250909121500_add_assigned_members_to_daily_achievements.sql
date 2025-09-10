-- Add assigned_members column to daily_achievements table
ALTER TABLE daily_achievements
ADD COLUMN assigned_members TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN daily_achievements.assigned_members IS 'Array of member IDs assigned to work on this daily achievement';