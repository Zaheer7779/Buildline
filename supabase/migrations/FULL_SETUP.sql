-- ============================================================================
-- BUILDLINE: FULL DATABASE SETUP (Single Run)
-- Run this entire file in Supabase SQL Editor for a fresh project
-- ============================================================================

-- ============================================================================
-- STEP 0: CLEANUP (safe to run on fresh DB)
-- ============================================================================
DROP VIEW IF EXISTS bin_zone_statistics CASCADE;
DROP VIEW IF EXISTS kanban_board CASCADE;
DROP VIEW IF EXISTS technician_workload CASCADE;
DROP VIEW IF EXISTS daily_dashboard CASCADE;
DROP VIEW IF EXISTS qc_failure_analysis CASCADE;
DROP VIEW IF EXISTS bottleneck_report CASCADE;

DROP FUNCTION IF EXISTS can_invoice_item(TEXT) CASCADE;
DROP FUNCTION IF EXISTS assign_to_technician(TEXT, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS start_assembly(TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS complete_assembly(TEXT, UUID, JSONB) CASCADE;
DROP FUNCTION IF EXISTS submit_qc_result(TEXT, UUID, TEXT, TEXT, TEXT[]) CASCADE;
DROP FUNCTION IF EXISTS get_technician_queue(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS log_status_change() CASCADE;
DROP FUNCTION IF EXISTS log_location_change() CASCADE;
DROP FUNCTION IF EXISTS update_bin_occupancy() CASCADE;
DROP FUNCTION IF EXISTS insert_bin_occupancy() CASCADE;
DROP FUNCTION IF EXISTS auto_assign_bin_on_status_change() CASCADE;
DROP FUNCTION IF EXISTS get_bins_by_zone(UUID, bin_zone) CASCADE;
DROP FUNCTION IF EXISTS move_bike_to_bin(TEXT, UUID, UUID, TEXT) CASCADE;

DROP TABLE IF EXISTS bin_movement_history CASCADE;
DROP TABLE IF EXISTS qc_checklists CASCADE;
DROP TABLE IF EXISTS assembly_location_history CASCADE;
DROP TABLE IF EXISTS assembly_status_history CASCADE;
DROP TABLE IF EXISTS assembly_journeys CASCADE;
DROP TABLE IF EXISTS bins CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

DROP TYPE IF EXISTS bin_zone CASCADE;
DROP TYPE IF EXISTS bin_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS assembly_status CASCADE;
DROP TYPE IF EXISTS qc_result CASCADE;
DROP TYPE IF EXISTS location_type CASCADE;

-- ============================================================================
-- STEP 1: EXTENSIONS & ENUMS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM (
  'admin',
  'supervisor',
  'technician',
  'qc_person',
  'warehouse_staff'
);

CREATE TYPE assembly_status AS ENUM (
  'inwarded',
  'assigned',
  'in_progress',
  'completed',
  'qc_review',
  'ready_for_sale'
);

CREATE TYPE qc_result AS ENUM (
  'pending',
  'pass',
  'fail'
);

CREATE TYPE location_type AS ENUM (
  'warehouse',
  'store'
);

CREATE TYPE bin_zone AS ENUM (
  'inward_zone',
  'assembly_zone',
  'completion_zone',
  'qc_zone',
  'ready_zone'
);

CREATE TYPE bin_status AS ENUM (
  'active',
  'maintenance',
  'full',
  'inactive'
);

-- ============================================================================
-- STEP 2: CORE TABLES
-- ============================================================================

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  type location_type NOT NULL,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  bin_code TEXT NOT NULL,
  bin_name TEXT,
  zone TEXT,
  status_zone bin_zone NOT NULL DEFAULT 'inward_zone',
  bin_status bin_status DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  capacity INTEGER DEFAULT 1,
  current_occupancy INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_bin_per_location UNIQUE(location_id, bin_code),
  CONSTRAINT valid_occupancy CHECK (current_occupancy >= 0 AND current_occupancy <= capacity)
);

CREATE TABLE assembly_journeys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barcode TEXT UNIQUE NOT NULL,
  model_sku TEXT NOT NULL,
  frame_number TEXT,
  current_status assembly_status NOT NULL DEFAULT 'inwarded',
  current_location_id UUID REFERENCES locations(id),
  bin_location_id UUID REFERENCES bins(id),
  priority BOOLEAN DEFAULT false,
  checklist JSONB DEFAULT '{"tyres": false, "brakes": false, "gears": false}'::jsonb,
  technician_id UUID REFERENCES user_profiles(id),
  supervisor_id UUID REFERENCES user_profiles(id),
  qc_person_id UUID REFERENCES user_profiles(id),
  inwarded_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  qc_started_at TIMESTAMPTZ,
  qc_completed_at TIMESTAMPTZ,
  parts_missing BOOLEAN DEFAULT false,
  parts_missing_list TEXT[],
  damage_reported BOOLEAN DEFAULT false,
  damage_notes TEXT,
  damage_photos TEXT[],
  assembly_paused BOOLEAN DEFAULT false,
  pause_reason TEXT,
  qc_status qc_result DEFAULT 'pending',
  qc_failure_reason TEXT,
  qc_photos TEXT[],
  rework_count INTEGER DEFAULT 0,
  grn_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT checklist_structure CHECK (
    checklist ? 'tyres' AND
    checklist ? 'brakes' AND
    checklist ? 'gears'
  )
);

CREATE TABLE assembly_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journey_id UUID NOT NULL REFERENCES assembly_journeys(id) ON DELETE CASCADE,
  from_status assembly_status,
  to_status assembly_status NOT NULL,
  changed_by UUID NOT NULL REFERENCES user_profiles(id),
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assembly_location_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journey_id UUID NOT NULL REFERENCES assembly_journeys(id) ON DELETE CASCADE,
  from_location_id UUID REFERENCES locations(id),
  to_location_id UUID NOT NULL REFERENCES locations(id),
  moved_by UUID NOT NULL REFERENCES user_profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE qc_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journey_id UUID NOT NULL REFERENCES assembly_journeys(id) ON DELETE CASCADE,
  qc_person_id UUID NOT NULL REFERENCES user_profiles(id),
  brake_check BOOLEAN DEFAULT false,
  brake_notes TEXT,
  drivetrain_check BOOLEAN DEFAULT false,
  drivetrain_notes TEXT,
  alignment_check BOOLEAN DEFAULT false,
  alignment_notes TEXT,
  torque_check BOOLEAN DEFAULT false,
  torque_notes TEXT,
  accessories_check BOOLEAN DEFAULT false,
  accessories_notes TEXT,
  result qc_result NOT NULL,
  failure_reason TEXT,
  photos TEXT[],
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bin_movement_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journey_id UUID NOT NULL REFERENCES assembly_journeys(id) ON DELETE CASCADE,
  from_bin_id UUID REFERENCES bins(id),
  to_bin_id UUID REFERENCES bins(id),
  from_status assembly_status,
  to_status assembly_status NOT NULL,
  moved_by UUID REFERENCES user_profiles(id),
  reason TEXT,
  auto_assigned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: INDEXES
-- ============================================================================

CREATE INDEX idx_assembly_journeys_barcode ON assembly_journeys(barcode);
CREATE INDEX idx_assembly_journeys_status ON assembly_journeys(current_status);
CREATE INDEX idx_assembly_journeys_technician ON assembly_journeys(technician_id);
CREATE INDEX idx_assembly_journeys_location ON assembly_journeys(current_location_id);
CREATE INDEX idx_assembly_journeys_priority ON assembly_journeys(priority) WHERE priority = true;
CREATE INDEX idx_assembly_journeys_bin ON assembly_journeys(bin_location_id);
CREATE INDEX idx_status_history_journey ON assembly_status_history(journey_id);
CREATE INDEX idx_location_history_journey ON assembly_location_history(journey_id);
CREATE INDEX idx_qc_checklists_journey ON qc_checklists(journey_id);
CREATE INDEX idx_bins_location ON bins(location_id);
CREATE INDEX idx_bins_active ON bins(is_active) WHERE is_active = true;
CREATE INDEX idx_bin_movement_journey ON bin_movement_history(journey_id);
CREATE INDEX idx_bin_movement_from_bin ON bin_movement_history(from_bin_id);
CREATE INDEX idx_bin_movement_to_bin ON bin_movement_history(to_bin_id);

-- ============================================================================
-- STEP 4: TRIGGERS & UTILITY FUNCTIONS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assembly_journeys_updated_at
  BEFORE UPDATE ON assembly_journeys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bins_updated_at
  BEFORE UPDATE ON bins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-log status changes
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_status IS DISTINCT FROM NEW.current_status THEN
    INSERT INTO assembly_status_history (
      journey_id, from_status, to_status, changed_by
    ) VALUES (
      NEW.id, OLD.current_status, NEW.current_status,
      COALESCE(NEW.technician_id, NEW.supervisor_id, NEW.qc_person_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_assembly_status_change
  AFTER UPDATE ON assembly_journeys
  FOR EACH ROW
  EXECUTE FUNCTION log_status_change();

-- Auto-log location changes
CREATE OR REPLACE FUNCTION log_location_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_location_id IS DISTINCT FROM NEW.current_location_id THEN
    INSERT INTO assembly_location_history (
      journey_id, from_location_id, to_location_id, moved_by
    ) VALUES (
      NEW.id, OLD.current_location_id, NEW.current_location_id,
      COALESCE(NEW.technician_id, NEW.supervisor_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_assembly_location_change
  AFTER UPDATE ON assembly_journeys
  FOR EACH ROW
  EXECUTE FUNCTION log_location_change();

-- Bin occupancy triggers
CREATE OR REPLACE FUNCTION update_bin_occupancy()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.bin_location_id IS DISTINCT FROM NEW.bin_location_id THEN
    IF OLD.bin_location_id IS NOT NULL THEN
      UPDATE bins SET current_occupancy = GREATEST(current_occupancy - 1, 0)
      WHERE id = OLD.bin_location_id;
    END IF;
    IF NEW.bin_location_id IS NOT NULL THEN
      UPDATE bins SET current_occupancy = current_occupancy + 1
      WHERE id = NEW.bin_location_id;
      IF (SELECT current_occupancy > capacity FROM bins WHERE id = NEW.bin_location_id) THEN
        RAISE EXCEPTION 'Bin is at full capacity';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assembly_bin_occupancy
  AFTER UPDATE ON assembly_journeys
  FOR EACH ROW
  EXECUTE FUNCTION update_bin_occupancy();

CREATE OR REPLACE FUNCTION insert_bin_occupancy()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.bin_location_id IS NOT NULL THEN
    UPDATE bins SET current_occupancy = current_occupancy + 1
    WHERE id = NEW.bin_location_id;
    IF (SELECT current_occupancy > capacity FROM bins WHERE id = NEW.bin_location_id) THEN
      RAISE EXCEPTION 'Bin is at full capacity';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER insert_assembly_bin_occupancy
  AFTER INSERT ON assembly_journeys
  FOR EACH ROW
  EXECUTE FUNCTION insert_bin_occupancy();

-- Auto-assign bin on status change
CREATE OR REPLACE FUNCTION auto_assign_bin_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_target_zone bin_zone;
  v_new_bin_id UUID;
BEGIN
  IF OLD.current_status IS DISTINCT FROM NEW.current_status THEN
    v_target_zone := CASE
      WHEN NEW.current_status = 'inwarded' THEN 'inward_zone'
      WHEN NEW.current_status IN ('assigned', 'in_progress') THEN 'assembly_zone'
      WHEN NEW.current_status = 'completed' THEN 'completion_zone'
      WHEN NEW.current_status = 'qc_review' THEN 'qc_zone'
      WHEN NEW.current_status = 'ready_for_sale' THEN 'ready_zone'
    END;

    SELECT id INTO v_new_bin_id
    FROM bins
    WHERE location_id = NEW.current_location_id
      AND status_zone = v_target_zone
      AND is_active = true
      AND bin_status = 'active'
      AND current_occupancy < capacity
    ORDER BY current_occupancy ASC, bin_code ASC
    LIMIT 1;

    IF v_new_bin_id IS NOT NULL AND v_new_bin_id IS DISTINCT FROM NEW.bin_location_id THEN
      INSERT INTO bin_movement_history (
        journey_id, from_bin_id, to_bin_id, from_status, to_status, moved_by, auto_assigned
      ) VALUES (
        NEW.id, NEW.bin_location_id, v_new_bin_id, OLD.current_status, NEW.current_status,
        COALESCE(NEW.technician_id, NEW.supervisor_id, NEW.qc_person_id), true
      );
      NEW.bin_location_id := v_new_bin_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_assign_bin_trigger
  BEFORE UPDATE ON assembly_journeys
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_bin_on_status_change();

-- ============================================================================
-- STEP 5: BUSINESS LOGIC FUNCTIONS (with QC removed - migration 011)
-- ============================================================================

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
  SET current_status = 'assigned',
      technician_id = p_technician_id,
      supervisor_id = p_supervisor_id,
      assigned_at = NOW()
  WHERE barcode = p_barcode AND current_status = 'inwarded';

  IF FOUND THEN
    v_result = jsonb_build_object('success', true, 'message', 'Bike assigned to technician', 'barcode', p_barcode);
  ELSE
    v_result = jsonb_build_object('success', false, 'message', 'Bike not found or not in inwarded status', 'barcode', p_barcode);
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
  SET current_status = 'in_progress', started_at = NOW()
  WHERE barcode = p_barcode AND technician_id = p_technician_id AND current_status = 'assigned';

  IF FOUND THEN
    v_result = jsonb_build_object('success', true, 'message', 'Assembly started', 'barcode', p_barcode);
  ELSE
    v_result = jsonb_build_object('success', false, 'message', 'Bike not found, not assigned to you, or already started', 'barcode', p_barcode);
  END IF;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete assembly (QC removed - goes directly to ready_for_sale)
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
  v_all_checked := (
    (p_checklist->>'tyres')::boolean = true AND
    (p_checklist->>'brakes')::boolean = true AND
    (p_checklist->>'gears')::boolean = true
  );

  IF NOT v_all_checked THEN
    RETURN jsonb_build_object('success', false, 'message', 'All checklist items must be completed', 'barcode', p_barcode);
  END IF;

  UPDATE assembly_journeys
  SET current_status = 'ready_for_sale',
      checklist = p_checklist,
      completed_at = NOW(),
      qc_status = 'pass',
      qc_completed_at = NOW()
  WHERE barcode = p_barcode AND technician_id = p_technician_id AND current_status = 'in_progress';

  IF FOUND THEN
    v_result = jsonb_build_object('success', true, 'message', 'Assembly completed - Bike ready for sale', 'barcode', p_barcode);
  ELSE
    v_result = jsonb_build_object('success', false, 'message', 'Bike not found, not assigned to you, or not in progress', 'barcode', p_barcode);
  END IF;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sales lock check
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
  SELECT * INTO v_journey FROM assembly_journeys WHERE assembly_journeys.barcode = p_barcode;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Barcode not found in assembly system', p_barcode, NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  IF v_journey.current_status = 'ready_for_sale' THEN
    RETURN QUERY SELECT true, 'Ready for sale', v_journey.barcode, v_journey.current_status::TEXT, v_journey.model_sku;
    RETURN;
  END IF;

  RETURN QUERY SELECT false, 'Cannot invoice: Status is ' || v_journey.current_status::TEXT,
    v_journey.barcode, v_journey.current_status::TEXT, v_journey.model_sku;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get technician queue
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
    aj.barcode, aj.model_sku, aj.current_status, aj.priority, aj.checklist,
    aj.assigned_at, aj.started_at, aj.qc_status, aj.qc_failure_reason, aj.rework_count,
    CASE
      WHEN b.id IS NOT NULL THEN
        jsonb_build_object('id', b.id, 'bin_code', b.bin_code, 'bin_name', b.bin_name, 'zone', b.zone)
      ELSE NULL
    END as bin_location
  FROM assembly_journeys aj
  LEFT JOIN bins b ON aj.bin_location_id = b.id
  WHERE aj.technician_id = p_technician_id
    AND aj.current_status IN ('assigned', 'in_progress')
  ORDER BY aj.priority DESC, aj.assigned_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get bins by zone
CREATE OR REPLACE FUNCTION get_bins_by_zone(p_location_id UUID, p_zone bin_zone)
RETURNS TABLE (
  id UUID, bin_code TEXT, bin_name TEXT, zone TEXT,
  status_zone bin_zone, capacity INTEGER, current_occupancy INTEGER,
  available_slots INTEGER, bin_status bin_status
) AS $$
BEGIN
  RETURN QUERY
  SELECT b.id, b.bin_code, b.bin_name, b.zone, b.status_zone, b.capacity,
    b.current_occupancy, b.capacity - b.current_occupancy as available_slots, b.bin_status
  FROM bins b
  WHERE b.location_id = p_location_id AND b.status_zone = p_zone AND b.is_active = true
  ORDER BY b.bin_code;
END;
$$ LANGUAGE plpgsql;

-- Move bike to bin
CREATE OR REPLACE FUNCTION move_bike_to_bin(
  p_barcode TEXT, p_new_bin_id UUID, p_moved_by UUID, p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_journey_id UUID;
  v_old_bin_id UUID;
  v_current_status assembly_status;
BEGIN
  SELECT id, bin_location_id, current_status INTO v_journey_id, v_old_bin_id, v_current_status
  FROM assembly_journeys WHERE barcode = p_barcode;

  IF v_journey_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Bike not found');
  END IF;

  UPDATE assembly_journeys SET bin_location_id = p_new_bin_id WHERE id = v_journey_id;

  INSERT INTO bin_movement_history (
    journey_id, from_bin_id, to_bin_id, from_status, to_status, moved_by, reason, auto_assigned
  ) VALUES (v_journey_id, v_old_bin_id, p_new_bin_id, v_current_status, v_current_status, p_moved_by, p_reason, false);

  RETURN jsonb_build_object(
    'success', true, 'message', 'Bike moved to new bin successfully',
    'journey_id', v_journey_id, 'old_bin_id', v_old_bin_id, 'new_bin_id', p_new_bin_id
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 6: VIEWS
-- ============================================================================

CREATE VIEW kanban_board AS
SELECT
  aj.id, aj.barcode, aj.model_sku, aj.frame_number, aj.current_status, aj.priority,
  aj.parts_missing, aj.damage_reported, aj.assembly_paused, aj.checklist,
  aj.inwarded_at, aj.assigned_at, aj.started_at, aj.completed_at, aj.qc_started_at, aj.qc_completed_at,
  aj.current_location_id, l.name as location_name, l.code as location_code,
  aj.bin_location_id, b.bin_code, b.bin_name, b.status_zone as bin_zone, b.zone as bin_area,
  aj.technician_id, t.full_name as technician_name,
  aj.supervisor_id, s.full_name as supervisor_name,
  aj.qc_person_id, q.full_name as qc_person_name,
  CASE aj.current_status
    WHEN 'inwarded' THEN EXTRACT(EPOCH FROM (NOW() - aj.inwarded_at))/3600
    WHEN 'assigned' THEN EXTRACT(EPOCH FROM (NOW() - aj.assigned_at))/3600
    WHEN 'in_progress' THEN EXTRACT(EPOCH FROM (NOW() - aj.started_at))/3600
    WHEN 'completed' THEN EXTRACT(EPOCH FROM (NOW() - aj.completed_at))/3600
    WHEN 'qc_review' THEN EXTRACT(EPOCH FROM (NOW() - aj.qc_started_at))/3600
    ELSE 0
  END as hours_in_current_status,
  aj.qc_status, aj.rework_count
FROM assembly_journeys aj
LEFT JOIN locations l ON aj.current_location_id = l.id
LEFT JOIN bins b ON aj.bin_location_id = b.id
LEFT JOIN user_profiles t ON aj.technician_id = t.id
LEFT JOIN user_profiles s ON aj.supervisor_id = s.id
LEFT JOIN user_profiles q ON aj.qc_person_id = q.id
ORDER BY aj.priority DESC, aj.inwarded_at ASC;

CREATE VIEW technician_workload AS
SELECT
  t.id as technician_id, t.full_name as technician_name, t.email,
  COUNT(CASE WHEN aj.current_status = 'assigned' THEN 1 END) as assigned_count,
  COUNT(CASE WHEN aj.current_status = 'in_progress' THEN 1 END) as in_progress_count,
  COUNT(CASE WHEN DATE(aj.completed_at) = CURRENT_DATE THEN 1 END) as completed_today,
  COUNT(CASE WHEN aj.current_status = 'ready_for_sale' THEN 1 END) as total_completed,
  COUNT(CASE WHEN aj.rework_count > 0 THEN 1 END) as rework_items,
  AVG(CASE
    WHEN aj.completed_at IS NOT NULL AND aj.started_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (aj.completed_at - aj.started_at)) / 3600
  END) as avg_assembly_hours,
  ROUND(
    100.0 * COUNT(CASE WHEN aj.qc_status = 'pass' THEN 1 END)::numeric /
    NULLIF(COUNT(CASE WHEN aj.qc_status IN ('pass', 'fail') THEN 1 END), 0), 2
  ) as qc_pass_rate_percent
FROM user_profiles t
LEFT JOIN assembly_journeys aj ON t.id = aj.technician_id
WHERE t.role = 'technician' AND t.is_active = true
GROUP BY t.id, t.full_name, t.email
ORDER BY in_progress_count DESC, assigned_count DESC;

CREATE VIEW daily_dashboard AS
SELECT
  CURRENT_DATE as report_date,
  COUNT(CASE WHEN DATE(inwarded_at) = CURRENT_DATE THEN 1 END) as inwarded_today,
  COUNT(CASE WHEN DATE(completed_at) = CURRENT_DATE THEN 1 END) as assembled_today,
  COUNT(CASE WHEN DATE(qc_completed_at) = CURRENT_DATE AND current_status = 'ready_for_sale' THEN 1 END) as qc_passed_today,
  COUNT(CASE WHEN current_status = 'inwarded' THEN 1 END) as pending_assignment,
  COUNT(CASE WHEN current_status = 'assigned' THEN 1 END) as pending_start,
  COUNT(CASE WHEN current_status = 'in_progress' THEN 1 END) as currently_assembling,
  COUNT(CASE WHEN current_status = 'completed' THEN 1 END) as pending_qc,
  COUNT(CASE WHEN current_status = 'qc_review' THEN 1 END) as in_qc_review,
  COUNT(CASE WHEN current_status = 'ready_for_sale' THEN 1 END) as ready_for_sale,
  COUNT(CASE WHEN EXTRACT(EPOCH FROM (NOW() - updated_at)) / 3600 > 24 THEN 1 END) as stuck_over_24h,
  COUNT(CASE WHEN priority = true AND current_status != 'ready_for_sale' THEN 1 END) as priority_pending
FROM assembly_journeys;

CREATE VIEW qc_failure_analysis AS
SELECT
  aj.model_sku, aj.qc_failure_reason,
  COUNT(*) as failure_count,
  array_agg(DISTINCT t.full_name) as technicians,
  AVG(EXTRACT(EPOCH FROM (aj.qc_completed_at - aj.qc_started_at)) / 3600) as avg_rework_hours,
  MAX(aj.qc_started_at) as last_failure_date
FROM assembly_journeys aj
LEFT JOIN user_profiles t ON aj.technician_id = t.id
WHERE aj.qc_status = 'fail' AND aj.qc_failure_reason IS NOT NULL
GROUP BY aj.model_sku, aj.qc_failure_reason
ORDER BY failure_count DESC;

CREATE VIEW bottleneck_report AS
SELECT
  current_status,
  COUNT(*) as bikes_in_stage,
  AVG(EXTRACT(EPOCH FROM (NOW() - updated_at)) / 3600) as avg_hours_in_stage,
  MAX(EXTRACT(EPOCH FROM (NOW() - updated_at)) / 3600) as max_hours_in_stage,
  COUNT(CASE WHEN l.type = 'warehouse' THEN 1 END) as in_warehouse,
  COUNT(CASE WHEN l.type = 'store' THEN 1 END) as in_store,
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

CREATE VIEW bin_zone_statistics AS
SELECT
  l.id as location_id, l.name as location_name, l.code as location_code,
  b.status_zone,
  COUNT(b.id) as total_bins,
  SUM(b.capacity) as total_capacity,
  SUM(b.current_occupancy) as total_occupancy,
  SUM(b.capacity - b.current_occupancy) as available_slots,
  ROUND((SUM(b.current_occupancy)::DECIMAL / NULLIF(SUM(b.capacity), 0) * 100), 2) as occupancy_percentage
FROM locations l
LEFT JOIN bins b ON l.id = b.location_id AND b.is_active = true
WHERE b.status_zone IS NOT NULL
GROUP BY l.id, l.name, l.code, b.status_zone
ORDER BY l.name, b.status_zone;

-- ============================================================================
-- STEP 7: SEED DATA
-- ============================================================================

-- Locations
INSERT INTO locations (name, code, type, address) VALUES
  ('Main Warehouse', 'WH001', 'warehouse', '123 Warehouse Road, Industrial Area'),
  ('Downtown Store', 'ST001', 'store', '456 Main Street, Downtown'),
  ('Mall Store', 'ST002', 'store', '789 Shopping Mall, North District');

-- Warehouse bins
INSERT INTO bins (location_id, bin_code, bin_name, zone, status_zone, capacity)
SELECT id, bin, 'Rack ' || bin,
  CASE WHEN bin LIKE 'A%' THEN 'Zone A' WHEN bin LIKE 'B%' THEN 'Zone B' WHEN bin LIKE 'C%' THEN 'Zone C' ELSE 'General' END,
  CASE
    WHEN bin LIKE 'A1-%' THEN 'inward_zone'::bin_zone
    WHEN bin LIKE 'A2-%' OR bin LIKE 'B1-%' THEN 'assembly_zone'::bin_zone
    WHEN bin LIKE 'B2-%' THEN 'completion_zone'::bin_zone
    WHEN bin LIKE 'C1-%' THEN 'ready_zone'::bin_zone
    ELSE 'inward_zone'::bin_zone
  END,
  5
FROM locations,
  (SELECT 'A1-' || LPAD(n::text, 2, '0') as bin FROM generate_series(1, 10) n
   UNION ALL SELECT 'A2-' || LPAD(n::text, 2, '0') FROM generate_series(1, 10) n
   UNION ALL SELECT 'B1-' || LPAD(n::text, 2, '0') FROM generate_series(1, 10) n
   UNION ALL SELECT 'B2-' || LPAD(n::text, 2, '0') FROM generate_series(1, 10) n
   UNION ALL SELECT 'C1-' || LPAD(n::text, 2, '0') FROM generate_series(1, 10) n
  ) bins_list
WHERE code = 'WH001';

-- Store bins
INSERT INTO bins (location_id, bin_code, bin_name, zone, status_zone, capacity)
SELECT id, 'STORE-' || LPAD(n::text, 2, '0'), 'Display Area ' || n, 'Sales Floor', 'ready_zone'::bin_zone, 3
FROM locations, generate_series(1, 5) n
WHERE type = 'store';

-- ============================================================================
-- STEP 8: ROW LEVEL SECURITY (basic - allow authenticated access)
-- ============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assembly_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE assembly_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE assembly_location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE bin_movement_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all data
CREATE POLICY "Allow authenticated read" ON user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON assembly_journeys FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON assembly_status_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON assembly_location_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON qc_checklists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON bins FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON bin_movement_history FOR SELECT TO authenticated USING (true);

-- Allow service role full access (backend uses service role key)
CREATE POLICY "Allow service role all" ON user_profiles FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role all" ON locations FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role all" ON assembly_journeys FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role all" ON assembly_status_history FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role all" ON assembly_location_history FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role all" ON qc_checklists FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role all" ON bins FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role all" ON bin_movement_history FOR ALL TO service_role USING (true);

-- ============================================================================
-- DONE! Now create users in Supabase Auth and run the user profile inserts.
-- ============================================================================
SELECT 'Full setup completed successfully!' as message;
