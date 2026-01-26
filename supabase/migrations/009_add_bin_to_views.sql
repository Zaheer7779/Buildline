-- ============================================================================
-- BUILDLINE: Add bin location to views and functions
-- Migration 009: Update views to include bin location information
-- ============================================================================

-- Drop existing function first (required when changing return type)
DROP FUNCTION IF EXISTS get_technician_queue(UUID);

-- Update get_technician_queue to include bin location
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
  rework_count INTEGER,
  bin_location JSONB
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
    aj.rework_count,
    CASE
      WHEN b.id IS NOT NULL THEN
        jsonb_build_object(
          'id', b.id,
          'bin_code', b.bin_code,
          'bin_name', b.bin_name,
          'zone', b.zone
        )
      ELSE NULL
    END as bin_location
  FROM assembly_journeys aj
  LEFT JOIN bins b ON aj.bin_location_id = b.id
  WHERE aj.technician_id = p_technician_id
    AND aj.current_status IN ('assigned', 'in_progress')
  ORDER BY aj.priority DESC, aj.assigned_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing view first (required when changing column structure)
DROP VIEW IF EXISTS kanban_board;

-- Update kanban_board view to include bin location
CREATE OR REPLACE VIEW kanban_board AS
SELECT
  aj.id,
  aj.barcode,
  aj.model_sku,
  aj.frame_number,
  aj.current_status,
  aj.priority,
  aj.checklist,
  aj.parts_missing,
  aj.damage_reported,
  aj.rework_count,
  aj.created_at,
  aj.started_at,
  aj.completed_at,
  aj.qc_status,

  -- Location info
  l.name as location_name,
  l.code as location_code,
  l.type as location_type,

  -- Bin location info
  b.bin_code,
  b.bin_name,
  b.zone as bin_zone,

  -- People
  t.full_name as technician_name,
  t.email as technician_email,
  s.full_name as supervisor_name,
  q.full_name as qc_person_name,

  -- Time calculations
  EXTRACT(EPOCH FROM (NOW() - aj.updated_at)) / 3600 as hours_in_current_status,
  EXTRACT(EPOCH FROM (aj.completed_at - aj.started_at)) / 3600 as assembly_hours,
  EXTRACT(EPOCH FROM (aj.qc_completed_at - aj.qc_started_at)) / 3600 as qc_hours,
  EXTRACT(EPOCH FROM (NOW() - aj.inwarded_at)) / 3600 as total_hours_since_inward,

  aj.updated_at
FROM assembly_journeys aj
LEFT JOIN locations l ON aj.current_location_id = l.id
LEFT JOIN bins b ON aj.bin_location_id = b.id
LEFT JOIN user_profiles t ON aj.technician_id = t.id
LEFT JOIN user_profiles s ON aj.supervisor_id = s.id
LEFT JOIN user_profiles q ON aj.qc_person_id = q.id
ORDER BY
  -- Priority first
  aj.priority DESC,
  -- Then by status order
  CASE aj.current_status
    WHEN 'inwarded' THEN 1
    WHEN 'assigned' THEN 2
    WHEN 'in_progress' THEN 3
    WHEN 'completed' THEN 4
    WHEN 'qc_review' THEN 5
    WHEN 'ready_for_sale' THEN 6
  END,
  -- Then oldest first
  aj.created_at ASC;

COMMENT ON VIEW kanban_board IS 'Kanban board view with bin location information';
