-- Fix for SpecSync export upsert error
-- Run this in your Supabase SQL Editor to add the required unique constraint

-- Add unique constraint for upsert operations on specsync_items table
ALTER TABLE specsync_items
ADD CONSTRAINT IF NOT EXISTS specsync_items_project_req_unique
UNIQUE (project_id, requirement_id);

-- Alternative: If you prefer to drop and recreate the constraint
-- (uncomment the lines below if the above fails)

-- ALTER TABLE specsync_items DROP CONSTRAINT IF EXISTS specsync_items_project_req_unique;
-- ALTER TABLE specsync_items ADD CONSTRAINT specsync_items_project_req_unique UNIQUE (project_id, requirement_id);
