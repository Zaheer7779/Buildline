-- ============================================================================
-- VERIFY BIN LOCATION SETUP
-- Run this to check if bins are set up correctly
-- ============================================================================

-- 1. Check if bins table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'bins'
) as bins_table_exists;

-- 2. Check if bin_location_id column exists in assembly_journeys
SELECT EXISTS (
   SELECT FROM information_schema.columns
   WHERE table_schema = 'public'
   AND table_name = 'assembly_journeys'
   AND column_name = 'bin_location_id'
) as bin_location_id_exists;

-- 3. Check current get_technician_queue function signature
SELECT
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_columns
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_technician_queue';

-- 4. Count total bins
SELECT COUNT(*) as total_bins FROM bins;

-- 5. Show sample bins
SELECT
  b.bin_code,
  b.bin_name,
  l.name as location_name,
  b.capacity,
  b.current_occupancy
FROM bins b
JOIN locations l ON b.location_id = l.id
LIMIT 5;

/*
EXPECTED RESULTS:
=================
1. bins_table_exists should return TRUE
2. bin_location_id_exists should return TRUE
3. get_technician_queue should show bin_location JSONB in return columns
4. total_bins should show 55+ bins (50 for warehouse, 5+ for stores)
5. Should show sample bins like A1-01, A1-02, etc.

If any of these fail, you need to run the migrations!
*/
