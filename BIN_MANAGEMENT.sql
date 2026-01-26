-- ============================================================================
-- BIN LOCATION MANAGEMENT - Helpful SQL Queries
-- ============================================================================

-- ============================================================================
-- VIEW BIN INFORMATION
-- ============================================================================

-- View all bins with occupancy
SELECT
  l.name as location,
  b.bin_code,
  b.bin_name,
  b.zone,
  b.current_occupancy,
  b.capacity,
  ROUND((b.current_occupancy::numeric / b.capacity * 100), 1) as occupancy_percent,
  CASE
    WHEN b.current_occupancy >= b.capacity THEN 'FULL'
    WHEN b.current_occupancy >= (b.capacity * 0.8) THEN 'ALMOST FULL'
    WHEN b.current_occupancy > 0 THEN 'IN USE'
    ELSE 'EMPTY'
  END as status
FROM bins b
JOIN locations l ON b.location_id = l.id
WHERE b.is_active = true
ORDER BY l.name, b.bin_code;

-- View bins by zone
SELECT
  zone,
  COUNT(*) as total_bins,
  SUM(capacity) as total_capacity,
  SUM(current_occupancy) as total_occupied,
  ROUND(AVG(current_occupancy::numeric / capacity * 100), 1) as avg_occupancy_percent
FROM bins
WHERE is_active = true
GROUP BY zone
ORDER BY zone;

-- Find cycles in specific bin
SELECT
  aj.barcode,
  aj.model_sku,
  aj.current_status,
  b.bin_code,
  l.name as location
FROM assembly_journeys aj
JOIN bins b ON aj.bin_location_id = b.id
JOIN locations l ON b.location_id = l.id
WHERE b.bin_code = 'A1-01';  -- Change bin code here

-- Find empty bins
SELECT
  l.name as location,
  b.bin_code,
  b.bin_name,
  b.zone,
  b.capacity
FROM bins b
JOIN locations l ON b.location_id = l.id
WHERE b.current_occupancy = 0
  AND b.is_active = true
ORDER BY l.name, b.bin_code;

-- Find full bins
SELECT
  l.name as location,
  b.bin_code,
  b.bin_name,
  b.zone,
  b.capacity
FROM bins b
JOIN locations l ON b.location_id = l.id
WHERE b.current_occupancy >= b.capacity
  AND b.is_active = true
ORDER BY l.name, b.bin_code;

-- ============================================================================
-- ADD NEW BINS
-- ============================================================================

-- Add single bin
INSERT INTO bins (location_id, bin_code, bin_name, zone, capacity)
VALUES (
  (SELECT id FROM locations WHERE code = 'WH001'),  -- Change location code
  'D1-01',           -- Bin code
  'Rack D1-01',      -- Bin name
  'Zone D',          -- Zone
  5                  -- Capacity
);

-- Add multiple bins for a zone
INSERT INTO bins (location_id, bin_code, bin_name, zone, capacity)
SELECT
  id,
  'D1-' || LPAD(n::text, 2, '0'),
  'Rack D1-' || LPAD(n::text, 2, '0'),
  'Zone D',
  5
FROM locations, generate_series(1, 10) n
WHERE code = 'WH001';

-- ============================================================================
-- UPDATE BINS
-- ============================================================================

-- Change bin capacity
UPDATE bins
SET capacity = 10
WHERE bin_code = 'A1-01';

-- Rename bin
UPDATE bins
SET bin_name = 'Premium Storage Rack A1-01'
WHERE bin_code = 'A1-01';

-- Move bin to different zone
UPDATE bins
SET zone = 'Zone Premium'
WHERE bin_code IN ('A1-01', 'A1-02', 'A1-03');

-- Deactivate bin (soft delete)
UPDATE bins
SET is_active = false
WHERE bin_code = 'A1-01';

-- Reactivate bin
UPDATE bins
SET is_active = true
WHERE bin_code = 'A1-01';

-- ============================================================================
-- FIX OCCUPANCY ISSUES
-- ============================================================================

-- Recalculate occupancy for all bins
UPDATE bins b
SET current_occupancy = (
  SELECT COUNT(*)
  FROM assembly_journeys aj
  WHERE aj.bin_location_id = b.id
);

-- Recalculate occupancy for specific bin
UPDATE bins b
SET current_occupancy = (
  SELECT COUNT(*)
  FROM assembly_journeys aj
  WHERE aj.bin_location_id = b.id
)
WHERE b.bin_code = 'A1-01';

-- Find bins with incorrect occupancy
SELECT
  b.bin_code,
  b.current_occupancy as recorded_occupancy,
  COUNT(aj.id) as actual_occupancy,
  b.current_occupancy - COUNT(aj.id) as difference
FROM bins b
LEFT JOIN assembly_journeys aj ON aj.bin_location_id = b.id
GROUP BY b.id, b.bin_code, b.current_occupancy
HAVING b.current_occupancy != COUNT(aj.id)
ORDER BY ABS(b.current_occupancy - COUNT(aj.id)) DESC;

-- ============================================================================
-- MOVE CYCLES BETWEEN BINS
-- ============================================================================

-- Move single cycle to different bin
UPDATE assembly_journeys
SET bin_location_id = (SELECT id FROM bins WHERE bin_code = 'B1-05')
WHERE barcode = 'DEMO-BIKE-001';

-- Move all cycles from one bin to another
UPDATE assembly_journeys
SET bin_location_id = (SELECT id FROM bins WHERE bin_code = 'B1-01')
WHERE bin_location_id = (SELECT id FROM bins WHERE bin_code = 'A1-01');

-- Remove cycle from bin (clear bin assignment)
UPDATE assembly_journeys
SET bin_location_id = NULL
WHERE barcode = 'DEMO-BIKE-001';

-- ============================================================================
-- REPORTING
-- ============================================================================

-- Bin utilization report
SELECT
  l.name as location,
  COUNT(b.id) as total_bins,
  SUM(b.capacity) as total_capacity,
  SUM(b.current_occupancy) as total_used,
  SUM(b.capacity) - SUM(b.current_occupancy) as available_space,
  ROUND(AVG(b.current_occupancy::numeric / b.capacity * 100), 1) as avg_utilization
FROM bins b
JOIN locations l ON b.location_id = l.id
WHERE b.is_active = true
GROUP BY l.id, l.name
ORDER BY l.name;

-- Top 10 most utilized bins
SELECT
  b.bin_code,
  b.bin_name,
  l.name as location,
  b.current_occupancy,
  b.capacity,
  ROUND((b.current_occupancy::numeric / b.capacity * 100), 1) as utilization_percent
FROM bins b
JOIN locations l ON b.location_id = l.id
WHERE b.is_active = true
ORDER BY utilization_percent DESC
LIMIT 10;

-- Bins needing attention (almost full or empty)
SELECT
  l.name as location,
  b.bin_code,
  b.current_occupancy,
  b.capacity,
  CASE
    WHEN b.current_occupancy = 0 THEN 'EMPTY - Consider deactivating'
    WHEN b.current_occupancy >= b.capacity THEN 'FULL - Stop assigning'
    WHEN b.current_occupancy >= (b.capacity * 0.8) THEN 'ALMOST FULL - Limited space'
    ELSE 'OK'
  END as alert
FROM bins b
JOIN locations l ON b.location_id = l.id
WHERE b.is_active = true
  AND (
    b.current_occupancy = 0
    OR b.current_occupancy >= (b.capacity * 0.8)
  )
ORDER BY b.current_occupancy DESC;

-- Cycle location report (which bin is each cycle in?)
SELECT
  aj.barcode,
  aj.model_sku,
  aj.current_status,
  l.name as location,
  COALESCE(b.bin_code, 'NO BIN ASSIGNED') as bin_code,
  b.zone
FROM assembly_journeys aj
LEFT JOIN locations l ON aj.current_location_id = l.id
LEFT JOIN bins b ON aj.bin_location_id = b.id
WHERE aj.current_status NOT IN ('ready_for_sale')  -- Exclude sold bikes
ORDER BY l.name, b.bin_code, aj.barcode;

-- ============================================================================
-- BULK OPERATIONS
-- ============================================================================

-- Increase capacity for all warehouse bins
UPDATE bins
SET capacity = capacity + 2
WHERE location_id IN (SELECT id FROM locations WHERE type = 'warehouse');

-- Add notes to bins in specific zone
UPDATE bins
SET notes = 'Reorganized on 2026-01-23'
WHERE zone = 'Zone A';

-- Delete bins (CAUTION: Only if no cycles assigned)
DELETE FROM bins
WHERE bin_code = 'OLD-BIN-01'
  AND current_occupancy = 0;

-- ============================================================================
-- AUDIT & CLEANUP
-- ============================================================================

-- Find cycles without bin assignment
SELECT
  aj.barcode,
  aj.model_sku,
  aj.current_status,
  l.name as location
FROM assembly_journeys aj
LEFT JOIN locations l ON aj.current_location_id = l.id
WHERE aj.bin_location_id IS NULL
  AND aj.current_status IN ('inwarded', 'assigned', 'in_progress')
ORDER BY aj.inwarded_at;

-- Find bins with no location
SELECT *
FROM bins
WHERE location_id IS NULL;

-- Find duplicate bin codes (should not exist)
SELECT bin_code, location_id, COUNT(*)
FROM bins
GROUP BY bin_code, location_id
HAVING COUNT(*) > 1;

-- ============================================================================
-- PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Rebuild indexes on bins table
REINDEX TABLE bins;

-- Analyze table for query optimization
ANALYZE bins;

-- Vacuum table to reclaim space
VACUUM ANALYZE bins;
