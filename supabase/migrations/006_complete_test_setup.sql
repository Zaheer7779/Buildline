-- ============================================================================
-- COMPLETE TEST SETUP - Creates everything you need for demo
-- ============================================================================

-- Step 1: Check existing users
SELECT 'EXISTING USERS:' as info;
SELECT email, full_name, role FROM user_profiles;

-- Step 2: Create sample bikes for testing
-- Make sure locations exist first
SELECT 'CREATING TEST BIKES...' as info;

-- Get warehouse location ID
DO $$
DECLARE
  v_warehouse_id UUID;
BEGIN
  SELECT id INTO v_warehouse_id FROM locations WHERE code = 'WH001' LIMIT 1;

  IF v_warehouse_id IS NULL THEN
    RAISE EXCEPTION 'Warehouse location not found. Please run migration 003 first.';
  END IF;

  -- Create 3 test bikes in "inwarded" status
  INSERT INTO assembly_journeys (
    barcode,
    model_sku,
    frame_number,
    current_status,
    current_location_id,
    grn_reference,
    checklist
  ) VALUES
    ('BIKE-TEST-001', 'HERO-SPRINT-24-RED', 'FRAME-001', 'inwarded', v_warehouse_id, 'GRN-2024-001', '{"tyres": false, "brakes": false, "gears": false}'::jsonb),
    ('BIKE-TEST-002', 'HERO-SPRINT-24-BLUE', 'FRAME-002', 'inwarded', v_warehouse_id, 'GRN-2024-001', '{"tyres": false, "brakes": false, "gears": false}'::jsonb),
    ('BIKE-TEST-003', 'FIREFOX-ROAD-26', 'FRAME-003', 'inwarded', v_warehouse_id, 'GRN-2024-002', '{"tyres": false, "brakes": false, "gears": false}'::jsonb)
  ON CONFLICT (barcode) DO NOTHING;

  RAISE NOTICE 'Test bikes created successfully!';
END $$;

-- Step 3: Show summary
SELECT 'SETUP COMPLETE!' as info;

SELECT
  '📊 SUMMARY:' as summary,
  (SELECT COUNT(*) FROM user_profiles) as total_users,
  (SELECT COUNT(*) FROM locations) as total_locations,
  (SELECT COUNT(*) FROM assembly_journeys) as total_bikes;

-- Show all bikes
SELECT
  '🚲 TEST BIKES:' as section,
  barcode,
  model_sku,
  current_status,
  created_at
FROM assembly_journeys
ORDER BY created_at DESC;

-- Next steps message
SELECT '
✅ SETUP COMPLETE!

Next steps:
1. Login as SUPERVISOR (supervisor@test.com / Test123!)
2. Go to "Assign Bikes" tab
3. You will see 3 bikes ready to assign
4. Select a bike and assign to technician
5. Then login as TECHNICIAN to complete assembly
6. Then login as QC to review and pass

' as next_steps;
