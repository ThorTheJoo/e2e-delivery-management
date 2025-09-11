# Supabase Environment Setup Guide

## Issue Identified
The "Service role client not available" error occurs because your Supabase environment variables are not configured.

## Required Environment Variables

Create a `.env.local` file in your project root with the following content:

```bash
# Supabase Configuration
# Replace these placeholder values with your actual Supabase project credentials

# Your Supabase project URL (found in Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Your Supabase anon key (found in Settings > API)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Service role key for server-side operations (found in Settings > API)
# WARNING: Never expose this key in client-side code!
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Data source configuration
# Set to 'supabase' to use Supabase database, 'local' to use local storage
NEXT_PUBLIC_DATA_SOURCE=supabase
```

## How to Get Your Supabase Credentials

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project** (or create one if you haven't)
3. **Go to Settings > API**
4. **Copy the following values**:
   - **Project URL**: Copy the entire URL (e.g., `https://abcdefghijklmnop.supabase.co`)
   - **anon public key**: Copy the `anon` key
   - **service_role key**: Copy the `service_role` key (keep this secret!)

## Setting Up Your Supabase Project

If you haven't created a Supabase project yet:

1. **Create a new project** at https://supabase.com/dashboard
2. **Choose your organization** and project name
3. **Select a database password** (save this securely)
4. **Choose your region** (closest to your users)
5. **Wait for project creation** (usually takes 2-3 minutes)

## Database Schema Setup

Once your project is created, you'll need to create the required tables. The application expects these tables:

### Core Tables
- `projects` - Project management
- `tmf_reference_domains` - TMF ODA reference domains
- `tmf_reference_capabilities` - TMF ODA reference capabilities
- `user_domains` - User-selected domains
- `user_capabilities` - User-selected capabilities
- `specsync_items` - SpecSync import data
- `blue_dolphin_objects` - Blue Dolphin enterprise objects
- `cetv22_data` - CETv22 analysis data
- `work_packages` - Project work breakdown
- `bill_of_materials` - Resource tracking

### SQL Schema (Run in Supabase SQL Editor)

```sql
-- Projects table
CREATE TABLE projects (
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

-- TMF Reference Domains
CREATE TABLE tmf_reference_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- TMF Reference Capabilities
CREATE TABLE tmf_reference_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  domain_id UUID REFERENCES tmf_reference_domains(id),
  category TEXT,
  level TEXT DEFAULT 'Basic',
  version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- User Domains
CREATE TABLE user_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
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

-- User Capabilities
CREATE TABLE user_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES user_domains(id),
  name TEXT NOT NULL,
  description TEXT,
  reference_capability_id UUID REFERENCES tmf_reference_capabilities(id),
  is_selected BOOLEAN DEFAULT FALSE,
  requirement_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- SpecSync Items
CREATE TABLE specsync_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  requirement_id TEXT NOT NULL,
  rephrased_requirement_id TEXT,
  source_requirement_id TEXT,
  function_name TEXT,
  capability TEXT,
  usecase1 TEXT,
  usecase2 TEXT,
  usecase3 TEXT,
  description TEXT,
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Identified',
  effort_ba NUMERIC DEFAULT 0,
  effort_sa NUMERIC DEFAULT 0,
  effort_dev NUMERIC DEFAULT 0,
  effort_qa NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Blue Dolphin Objects
CREATE TABLE blue_dolphin_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  blue_dolphin_id TEXT,
  title TEXT,
  object_type TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- CETv22 Data
CREATE TABLE cetv22_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
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

-- Work Packages
CREATE TABLE work_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
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

-- Bill of Materials
CREATE TABLE bill_of_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
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

-- Integration Configs
CREATE TABLE integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  integration_type TEXT NOT NULL,
  config_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  config_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- User Preferences
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  preference_key TEXT NOT NULL,
  preference_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
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

-- Create basic RLS policies (allow all operations for now - customize based on your auth requirements)
CREATE POLICY "Allow all operations on projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all operations on tmf_reference_domains" ON tmf_reference_domains FOR ALL USING (true);
CREATE POLICY "Allow all operations on tmf_reference_capabilities" ON tmf_reference_capabilities FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_domains" ON user_domains FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_capabilities" ON user_capabilities FOR ALL USING (true);
CREATE POLICY "Allow all operations on specsync_items" ON specsync_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on blue_dolphin_objects" ON blue_dolphin_objects FOR ALL USING (true);
CREATE POLICY "Allow all operations on cetv22_data" ON cetv22_data FOR ALL USING (true);
CREATE POLICY "Allow all operations on work_packages" ON work_packages FOR ALL USING (true);
CREATE POLICY "Allow all operations on bill_of_materials" ON bill_of_materials FOR ALL USING (true);
CREATE POLICY "Allow all operations on integration_configs" ON integration_configs FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_preferences" ON user_preferences FOR ALL USING (true);
```

## Next Steps

1. **Create your `.env.local` file** with the credentials above
2. **Create a Supabase project** if you haven't already
3. **Run the SQL schema** in your Supabase SQL Editor (see `supabase-schema.sql`)
4. **Test your setup** using the test script
5. **Restart your development server**: `npm run dev`
6. **Test the connection** using the Supabase Configuration tab in your app

## Testing the Setup

### Automated Testing
Run the comprehensive test script to verify your setup:

```bash
# Install dotenv if needed (for .env.local support)
npm install dotenv --save-dev

# Run the test script
node test-supabase-connection.js
```

The test script will check:
- ✅ Environment variables are properly configured
- ✅ Supabase connection works with anon key
- ✅ Service role key works for server operations
- ✅ All required tables exist
- ✅ Basic CRUD operations function correctly

### Manual Testing

1. **Start your application**: `npm run dev`
2. **Navigate to the Supabase Configuration section**
3. **Click "Refresh Preview"** to test the connection
4. **Try the "Export SpecSync Now" feature** once configured

### Troubleshooting Test Results

**If environment variables fail:**
- Ensure `.env.local` exists in your project root
- Verify all placeholder values are replaced with real Supabase credentials
- Restart your terminal/command prompt after setting environment variables

**If connection fails:**
- Check your Supabase project URL format
- Verify your anon key is correct
- Ensure your Supabase project is active (not paused)

**If service role fails:**
- Double-check your service role key (it's different from the anon key)
- Service role key should never be exposed in client-side code
- Only use service role for server-side operations

**If tables don't exist:**
- Run the `supabase-schema.sql` script in your Supabase SQL Editor
- Check that all tables were created successfully
- Verify table names match exactly (case-sensitive)

**If CRUD operations fail:**
- Check Row Level Security (RLS) policies
- Ensure your user has proper permissions
- Verify table structure matches the schema

## Troubleshooting

- **Still getting "Service role client not available"**: Make sure your `SUPABASE_SERVICE_ROLE_KEY` is correctly set in `.env.local`
- **Connection fails**: Verify your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- **Tables don't exist**: Make sure you've run the SQL schema in Supabase
- **RLS issues**: The current policies allow all operations - you may need to customize them for production

## Security Notes

- Never commit your `.env.local` file to version control
- Keep your `SUPABASE_SERVICE_ROLE_KEY` secret and only use it server-side
- Consider implementing proper authentication and RLS policies for production use
