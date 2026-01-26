-- ============================================================================
-- CLEANUP: Drop existing types if they exist
-- Run this FIRST if you're getting "type already exists" errors
-- ============================================================================

-- Drop existing types (if they exist)
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS assembly_status CASCADE;
DROP TYPE IF EXISTS qc_result CASCADE;
DROP TYPE IF EXISTS location_type CASCADE;

-- Drop existing tables (if they exist)
DROP TABLE IF EXISTS qc_checklists CASCADE;
DROP TABLE IF EXISTS assembly_location_history CASCADE;
DROP TABLE IF EXISTS assembly_status_history CASCADE;
DROP TABLE IF EXISTS assembly_journeys CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop existing views (if they exist)
DROP VIEW IF EXISTS kanban_board CASCADE;
DROP VIEW IF EXISTS technician_workload CASCADE;
DROP VIEW IF EXISTS daily_dashboard CASCADE;
DROP VIEW IF EXISTS qc_failure_analysis CASCADE;
DROP VIEW IF EXISTS bottleneck_report CASCADE;

-- Drop existing functions (if they exist)
DROP FUNCTION IF EXISTS can_invoice_item(TEXT) CASCADE;
DROP FUNCTION IF EXISTS assign_to_technician(TEXT, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS start_assembly(TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS complete_assembly(TEXT, UUID, JSONB) CASCADE;
DROP FUNCTION IF EXISTS submit_qc_result(TEXT, UUID, TEXT, TEXT, TEXT[]) CASCADE;
DROP FUNCTION IF EXISTS get_technician_queue(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS log_status_change() CASCADE;
DROP FUNCTION IF EXISTS log_location_change() CASCADE;

-- Success message
SELECT 'Cleanup completed successfully. Now run 001_initial_schema.sql' as message;
