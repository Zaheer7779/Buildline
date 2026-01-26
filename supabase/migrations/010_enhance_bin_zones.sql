-- ============================================================================
-- BUILDLINE: Enhanced Bin Zone Management
-- Migration 010: Add zone-based bin organization by assembly status
-- ============================================================================

-- ============================================================================
-- Add status_zone to bins table
-- ============================================================================

-- Create enum for bin zones that map to assembly statuses
CREATE TYPE bin_zone AS ENUM (
  'inward_zone',        -- For inwarded bikes
  'assembly_zone',      -- For assigned and in_progress bikes
  'completion_zone',    -- For completed bikes waiting for QC
  'qc_zone',           -- For bikes under QC review
  'ready_zone'         -- For ready_for_sale bikes
);

-- Add zone column to bins table
ALTER TABLE bins
  ADD COLUMN status_zone bin_zone;

-- Add bin status for tracking (active, maintenance, full, etc.)
CREATE TYPE bin_status AS ENUM (
  'active',
  'maintenance',
  'full',
  'inactive'
);

ALTER TABLE bins
  ADD COLUMN bin_status bin_status DEFAULT 'active';

-- ============================================================================
-- Bin Movement History (Track bike movements between bins)
-- ============================================================================

CREATE TABLE bin_movement_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journey_id UUID NOT NULL REFERENCES assembly_journeys(id) ON DELETE CASCADE,
  from_bin_id UUID REFERENCES bins(id),
  to_bin_id UUID REFERENCES bins(id),
  from_status assembly_status,
  to_status assembly_status NOT NULL,
  moved_by UUID REFERENCES user_profiles(id),
  reason TEXT,
  auto_assigned BOOLEAN DEFAULT false, -- Track if movement was automatic
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bin_movement_journey ON bin_movement_history(journey_id);
CREATE INDEX idx_bin_movement_from_bin ON bin_movement_history(from_bin_id);
CREATE INDEX idx_bin_movement_to_bin ON bin_movement_history(to_bin_id);

-- ============================================================================
-- Function: Auto-assign bin based on status change
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_assign_bin_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_target_zone bin_zone;
  v_new_bin_id UUID;
BEGIN
  -- Only proceed if status changed
  IF OLD.current_status IS DISTINCT FROM NEW.current_status THEN

    -- Determine target zone based on new status
    v_target_zone := CASE NEW.current_status
      WHEN 'inwarded' THEN 'inward_zone'
      WHEN 'assigned', 'in_progress' THEN 'assembly_zone'
      WHEN 'completed' THEN 'completion_zone'
      WHEN 'qc_review' THEN 'qc_zone'
      WHEN 'ready_for_sale' THEN 'ready_zone'
    END;

    -- Find an available bin in the target zone (at same location)
    SELECT id INTO v_new_bin_id
    FROM bins
    WHERE
      location_id = NEW.current_location_id
      AND status_zone = v_target_zone
      AND is_active = true
      AND bin_status = 'active'
      AND current_occupancy < capacity
    ORDER BY current_occupancy ASC, bin_code ASC
    LIMIT 1;

    -- If a suitable bin is found, assign it
    IF v_new_bin_id IS NOT NULL AND v_new_bin_id IS DISTINCT FROM NEW.bin_location_id THEN

      -- Log the bin movement
      INSERT INTO bin_movement_history (
        journey_id,
        from_bin_id,
        to_bin_id,
        from_status,
        to_status,
        moved_by,
        auto_assigned
      ) VALUES (
        NEW.id,
        NEW.bin_location_id,
        v_new_bin_id,
        OLD.current_status,
        NEW.current_status,
        COALESCE(NEW.technician_id, NEW.supervisor_id, NEW.qc_person_id),
        true
      );

      -- Assign the new bin
      NEW.bin_location_id := v_new_bin_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto bin assignment (BEFORE UPDATE to modify NEW)
CREATE TRIGGER auto_assign_bin_trigger
  BEFORE UPDATE ON assembly_journeys
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_bin_on_status_change();

-- ============================================================================
-- Update existing bins with zones
-- ============================================================================

-- Assign zones to existing bins based on naming convention
-- This is a sample - adjust based on your actual bin codes

-- Inward Zone (A1 racks)
UPDATE bins
SET status_zone = 'inward_zone'
WHERE bin_code LIKE 'A1-%';

-- Assembly Zone (A2 and B1 racks)
UPDATE bins
SET status_zone = 'assembly_zone'
WHERE bin_code LIKE 'A2-%' OR bin_code LIKE 'B1-%';

-- Completion Zone (B2 racks)
UPDATE bins
SET status_zone = 'completion_zone'
WHERE bin_code LIKE 'B2-%';

-- QC Zone (C1 racks)
UPDATE bins
SET status_zone = 'qc_zone'
WHERE bin_code LIKE 'C1-%';

-- Ready Zone (Store bins)
UPDATE bins
SET status_zone = 'ready_zone'
WHERE bin_code LIKE 'STORE-%';

-- For any bins without a zone, set to inward_zone as default
UPDATE bins
SET status_zone = 'inward_zone'
WHERE status_zone IS NULL;

-- Now make status_zone NOT NULL
ALTER TABLE bins
  ALTER COLUMN status_zone SET NOT NULL;

-- ============================================================================
-- Enhanced Views with Zone Information
-- ============================================================================

-- Drop existing kanban_board view and recreate with bin zone info
DROP VIEW IF EXISTS kanban_board CASCADE;

CREATE VIEW kanban_board AS
SELECT
  aj.id,
  aj.barcode,
  aj.model_sku,
  aj.frame_number,
  aj.current_status,
  aj.priority,
  aj.parts_missing,
  aj.damage_reported,
  aj.assembly_paused,
  aj.checklist,
  aj.inwarded_at,
  aj.assigned_at,
  aj.started_at,
  aj.completed_at,
  aj.qc_started_at,
  aj.qc_completed_at,

  -- Location info
  aj.current_location_id,
  l.name as location_name,
  l.code as location_code,

  -- Bin info with zone
  aj.bin_location_id,
  b.bin_code,
  b.bin_name,
  b.status_zone as bin_zone,
  b.zone as bin_area,

  -- People
  aj.technician_id,
  t.full_name as technician_name,
  aj.supervisor_id,
  s.full_name as supervisor_name,
  aj.qc_person_id,
  q.full_name as qc_person_name,

  -- Time in current status
  CASE aj.current_status
    WHEN 'inwarded' THEN EXTRACT(EPOCH FROM (NOW() - aj.inwarded_at))/3600
    WHEN 'assigned' THEN EXTRACT(EPOCH FROM (NOW() - aj.assigned_at))/3600
    WHEN 'in_progress' THEN EXTRACT(EPOCH FROM (NOW() - aj.started_at))/3600
    WHEN 'completed' THEN EXTRACT(EPOCH FROM (NOW() - aj.completed_at))/3600
    WHEN 'qc_review' THEN EXTRACT(EPOCH FROM (NOW() - aj.qc_started_at))/3600
    ELSE 0
  END as hours_in_current_status,

  aj.qc_status,
  aj.rework_count
FROM assembly_journeys aj
LEFT JOIN locations l ON aj.current_location_id = l.id
LEFT JOIN bins b ON aj.bin_location_id = b.id
LEFT JOIN user_profiles t ON aj.technician_id = t.id
LEFT JOIN user_profiles s ON aj.supervisor_id = s.id
LEFT JOIN user_profiles q ON aj.qc_person_id = q.id
ORDER BY aj.priority DESC, aj.inwarded_at ASC;

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to get bins by zone
CREATE OR REPLACE FUNCTION get_bins_by_zone(
  p_location_id UUID,
  p_zone bin_zone
)
RETURNS TABLE (
  id UUID,
  bin_code TEXT,
  bin_name TEXT,
  zone TEXT,
  status_zone bin_zone,
  capacity INTEGER,
  current_occupancy INTEGER,
  available_slots INTEGER,
  bin_status bin_status
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.bin_code,
    b.bin_name,
    b.zone,
    b.status_zone,
    b.capacity,
    b.current_occupancy,
    b.capacity - b.current_occupancy as available_slots,
    b.bin_status
  FROM bins b
  WHERE
    b.location_id = p_location_id
    AND b.status_zone = p_zone
    AND b.is_active = true
  ORDER BY b.bin_code;
END;
$$ LANGUAGE plpgsql;

-- Function to manually move bike to specific bin
CREATE OR REPLACE FUNCTION move_bike_to_bin(
  p_barcode TEXT,
  p_new_bin_id UUID,
  p_moved_by UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_journey_id UUID;
  v_old_bin_id UUID;
  v_current_status assembly_status;
  v_result JSONB;
BEGIN
  -- Get current journey info
  SELECT id, bin_location_id, current_status
  INTO v_journey_id, v_old_bin_id, v_current_status
  FROM assembly_journeys
  WHERE barcode = p_barcode;

  IF v_journey_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Bike not found'
    );
  END IF;

  -- Update bin location
  UPDATE assembly_journeys
  SET bin_location_id = p_new_bin_id
  WHERE id = v_journey_id;

  -- Log the movement
  INSERT INTO bin_movement_history (
    journey_id,
    from_bin_id,
    to_bin_id,
    from_status,
    to_status,
    moved_by,
    reason,
    auto_assigned
  ) VALUES (
    v_journey_id,
    v_old_bin_id,
    p_new_bin_id,
    v_current_status,
    v_current_status,
    p_moved_by,
    p_reason,
    false
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Bike moved to new bin successfully',
    'journey_id', v_journey_id,
    'old_bin_id', v_old_bin_id,
    'new_bin_id', p_new_bin_id
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Zone Statistics View
-- ============================================================================

CREATE VIEW bin_zone_statistics AS
SELECT
  l.id as location_id,
  l.name as location_name,
  l.code as location_code,
  b.status_zone,
  COUNT(b.id) as total_bins,
  SUM(b.capacity) as total_capacity,
  SUM(b.current_occupancy) as total_occupancy,
  SUM(b.capacity - b.current_occupancy) as available_slots,
  ROUND(
    (SUM(b.current_occupancy)::DECIMAL / NULLIF(SUM(b.capacity), 0) * 100),
    2
  ) as occupancy_percentage
FROM locations l
LEFT JOIN bins b ON l.id = b.location_id AND b.is_active = true
WHERE b.status_zone IS NOT NULL
GROUP BY l.id, l.name, l.code, b.status_zone
ORDER BY l.name, b.status_zone;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TYPE bin_zone IS 'Zones for organizing bins by assembly status';
COMMENT ON COLUMN bins.status_zone IS 'Zone designation based on assembly workflow stage';
COMMENT ON COLUMN bins.bin_status IS 'Current operational status of the bin';
COMMENT ON TABLE bin_movement_history IS 'Audit trail for bike movements between bins';
COMMENT ON FUNCTION auto_assign_bin_on_status_change IS 'Automatically assigns bike to appropriate bin when status changes';
COMMENT ON FUNCTION move_bike_to_bin IS 'Manually move a bike to a specific bin with reason tracking';
COMMENT ON VIEW bin_zone_statistics IS 'Real-time statistics for bin utilization by zone';
