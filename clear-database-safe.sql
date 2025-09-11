-- Safe Database Clear Script
-- This script clears data in a controlled manner with verification steps

-- Step 1: Check current data counts BEFORE clearing
SELECT
  'projects' as table_name,
  COUNT(*) as record_count
FROM projects
UNION ALL
SELECT 'tmf_reference_domains', COUNT(*) FROM tmf_reference_domains
UNION ALL
SELECT 'tmf_reference_capabilities', COUNT(*) FROM tmf_reference_capabilities
UNION ALL
SELECT 'user_domains', COUNT(*) FROM user_domains
UNION ALL
SELECT 'user_capabilities', COUNT(*) FROM user_capabilities
UNION ALL
SELECT 'specsync_items', COUNT(*) FROM specsync_items
UNION ALL
SELECT 'blue_dolphin_objects', COUNT(*) FROM blue_dolphin_objects
UNION ALL
SELECT 'cetv22_data', COUNT(*) FROM cetv22_data
UNION ALL
SELECT 'work_packages', COUNT(*) FROM work_packages
UNION ALL
SELECT 'bill_of_materials', COUNT(*) FROM bill_of_materials
UNION ALL
SELECT 'integration_configs', COUNT(*) FROM integration_configs
UNION ALL
SELECT 'user_preferences', COUNT(*) FROM user_preferences
UNION ALL
SELECT 'filter_categories', COUNT(*) FROM filter_categories
UNION ALL
SELECT 'filter_options', COUNT(*) FROM filter_options
ORDER BY table_name;

-- Step 2: Clear tables (commented out by default for safety)
-- Uncomment the lines below only if you want to clear the data

/*
-- Clear tables in correct order (child tables first)
DELETE FROM filter_options;
DELETE FROM filter_categories;
DELETE FROM user_preferences;
DELETE FROM integration_configs;
DELETE FROM bill_of_materials;
DELETE FROM work_packages;
DELETE FROM cetv22_data;
DELETE FROM blue_dolphin_objects;
DELETE FROM specsync_items;
DELETE FROM user_capabilities;
DELETE FROM user_domains;
DELETE FROM tmf_reference_capabilities;
DELETE FROM tmf_reference_domains;
DELETE FROM projects;

-- Reset sequences
ALTER SEQUENCE IF EXISTS projects_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS tmf_reference_domains_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS tmf_reference_capabilities_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS user_domains_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS user_capabilities_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS specsync_items_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS blue_dolphin_objects_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS cetv22_data_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS work_packages_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS bill_of_materials_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS integration_configs_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS user_preferences_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS filter_categories_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS filter_options_id_seq RESTART WITH 1;
*/

-- Step 3: Verify data is cleared (run this after uncommenting and running Step 2)
SELECT
  'projects' as table_name,
  COUNT(*) as record_count
FROM projects
UNION ALL
SELECT 'tmf_reference_domains', COUNT(*) FROM tmf_reference_domains
UNION ALL
SELECT 'tmf_reference_capabilities', COUNT(*) FROM tmf_reference_capabilities
UNION ALL
SELECT 'user_domains', COUNT(*) FROM user_domains
UNION ALL
SELECT 'user_capabilities', COUNT(*) FROM user_capabilities
UNION ALL
SELECT 'specsync_items', COUNT(*) FROM specsync_items
UNION ALL
SELECT 'blue_dolphin_objects', COUNT(*) FROM blue_dolphin_objects
UNION ALL
SELECT 'cetv22_data', COUNT(*) FROM cetv22_data
UNION ALL
SELECT 'work_packages', COUNT(*) FROM work_packages
UNION ALL
SELECT 'bill_of_materials', COUNT(*) FROM bill_of_materials
UNION ALL
SELECT 'integration_configs', COUNT(*) FROM integration_configs
UNION ALL
SELECT 'user_preferences', COUNT(*) FROM user_preferences
UNION ALL
SELECT 'filter_categories', COUNT(*) FROM filter_categories
UNION ALL
SELECT 'filter_options', COUNT(*) FROM filter_options
ORDER BY table_name;
