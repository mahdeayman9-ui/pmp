-- Add project_id to revenues and costs tables for project-based financial management
-- This migration links financial data to specific projects

-- Add project_id column to revenues table
ALTER TABLE revenues ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

-- Add project_id column to costs table
ALTER TABLE costs ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_revenues_project_id ON revenues(project_id);
CREATE INDEX IF NOT EXISTS idx_costs_project_id ON costs(project_id);

-- Update existing data to link with projects (if any projects exist)
-- This will set project_id for existing financial records based on company
-- Note: You may need to manually assign project_id values for existing data

-- Add comments for documentation
COMMENT ON COLUMN revenues.project_id IS 'Project that this revenue belongs to';
COMMENT ON COLUMN costs.project_id IS 'Project that this cost belongs to';

-- Optional: Create a view for project financial summary
CREATE OR REPLACE VIEW project_financial_summary AS
SELECT
  p.id as project_id,
  p.name as project_name,
  p.status as project_status,
  COALESCE(SUM(r.actual_revenue), 0) as total_revenue,
  COALESCE(SUM(c.actual_cost), 0) as total_cost,
  COALESCE(SUM(r.actual_revenue), 0) - COALESCE(SUM(c.actual_cost), 0) as net_profit,
  COUNT(DISTINCT r.id) as revenue_items_count,
  COUNT(DISTINCT c.id) as cost_items_count
FROM projects p
LEFT JOIN revenues r ON p.id = r.project_id
LEFT JOIN costs c ON p.id = c.project_id
GROUP BY p.id, p.name, p.status;

-- Grant permissions on the view
GRANT SELECT ON project_financial_summary TO authenticated;

-- Add RLS policy for the view
ALTER VIEW project_financial_summary SET (security_barrier = true);

-- Note: For existing data migration, you can run queries like:
-- UPDATE revenues SET project_id = (SELECT id FROM projects WHERE company_id = revenues.company_id LIMIT 1) WHERE project_id IS NULL;
-- UPDATE costs SET project_id = (SELECT id FROM projects WHERE company_id = costs.company_id LIMIT 1) WHERE project_id IS NULL;