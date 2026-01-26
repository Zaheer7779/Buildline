-- ============================================================================
-- CHECK BIKE STATUS - Run this NOW to diagnose the issue
-- ============================================================================

-- Check DEMO-BIKE-001 current state
SELECT
  barcode,
  current_status,
  technician_id,
  checklist,
  started_at,
  completed_at,
  to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created,
  to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as last_updated
FROM assembly_journeys
WHERE barcode = 'DEMO-BIKE-001';

-- Check technician details
SELECT
  id,
  email,
  full_name,
  role
FROM user_profiles
WHERE email = 'tech@test.com';

-- Check status history to see all transitions
SELECT
  from_status,
  to_status,
  to_char(ash.created_at, 'YYYY-MM-DD HH24:MI:SS') as when_changed,
  changed_by_id
FROM assembly_status_history ash
JOIN assembly_journeys aj ON ash.journey_id = aj.id
WHERE aj.barcode = 'DEMO-BIKE-001'
ORDER BY ash.created_at DESC
LIMIT 5;

/*
EXPECTED RESULTS:
=================

If everything worked correctly, you should see:
- current_status = 'in_progress'  (NOT 'assigned')
- technician_id = [some UUID matching tech@test.com]
- started_at = [some timestamp, NOT null]
- checklist = {"tyres": true/false, "brakes": true/false, "gears": true/false}

If you see:
- current_status = 'assigned'  <-- THIS IS THE PROBLEM
- started_at = null            <-- Bike never transitioned to in_progress

Then run this fix:
*/

-- ============================================================================
-- FIX: Force bike to 'in_progress' status
-- ============================================================================
-- ONLY RUN THIS IF current_status = 'assigned'

-- Get technician ID first
DO $$
DECLARE
  v_tech_id UUID;
BEGIN
  SELECT id INTO v_tech_id FROM user_profiles WHERE email = 'tech@test.com';

  UPDATE assembly_journeys
  SET
    current_status = 'in_progress',
    started_at = NOW(),
    technician_id = v_tech_id
  WHERE barcode = 'DEMO-BIKE-001';

  RAISE NOTICE 'Bike updated to in_progress status';
END $$;

-- Verify the fix
SELECT
  barcode,
  current_status,
  technician_id,
  started_at
FROM assembly_journeys
WHERE barcode = 'DEMO-BIKE-001';
 