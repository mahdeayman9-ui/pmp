-- Create simple_team_members table for simple team members without full profiles
-- Note: There's already a team_members table for linking users to teams

CREATE TABLE simple_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_simple_team_members_team_id ON simple_team_members(team_id);
CREATE INDEX idx_simple_team_members_email ON simple_team_members(email);

-- Enable RLS
ALTER TABLE simple_team_members ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view simple team members" ON simple_team_members
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM profiles WHERE id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can manage simple team members" ON simple_team_members
  FOR ALL USING (
    team_id IN (
      SELECT team_id FROM profiles WHERE id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Update trigger
CREATE TRIGGER update_simple_team_members_updated_at BEFORE UPDATE ON simple_team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();