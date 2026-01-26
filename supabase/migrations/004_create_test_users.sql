-- ============================================================================
-- BUILDLINE: Create Test User Profiles
-- After creating users in Supabase Auth, run this to add their profiles
-- ============================================================================

-- INSTRUCTIONS:
-- 1. Go to Supabase Auth Dashboard
-- 2. Create these 3 users (with "Auto Confirm Email" checked):
--    - tech@test.com / Test123!
--    - supervisor@test.com / Test123!
--    - qc@test.com / Test123!
-- 3. Copy each user's UUID
-- 4. Replace the UUIDs below with actual ones
-- 5. Run this script

-- Replace these UUIDs with actual ones from Supabase Auth
INSERT INTO user_profiles (id, email, full_name, role, is_active) VALUES
  ('TECHNICIAN-UUID-HERE', 'tech@test.com', 'John Technician', 'technician', true),
  ('SUPERVISOR-UUID-HERE', 'supervisor@test.com', 'Jane Supervisor', 'supervisor', true),
  ('QC-PERSON-UUID-HERE', 'qc@test.com', 'Bob QC Inspector', 'qc_person', true);

-- Verify the insert
SELECT email, full_name, role FROM user_profiles ORDER BY role;
