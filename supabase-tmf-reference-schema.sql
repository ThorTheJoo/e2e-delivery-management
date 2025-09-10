-- TMF Reference Data Schema
-- This script creates tables for storing TMF domains and functions reference data

-- Create tmf_domains table
CREATE TABLE IF NOT EXISTS tmf_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tmf_functions table
CREATE TABLE IF NOT EXISTS tmf_functions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES tmf_domains(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  vertical TEXT,
  af_level_1 TEXT,
  af_level_2 TEXT,
  function_id INTEGER,
  uid INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(domain_id, function_name)
);

-- Create specsync_tmf_mappings table for tracking mappings
CREATE TABLE IF NOT EXISTS specsync_tmf_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specsync_item_id TEXT NOT NULL,
  tmf_function_id UUID NOT NULL REFERENCES tmf_functions(id) ON DELETE CASCADE,
  mapping_confidence DECIMAL(3,2) CHECK (mapping_confidence >= 0.00 AND mapping_confidence <= 1.00),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(specsync_item_id, tmf_function_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tmf_functions_domain ON tmf_functions(domain_id);
CREATE INDEX IF NOT EXISTS idx_tmf_functions_name ON tmf_functions(function_name);
CREATE INDEX IF NOT EXISTS idx_tmf_functions_vertical ON tmf_functions(vertical);
CREATE INDEX IF NOT EXISTS idx_tmf_functions_af_level_1 ON tmf_functions(af_level_1);
CREATE INDEX IF NOT EXISTS idx_tmf_functions_af_level_2 ON tmf_functions(af_level_2);
CREATE INDEX IF NOT EXISTS idx_specsync_mappings_item ON specsync_tmf_mappings(specsync_item_id);
CREATE INDEX IF NOT EXISTS idx_specsync_mappings_function ON specsync_tmf_mappings(tmf_function_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_tmf_domains_updated_at BEFORE UPDATE ON tmf_domains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tmf_functions_updated_at BEFORE UPDATE ON tmf_functions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_specsync_tmf_mappings_updated_at BEFORE UPDATE ON specsync_tmf_mappings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE tmf_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE tmf_functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE specsync_tmf_mappings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all operations for authenticated users)
CREATE POLICY "Allow all operations for authenticated users" ON tmf_domains
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON tmf_functions
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON specsync_tmf_mappings
    FOR ALL TO authenticated USING (true);

-- Create views for easier querying
CREATE OR REPLACE VIEW tmf_domains_with_counts AS
SELECT 
    d.id,
    d.name,
    d.created_at,
    d.updated_at,
    COUNT(f.id) as function_count
FROM tmf_domains d
LEFT JOIN tmf_functions f ON d.id = f.domain_id
GROUP BY d.id, d.name, d.created_at, d.updated_at
ORDER BY d.name;

CREATE OR REPLACE VIEW tmf_functions_with_domain AS
SELECT 
    f.id,
    f.function_name,
    f.vertical,
    f.af_level_1,
    f.af_level_2,
    f.function_id,
    f.uid,
    f.created_at,
    f.updated_at,
    d.id as domain_id,
    d.name as domain_name
FROM tmf_functions f
JOIN tmf_domains d ON f.domain_id = d.id
ORDER BY d.name, f.function_name;
