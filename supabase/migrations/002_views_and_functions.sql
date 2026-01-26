-- ============================================================================
-- BUILDLINE: Views and Functions
-- Migration 002: Business Logic and Reporting Views
-- ============================================================================

-- ============================================================================
-- VIEWS FOR DASHBOARDS
-- ============================================================================

-- Kanban Board View (Admin/Supervisor Dashboard)
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

-- Technician Workload View
CREATE OR REPLACE VIEW technician_workload AS
SELECT
  t.id as technician_id,
  t.full_name as technician_name,
  t.email,

  -- Current workload
  COUNT(CASE WHEN aj.current_status = 'assigned' THEN 1 END) as assigned_count,
  COUNT(CASE WHEN aj.current_status = 'in_progress' THEN 1 END) as in_progress_count,

  -- Today's work
  COUNT(CASE WHEN DATE(aj.completed_at) = CURRENT_DATE THEN 1 END) as completed_today,

  -- All time stats
  COUNT(CASE WHEN aj.current_status = 'ready_for_sale' THEN 1 END) as total_completed,
  COUNT(CASE WHEN aj.rework_count > 0 THEN 1 END) as rework_items,

  -- Performance metrics
  AVG(CASE
    WHEN aj.completed_at IS NOT NULL AND aj.started_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (aj.completed_at - aj.started_at)) / 3600
  END) as avg_assembly_hours,

  ROUND(
    100.0 * COUNT(CASE WHEN aj.qc_status = 'pass' THEN 1 END)::numeric /
    NULLIF(COUNT(CASE WHEN aj.qc_status IN ('pass', 'fail') THEN 1 END), 0),
    2
  ) as qc_pass_rate_percent

FROM user_profiles t
LEFT JOIN assembly_journeys aj ON t.id = aj.technician_id
WHERE t.role = 'technician' AND t.is_active = true
GROUP BY t.id, t.full_name, t.email
ORDER BY in_progress_count DESC, assigned_count DESC;

-- Daily Assembly Dashboard
CREATE OR REPLACE VIEW daily_dashboard AS
SELECT
  CURRENT_DATE as report_date,

  -- Inwarded
  COUNT(CASE WHEN DATE(inwarded_at) = CURRENT_DATE THEN 1 END) as inwarded_today,

  -- Completed assembly
  COUNT(CASE WHEN DATE(completed_at) = CURRENT_DATE THEN 1 END) as assembled_today,

  -- QC passed
  COUNT(CASE WHEN DATE(qc_completed_at) = CURRENT_DATE AND qc_status = 'pass' THEN 1 END) as qc_passed_today,

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

-- QC Failure Analysis View
CREATE OR REPLACE VIEW qc_failure_analysis AS
SELECT
  aj.model_sku,
  aj.qc_failure_reason,
  COUNT(*) as failure_count,

  -- Technicians involved
  array_agg(DISTINCT t.full_name) as technicians,

  -- Average rework time
  AVG(EXTRACT(EPOCH FROM (aj.qc_completed_at - aj.qc_started_at)) / 3600) as avg_rework_hours,

  -- Most recent failures
  MAX(aj.qc_started_at) as last_failure_date

FROM assembly_journeys aj
LEFT JOIN user_profiles t ON aj.technician_id = t.id
WHERE aj.qc_status = 'fail' AND aj.qc_failure_reason IS NOT NULL
GROUP BY aj.model_sku, aj.qc_failure_reason
ORDER BY failure_count DESC;

-- Bottleneck Report View
CREATE OR REPLACE VIEW bottleneck_report AS
SELECT
  current_status,
  COUNT(*) as bikes_in_stage,

  -- Time spent in this stage
  AVG(EXTRACT(EPOCH FROM (NOW() - updated_at)) / 3600) as avg_hours_in_stage,
  MAX(EXTRACT(EPOCH FROM (NOW() - updated_at)) / 3600) as max_hours_in_stage,

  -- Location breakdown
  COUNT(CASE WHEN l.type = 'warehouse' THEN 1 END) as in_warehouse,
  COUNT(CASE WHEN l.type = 'store' THEN 1 END) as in_store,

  -- Priority items
  COUNT(CASE WHEN aj.priority = true THEN 1 END) as priority_items

FROM assembly_journeys aj
LEFT JOIN locations l ON aj.current_location_id = l.id
WHERE current_status != 'ready_for_sale'
GROUP BY current_status
ORDER BY
  CASE current_status
    WHEN 'inwarded' THEN 1
    WHEN 'assigned' THEN 2
    WHEN 'in_progress' THEN 3
    WHEN 'completed' THEN 4
    WHEN 'qc_review' THEN 5
  END;

-- ============================================================================
-- BUSINESS LOGIC FUNCTIONS
-- ============================================================================

-- Sales Lock: Check if bike can be invoiced
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

  -- Check if ready for sale
  IF v_journey.current_status = 'ready_for_sale' AND v_journey.qc_status = 'pass' THEN
    RETURN QUERY SELECT
      true,
      'Ready for sale - QC passed',
      v_journey.barcode,
      v_journey.current_status::TEXT,
      v_journey.model_sku;
    RETURN;
  END IF;

  -- Not ready for sale
  RETURN QUERY SELECT
    false,
    'Cannot invoice: Status is ' || v_journey.current_status::TEXT ||
    ', QC status is ' || v_journey.qc_status::TEXT,
    v_journey.barcode,
    v_journey.current_status::TEXT,
    v_journey.model_sku;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Assign bike to technician
CREATE OR REPLACE FUNCTION assign_to_technician(
  p_barcode TEXT,
  p_technician_id UUID,
  p_supervisor_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE assembly_journeys
  SET
    current_status = 'assigned',
    technician_id = p_technician_id,
    supervisor_id = p_supervisor_id,
    assigned_at = NOW()
  WHERE barcode = p_barcode
    AND current_status = 'inwarded';

  IF FOUND THEN
    v_result = jsonb_build_object(
      'success', true,
      'message', 'Bike assigned to technician',
      'barcode', p_barcode
    );
  ELSE
    v_result = jsonb_build_object(
      'success', false,
      'message', 'Bike not found or not in inwarded status',
      'barcode', p_barcode
    );
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Start assembly
CREATE OR REPLACE FUNCTION start_assembly(p_barcode TEXT, p_technician_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE assembly_journeys
  SET
    current_status = 'in_progress',
    started_at = NOW()
  WHERE barcode = p_barcode
    AND technician_id = p_technician_id
    AND current_status = 'assigned';

  IF FOUND THEN
    v_result = jsonb_build_object(
      'success', true,
      'message', 'Assembly started',
      'barcode', p_barcode
    );
  ELSE
    v_result = jsonb_build_object(
      'success', false,
      'message', 'Bike not found, not assigned to you, or already started',
      'barcode', p_barcode
    );
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete assembly (with checklist validation)
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
    current_status = 'completed',
    checklist = p_checklist,
    completed_at = NOW()
  WHERE barcode = p_barcode
    AND technician_id = p_technician_id
    AND current_status = 'in_progress';

  IF FOUND THEN
    v_result = jsonb_build_object(
      'success', true,
      'message', 'Assembly completed successfully',
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

-- QC Pass/Fail
CREATE OR REPLACE FUNCTION submit_qc_result(
  p_barcode TEXT,
  p_qc_person_id UUID,
  p_result TEXT, -- 'pass' or 'fail'
  p_failure_reason TEXT DEFAULT NULL,
  p_photos TEXT[] DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_new_status assembly_status;
BEGIN
  -- Determine new status
  IF p_result = 'pass' THEN
    v_new_status := 'ready_for_sale';
  ELSIF p_result = 'fail' THEN
    v_new_status := 'in_progress'; -- Send back to assembly
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invalid QC result. Must be pass or fail',
      'barcode', p_barcode
    );
  END IF;

  UPDATE assembly_journeys
  SET
    current_status = v_new_status,
    qc_status = p_result::qc_result,
    qc_person_id = p_qc_person_id,
    qc_completed_at = NOW(),
    qc_failure_reason = p_failure_reason,
    qc_photos = p_photos,
    rework_count = CASE WHEN p_result = 'fail' THEN rework_count + 1 ELSE rework_count END
  WHERE barcode = p_barcode
    AND current_status IN ('completed', 'qc_review');

  IF FOUND THEN
    v_result = jsonb_build_object(
      'success', true,
      'message', 'QC result submitted: ' || p_result,
      'barcode', p_barcode,
      'new_status', v_new_status
    );
  ELSE
    v_result = jsonb_build_object(
      'success', false,
      'message', 'Bike not found or not ready for QC',
      'barcode', p_barcode
    );
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get technician's assigned bikes
CREATE OR REPLACE FUNCTION get_technician_queue(p_technician_id UUID)
RETURNS TABLE(
  barcode TEXT,
  model_sku TEXT,
  current_status assembly_status,
  priority BOOLEAN,
  checklist JSONB,
  assigned_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ
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
    aj.started_at
  FROM assembly_journeys aj
  WHERE aj.technician_id = p_technician_id
    AND aj.current_status IN ('assigned', 'in_progress')
  ORDER BY aj.priority DESC, aj.assigned_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON VIEW kanban_board IS 'Real-time Kanban board for supervisors and admins';
COMMENT ON VIEW technician_workload IS 'Technician performance and workload metrics';
COMMENT ON VIEW daily_dashboard IS 'Daily snapshot of assembly operations';
COMMENT ON VIEW qc_failure_analysis IS 'Analysis of QC failures by reason and model';
COMMENT ON VIEW bottleneck_report IS 'Identify stages where bikes are getting stuck';
COMMENT ON FUNCTION can_invoice_item IS 'Sales lock - prevents invoicing bikes that have not passed QC';
