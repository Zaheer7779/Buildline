-- Check the current status of DEMO-BIKE-001
SELECT
  barcode,
  model_sku,
  current_status,
  checklist,
  started_at,
  completed_at,
  qc_status,
  technician_id,
  to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as last_updated
FROM assembly_journeys
WHERE barcode = 'DEMO-BIKE-001';

-- Check all bikes and their statuses
SELECT
  barcode,
  model_sku,
  current_status,
  checklist,
  completed_at IS NOT NULL as has_completed_time
FROM assembly_journeys
ORDER BY created_at DESC;

-- Check status history to see what transitions happened
SELECT
  barcode,
  from_status,
  to_status,
  to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as transition_time
FROM assembly_status_history ash
JOIN assembly_journeys aj ON ash.journey_id = aj.id
WHERE aj.barcode = 'DEMO-BIKE-001'
ORDER BY ash.created_at DESC;
