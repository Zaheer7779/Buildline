-- ============================================================================
-- BUILDLINE: Seed Data
-- Migration 003: Sample data for testing and development
-- ============================================================================

-- Note: This is for development only. Remove in production.

-- Insert sample locations
INSERT INTO locations (name, code, type, address) VALUES
  ('Main Warehouse', 'WH001', 'warehouse', '123 Warehouse Road, Industrial Area'),
  ('Downtown Store', 'ST001', 'store', '456 Main Street, Downtown'),
  ('Mall Store', 'ST002', 'store', '789 Shopping Mall, North District');

-- Insert sample users (requires Supabase Auth setup)
-- These are example IDs - in real setup, users are created via Supabase Auth
-- Then linked to profiles

-- Example: Create user profiles after auth users exist
COMMENT ON TABLE user_profiles IS 'After Supabase Auth creates users, insert their profiles here';

-- Sample assembly journey data structure (commented out - requires actual user IDs)
/*
INSERT INTO assembly_journeys (
  barcode,
  model_sku,
  frame_number,
  current_status,
  current_location_id,
  grn_reference
) VALUES
  ('BK2024-001', 'HERO-SPRINT-24', 'FRAME001', 'inwarded', (SELECT id FROM locations WHERE code = 'WH001'), 'GRN-2024-001'),
  ('BK2024-002', 'HERO-SPRINT-24', 'FRAME002', 'inwarded', (SELECT id FROM locations WHERE code = 'WH001'), 'GRN-2024-001'),
  ('BK2024-003', 'FIREFOX-ROAD-26', 'FRAME003', 'inwarded', (SELECT id FROM locations WHERE code = 'ST001'), 'GRN-2024-002');
*/
