-- Create revenues table
CREATE TABLE revenues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item TEXT NOT NULL,
  planned_revenue DECIMAL(15,2) DEFAULT 0,
  actual_revenue DECIMAL(15,2) DEFAULT 0,
  planned_date DATE,
  actual_date DATE,
  amount_variance DECIMAL(15,2) DEFAULT 0,
  days_variance INTEGER DEFAULT 0,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create costs table
CREATE TABLE costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item TEXT NOT NULL,
  planned_cost DECIMAL(15,2) DEFAULT 0,
  actual_cost DECIMAL(15,2) DEFAULT 0,
  planned_date DATE,
  actual_date DATE,
  amount_variance DECIMAL(15,2) DEFAULT 0,
  days_variance INTEGER DEFAULT 0,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_revenues_company_id ON revenues(company_id);
CREATE INDEX idx_revenues_created_at ON revenues(created_at);
CREATE INDEX idx_costs_company_id ON costs(company_id);
CREATE INDEX idx_costs_created_at ON costs(created_at);

-- Enable RLS
ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE costs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for revenues
CREATE POLICY "Revenues select" ON revenues
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    (company_id IS NULL OR company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Revenues insert" ON revenues
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    (company_id IS NULL OR company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Revenues update" ON revenues
  FOR UPDATE USING (
    auth.uid() = created_by AND
    (company_id IS NULL OR company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Revenues delete" ON revenues
  FOR DELETE USING (
    auth.uid() = created_by AND
    (company_id IS NULL OR company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    ))
  );

-- Create RLS policies for costs
CREATE POLICY "Costs select" ON costs
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    (company_id IS NULL OR company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Costs insert" ON costs
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    (company_id IS NULL OR company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Costs update" ON costs
  FOR UPDATE USING (
    auth.uid() = created_by AND
    (company_id IS NULL OR company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Costs delete" ON costs
  FOR DELETE USING (
    auth.uid() = created_by AND
    (company_id IS NULL OR company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    ))
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_revenues_updated_at BEFORE UPDATE ON revenues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_costs_updated_at BEFORE UPDATE ON costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();