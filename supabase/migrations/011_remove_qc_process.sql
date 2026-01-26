-- ============================================================================
-- BUILDLINE: Remove QC Process
-- Migration 011: Update complete_assembly to directly mark bikes as ready_for_sale
-- ============================================================================

-- Update complete_assembly function to skip QC and go directly to ready_for_sale
CREATE OR REPLACE FUNCTION complete_assembly(
  p_barcode TEXT,
  p_technician_id UUID,
  p_checklist JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_all_checked BOOLEAN;
BEGIN
  -- Validate checklist is complete
  v_all_checked := (
    (p_checklist->>'tyres')::boolean = true AND
    (p_checklist->>'brakes')::boolean = true AND
    (p_checklist->>'gears')::boolean = true
  );

  IF NOT v_all_checked THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'All checklist items must be completed',
      'barcode', p_barcode
    );
  END IF;

  UPDATE assembly_journeys
  SET
    current_status = 'ready_for_sale',
    checklist = p_checklist,
    completed_at = NOW(),
    qc_status = 'pass',
    qc_completed_at = NOW()
  WHERE barcode = p_barcode
    AND technician_id = p_technician_id
    AND current_status = 'in_progress';

  IF FOUND THEN
    v_result = jsonb_build_object(
      'success', true,
      'message', 'Assembly completed - Bike ready for sale',
      'barcode', p_barcode
    );
  ELSE
    v_result = jsonb_build_object(
      'success', false,
      'message', 'Bike not found, not assigned to you, or not in progress',
      'barcode', p_barcode
    );
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update can_invoice_item function to not require qc_status check
CREATE OR REPLACE FUNCTION can_invoice_item(p_barcode TEXT)
RETURNS TABLE(
  can_invoice BOOLEAN,
  message TEXT,
  barcode TEXT,
  status TEXT,
  sku TEXT
) AS $$
DECLARE
  v_journey assembly_journeys%ROWTYPE;
BEGIN
  -- Find the bike
  SELECT * INTO v_journey
  FROM assembly_journeys
  WHERE assembly_journeys.barcode = p_barcode;

  -- Not found
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      false,
      'Barcode not found in assembly system',
      p_barcode,
      NULL::TEXT,
      NULL::TEXT;
    RETURN;
  END IF;

  -- Check if ready for sale (no longer requiring QC pass)
  IF v_journey.current_status = 'ready_for_sale' THEN
    RETURN QUERY SELECT
      true,
      'Ready for sale',
      v_journey.barcode,
      v_journey.current_status::TEXT,
      v_journey.model_sku;
    RETURN;
  END IF;

  -- Not ready for sale
  RETURN QUERY SELECT
    false,
    'Cannot invoice: Status is ' || v_journey.current_status::TEXT,
    v_journey.barcode,
    v_journey.current_status::TEXT,
    v_journey.model_sku;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update views to reflect that completed status no longer exists in normal flow
-- Bikes now go directly from in_progress to ready_for_sale
CREATE OR REPLACE VIEW daily_dashboard AS
SELECT
  CURRENT_DATE as report_date,

  -- Inwarded
  COUNT(CASE WHEN DATE(inwarded_at) = CURRENT_DATE THEN 1 END) as inwarded_today,

  -- Completed assembly (now ready for sale)
  COUNT(CASE WHEN DATE(completed_at) = CURRENT_DATE THEN 1 END) as assembled_today,

  -- Ready for sale (replaces QC passed)
  COUNT(CASE WHEN DATE(qc_completed_at) = CURRENT_DATE AND current_status = 'ready_for_sale' THEN 1 END) as qc_passed_today,

  -- Current pending counts
  COUNT(CASE WHEN current_status = 'inwarded' THEN 1 END) as pending_assignment,
  COUNT(CASE WHEN current_status = 'assigned' THEN 1 END) as pending_start,
  COUNT(CASE WHEN current_status = 'in_progress' THEN 1 END) as currently_assembling,
  COUNT(CASE WHEN current_status = 'completed' THEN 1 END) as pending_qc,
  COUNT(CASE WHEN current_status = 'qc_review' THEN 1 END) as in_qc_review,
  COUNT(CASE WHEN current_status = 'ready_for_sale' THEN 1 END) as ready_for_sale,

  -- Stuck items (>24 hours in same status)
  COUNT(CASE WHEN EXTRACT(EPOCH FROM (NOW() - updated_at)) / 3600 > 24 THEN 1 END) as stuck_over_24h,

  -- Priority items
  COUNT(CASE WHEN priority = true AND current_status != 'ready_for_sale' THEN 1 END) as priority_pending

FROM assembly_journeys;

COMMENT ON FUNCTION complete_assembly IS 'Complete assembly and mark bike as ready for sale (QC process removed)';
COMMENT ON FUNCTION can_invoice_item IS 'Check if bike can be invoiced - ready_for_sale status required';
