-- Supabase Database Schema for E2E Delivery Management System
-- Run this script in your Supabase SQL Editor to create all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  customer TEXT,
  status TEXT CHECK (status IN ('Planning', 'In Progress', 'Completed', 'On Hold')),
  start_date DATE,
  end_date DATE,
  duration_months INTEGER,
  team_size INTEGER,
  working_days_per_month INTEGER DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- TMF Reference Domains table
CREATE TABLE IF NOT EXISTS tmf_reference_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- TMF Reference Capabilities table
CREATE TABLE IF NOT EXISTS tmf_reference_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  domain_id UUID REFERENCES tmf_reference_domains(id) ON DELETE CASCADE,
  category TEXT,
  level TEXT DEFAULT 'Basic',
  version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- User Domains table
CREATE TABLE IF NOT EXISTS user_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  reference_domain_id UUID REFERENCES tmf_reference_domains(id),
  is_selected BOOLEAN DEFAULT FALSE,
  is_expanded BOOLEAN DEFAULT FALSE,
  requirement_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- User Capabilities table
CREATE TABLE IF NOT EXISTS user_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES user_domains(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  reference_capability_id UUID REFERENCES tmf_reference_capabilities(id),
  is_selected BOOLEAN DEFAULT FALSE,
  requirement_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- SpecSync Items table
CREATE TABLE IF NOT EXISTS specsync_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  requirement_id TEXT NOT NULL,
  rephrased_requirement_id TEXT,
  source_requirement_id TEXT,
  function_name TEXT,
  capability TEXT,
  usecase1 TEXT,
  usecase2 TEXT,
  usecase3 TEXT,
  description TEXT,
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  status TEXT DEFAULT 'Identified',
  effort_ba NUMERIC DEFAULT 0,
  effort_sa NUMERIC DEFAULT 0,
  effort_dev NUMERIC DEFAULT 0,
  effort_qa NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add unique constraint for upsert operations
ALTER TABLE specsync_items ADD CONSTRAINT IF NOT EXISTS specsync_items_project_req_unique
UNIQUE (project_id, requirement_id);

-- Blue Dolphin Objects table
CREATE TABLE IF NOT EXISTS blue_dolphin_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  blue_dolphin_id TEXT,
  title TEXT,
  object_type TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- CETv22 Data table
CREATE TABLE IF NOT EXISTS cetv22_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  customer_name TEXT,
  project_name TEXT,
  project_type TEXT,
  commercial_model TEXT,
  risk_factors TEXT,
  phases JSONB,
  products JSONB,
  job_profiles JSONB,
  resource_demands JSONB,
  lookup_values JSONB,
  deal_types JSONB,
  analysis_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Work Packages table
CREATE TABLE IF NOT EXISTS work_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT,
  status TEXT DEFAULT 'Planning',
  effort_ba NUMERIC DEFAULT 0,
  effort_sa NUMERIC DEFAULT 0,
  effort_dev NUMERIC DEFAULT 0,
  effort_qa NUMERIC DEFAULT 0,
  dependencies UUID[],
  milestones JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Bill of Materials table
CREATE TABLE IF NOT EXISTS bill_of_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  tmf_domain TEXT,
  capability TEXT,
  requirement TEXT,
  effort_ba NUMERIC DEFAULT 0,
  effort_sa NUMERIC DEFAULT 0,
  effort_dev NUMERIC DEFAULT 0,
  effort_qa NUMERIC DEFAULT 0,
  service_delivery_services JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Integration Configs table
CREATE TABLE IF NOT EXISTS integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,
  config_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  config_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- User Preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  preference_key TEXT NOT NULL,
  preference_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Filter Categories table
CREATE TABLE IF NOT EXISTS filter_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Filter Options table
CREATE TABLE IF NOT EXISTS filter_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES filter_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tmf_reference_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE tmf_reference_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE specsync_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE blue_dolphin_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE cetv22_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_of_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE filter_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE filter_options ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allow all operations for now - customize based on your auth requirements)
-- Projects
CREATE POLICY "Allow all operations on projects" ON projects FOR ALL USING (true);

-- TMF Reference Data
CREATE POLICY "Allow all operations on tmf_reference_domains" ON tmf_reference_domains FOR ALL USING (true);
CREATE POLICY "Allow all operations on tmf_reference_capabilities" ON tmf_reference_capabilities FOR ALL USING (true);

-- User Data
CREATE POLICY "Allow all operations on user_domains" ON user_domains FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_capabilities" ON user_capabilities FOR ALL USING (true);

-- Integration Data
CREATE POLICY "Allow all operations on specsync_items" ON specsync_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on blue_dolphin_objects" ON blue_dolphin_objects FOR ALL USING (true);
CREATE POLICY "Allow all operations on cetv22_data" ON cetv22_data FOR ALL USING (true);

-- Project Management
CREATE POLICY "Allow all operations on work_packages" ON work_packages FOR ALL USING (true);
CREATE POLICY "Allow all operations on bill_of_materials" ON bill_of_materials FOR ALL USING (true);

-- Configuration
CREATE POLICY "Allow all operations on integration_configs" ON integration_configs FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_preferences" ON user_preferences FOR ALL USING (true);
CREATE POLICY "Allow all operations on filter_categories" ON filter_categories FOR ALL USING (true);
CREATE POLICY "Allow all operations on filter_options" ON filter_options FOR ALL USING (true);

-- Create indexes for better performance
-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_customer ON projects(customer);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);

-- SpecSync Items
CREATE INDEX IF NOT EXISTS idx_specsync_items_project_id ON specsync_items(project_id);
CREATE INDEX IF NOT EXISTS idx_specsync_items_requirement_id ON specsync_items(requirement_id);
CREATE INDEX IF NOT EXISTS idx_specsync_items_capability ON specsync_items(capability);
CREATE INDEX IF NOT EXISTS idx_specsync_items_priority ON specsync_items(priority);

-- User Domains
CREATE INDEX IF NOT EXISTS idx_user_domains_project_id ON user_domains(project_id);
CREATE INDEX IF NOT EXISTS idx_user_domains_reference_id ON user_domains(reference_domain_id);
CREATE INDEX IF NOT EXISTS idx_user_domains_is_selected ON user_domains(is_selected);

-- User Capabilities
CREATE INDEX IF NOT EXISTS idx_user_capabilities_domain_id ON user_capabilities(domain_id);
CREATE INDEX IF NOT EXISTS idx_user_capabilities_is_selected ON user_capabilities(is_selected);

-- Blue Dolphin Objects
CREATE INDEX IF NOT EXISTS idx_blue_dolphin_objects_project_id ON blue_dolphin_objects(project_id);
CREATE INDEX IF NOT EXISTS idx_blue_dolphin_objects_type ON blue_dolphin_objects(object_type);

-- TMF Reference Data
CREATE INDEX IF NOT EXISTS idx_tmf_reference_domains_category ON tmf_reference_domains(category);
CREATE INDEX IF NOT EXISTS idx_tmf_reference_capabilities_domain_id ON tmf_reference_capabilities(domain_id);
CREATE INDEX IF NOT EXISTS idx_tmf_reference_capabilities_level ON tmf_reference_capabilities(level);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_projects_customer_status ON projects(customer, status);
CREATE INDEX IF NOT EXISTS idx_specsync_project_capability ON specsync_items(project_id, capability);
CREATE INDEX IF NOT EXISTS idx_user_domains_project_selected ON user_domains(project_id, is_selected);

-- Insert TMF Reference Data (if not exists)
INSERT INTO tmf_reference_domains (name, description, category, version, metadata) VALUES
('Market & Sales', 'Domain covering market analysis, sales strategy, and customer acquisition', 'Business', '1.0', '{"order": 1}'),
('Product', 'Domain covering product management, development, and lifecycle', 'Business', '1.0', '{"order": 2}'),
('Customer', 'Domain covering customer management, service, and experience', 'Customer', '1.0', '{"order": 3}'),
('Service', 'Domain covering service delivery, assurance, and management', 'Operations', '1.0', '{"order": 4}'),
('Resource', 'Domain covering resource management and orchestration', 'Operations', '1.0', '{"order": 5}'),
('Partner', 'Domain covering partner management and channel operations', 'Business', '1.0', '{"order": 6}')
ON CONFLICT DO NOTHING;

-- Insert TMF Reference Capabilities (sample data)
INSERT INTO tmf_reference_capabilities (name, description, domain_id, category, level, version, metadata) VALUES
('Market Analysis', 'Analyze market trends and customer needs', (SELECT id FROM tmf_reference_domains WHERE name = 'Market & Sales'), 'Analysis', 'Basic', '1.0', '{}'),
('Sales Strategy', 'Develop and execute sales strategies', (SELECT id FROM tmf_reference_domains WHERE name = 'Market & Sales'), 'Strategy', 'Basic', '1.0', '{}'),
('Lead Management', 'Manage sales leads and opportunities', (SELECT id FROM tmf_reference_domains WHERE name = 'Market & Sales'), 'Operations', 'Basic', '1.0', '{}'),
('Product Planning', 'Plan product roadmap and features', (SELECT id FROM tmf_reference_domains WHERE name = 'Product'), 'Planning', 'Basic', '1.0', '{}'),
('Product Development', 'Develop and release products', (SELECT id FROM tmf_reference_domains WHERE name = 'Product'), 'Development', 'Basic', '1.0', '{}'),
('Product Support', 'Provide product support and maintenance', (SELECT id FROM tmf_reference_domains WHERE name = 'Product'), 'Support', 'Basic', '1.0', '{}'),
('Customer Acquisition', 'Acquire and onboard new customers', (SELECT id FROM tmf_reference_domains WHERE name = 'Customer'), 'Acquisition', 'Basic', '1.0', '{}'),
('Customer Service', 'Provide customer service and support', (SELECT id FROM tmf_reference_domains WHERE name = 'Customer'), 'Service', 'Basic', '1.0', '{}'),
('Customer Experience', 'Manage overall customer experience', (SELECT id FROM tmf_reference_domains WHERE name = 'Customer'), 'Experience', 'Basic', '1.0', '{}'),
('Service Delivery', 'Deliver services to customers', (SELECT id FROM tmf_reference_domains WHERE name = 'Service'), 'Delivery', 'Basic', '1.0', '{}'),
('Service Assurance', 'Ensure service quality and availability', (SELECT id FROM tmf_reference_domains WHERE name = 'Service'), 'Assurance', 'Basic', '1.0', '{}'),
('Service Management', 'Manage service lifecycle', (SELECT id FROM tmf_reference_domains WHERE name = 'Service'), 'Management', 'Basic', '1.0', '{}'),
('Resource Planning', 'Plan and allocate resources', (SELECT id FROM tmf_reference_domains WHERE name = 'Resource'), 'Planning', 'Basic', '1.0', '{}'),
('Resource Provisioning', 'Provision and configure resources', (SELECT id FROM tmf_reference_domains WHERE name = 'Resource'), 'Provisioning', 'Basic', '1.0', '{}'),
('Resource Monitoring', 'Monitor resource usage and performance', (SELECT id FROM tmf_reference_domains WHERE name = 'Resource'), 'Monitoring', 'Basic', '1.0', '{}'),
('Partner Recruitment', 'Recruit and onboard partners', (SELECT id FROM tmf_reference_domains WHERE name = 'Partner'), 'Recruitment', 'Basic', '1.0', '{}'),
('Partner Management', 'Manage partner relationships', (SELECT id FROM tmf_reference_domains WHERE name = 'Partner'), 'Management', 'Basic', '1.0', '{}'),
('Channel Operations', 'Manage channel operations and performance', (SELECT id FROM tmf_reference_domains WHERE name = 'Partner'), 'Operations', 'Basic', '1.0', '{}')
ON CONFLICT DO NOTHING;

-- Insert sample filter categories and options
INSERT INTO filter_categories (name, description, metadata) VALUES
('Capability Level', 'Filter by TMF capability level', '{}'),
('Domain Category', 'Filter by TMF domain category', '{}'),
('Priority', 'Filter by requirement priority', '{}')
ON CONFLICT DO NOTHING;

INSERT INTO filter_options (category_id, name, value, description, metadata) VALUES
((SELECT id FROM filter_categories WHERE name = 'Capability Level'), 'Basic', 'basic', 'Basic level capabilities', '{}'),
((SELECT id FROM filter_categories WHERE name = 'Capability Level'), 'Advanced', 'advanced', 'Advanced level capabilities', '{}'),
((SELECT id FROM filter_categories WHERE name = 'Capability Level'), 'Expert', 'expert', 'Expert level capabilities', '{}'),
((SELECT id FROM filter_categories WHERE name = 'Domain Category'), 'Business', 'business', 'Business-oriented domains', '{}'),
((SELECT id FROM filter_categories WHERE name = 'Domain Category'), 'Customer', 'customer', 'Customer-facing domains', '{}'),
((SELECT id FROM filter_categories WHERE name = 'Domain Category'), 'Operations', 'operations', 'Operations-focused domains', '{}'),
((SELECT id FROM filter_categories WHERE name = 'Priority'), 'Low', 'low', 'Low priority items', '{}'),
((SELECT id FROM filter_categories WHERE name = 'Priority'), 'Medium', 'medium', 'Medium priority items', '{}'),
((SELECT id FROM filter_categories WHERE name = 'Priority'), 'High', 'high', 'High priority items', '{}'),
((SELECT id FROM filter_categories WHERE name = 'Priority'), 'Critical', 'critical', 'Critical priority items', '{}')
ON CONFLICT DO NOTHING;

-- Create a sample project for testing
INSERT INTO projects (name, customer, status, duration_months, team_size, metadata) VALUES
('Sample E2E Project', 'Demo Customer', 'In Progress', 12, 25, '{"description": "Sample project for testing Supabase integration", "type": "demo"}')
ON CONFLICT DO NOTHING;
