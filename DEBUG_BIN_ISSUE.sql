-- ============================================================================
-- DEBUG: Why Bin is Not Showing in Technician Queue
-- ============================================================================

-- Step 1: Check if get_technician_queue function has bin_location
SELECT
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_technician_queue';

-- EXPECTED: Should show "bin_location jsonb" in the return_type
-- IF NOT: Run migration 009

-- ============================================================================

-- Step 2: Check if any bikes have bin_location assigned
SELECT
  aj.barcode,
  aj.model_sku,
  aj.current_status,
  aj.bin_location_id,
  b.bin_code,
  b.bin_name
FROM assembly_journeys aj
LEFT JOIN bins b ON aj.bin_location_id = b.id
WHERE aj.current_status IN ('assigned', 'in_progress')
ORDER BY aj.created_at DESC
LIMIT 5;

-- EXPECTED: Should show bikes with bin_code
-- IF bin_location_id is NULL: Need to inward new bikes with bin assignment

-- ============================================================================

-- Step 3: Test the get_technician_queue function directly
-- Replace 'TECH-UUID-HERE' with actual technician UUID
SELECT * FROM get_technician_queue('TECH-UUID-HERE'::uuid);

-- To get actual technician UUID, run this first:
SELECT id, email, full_name FROM user_profiles WHERE role = 'technician';

-- EXPECTED: Should show bin_location column with JSON data like:
-- {"id": "...", "bin_code": "A1-01", "bin_name": "Rack A1-01", "zone": "Zone A"}

-- ============================================================================

-- Step 4: Count total bins
SELECT COUNT(*) as total_bins FROM bins;

-- EXPECTED: Should be 55+ bins

-- ============================================================================

-- Step 5: Check bins availability
SELECT
  l.name as location,
  COUNT(b.id) as total_bins,
  SUM(CASE WHEN b.current_occupancy < b.capacity THEN 1 ELSE 0 END) as available_bins
FROM bins b
JOIN locations l ON b.location_id = l.id
WHERE b.is_active = true
GROUP BY l.id, l.name
ORDER BY l.name;

-- ============================================================================
-- TROUBLESHOOTING GUIDE
-- ============================================================================

/*
SCENARIO 1: Step 1 returns NO bin_location column
   → Run migration 009 to update the function

SCENARIO 2: Step 2 shows all bin_location_id as NULL
   → No bikes have been assigned bins yet
   → Inward new bikes WITH bin location selected

SCENARIO 3: Step 3 shows bin_location as NULL (but Step 2 shows bin_code)
   → The function is not working correctly
   → Re-run migration 009

SCENARIO 4: Everything shows data but frontend doesn't display it
   → Backend issue: Check API response
   → Frontend issue: Check component rendering
   → Run this in backend logs to see actual API response
*/
