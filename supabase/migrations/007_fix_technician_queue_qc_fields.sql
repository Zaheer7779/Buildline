-- ============================================================================
-- FIX: Add QC fields to get_technician_queue function
-- This allows technicians to see why a bike failed QC and came back for rework
-- ============================================================================

CREATE OR REPLACE FUNCTION get_technician_queue(p_technician_id UUID)
RETURNS TABLE(
  barcode TEXT,
  model_sku TEXT,
  current_status assembly_status,
  priority BOOLEAN,
  checklist JSONB,
  assigned_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  qc_status qc_result,
  qc_failure_reason TEXT,
  rework_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    aj.barcode,
    aj.model_sku,
    aj.current_status,
    aj.priority,
    aj.checklist,
    aj.assigned_at,
    aj.started_at,
    aj.qc_status,
    aj.qc_failure_reason,
    aj.rework_count
  FROM assembly_journeys aj
  WHERE aj.technician_id = p_technician_id
    AND aj.current_status IN ('assigned', 'in_progress')
  ORDER BY aj.priority DESC, aj.assigned_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the function was updated
SELECT
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_technician_queue';
