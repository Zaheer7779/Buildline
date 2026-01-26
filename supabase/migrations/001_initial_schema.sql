-- ============================================================================
-- BUILDLINE: Cycle Assembly Journey Tracking System
-- Migration 001: Initial Schema Setup
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- User roles
CREATE TYPE user_role AS ENUM (
  'admin',
  'supervisor',
  'technician',
  'qc_person',
  'warehouse_staff'
);

-- Assembly status stages (6 mandatory stages)
CREATE TYPE assembly_status AS ENUM (
  'inwarded',           -- Stage 1: 50% assembled, just received
  'assigned',           -- Stage 2: Assigned to technician
  'in_progress',        -- Stage 3: Technician working on it
  'completed',          -- Stage 4: Assembly checklist completed
  'qc_review',          -- Stage 5: Under QC inspection
  'ready_for_sale'      -- Stage 6: QC passed, 100% ready
);

-- QC result
CREATE TYPE qc_result AS ENUM (
  'pending',
  'pass',
  'fail'
);

-- Location types
CREATE TYPE location_type AS ENUM (
  'warehouse',
  'store'
);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- User Profiles (extends Supabase auth.users)
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

-- Locations (Warehouses and Stores)
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  type location_type NOT NULL,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assembly Journeys (Main table - Single source of truth)
CREATE TABLE assembly_journeys (
  -- Primary identifiers
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barcode TEXT UNIQUE NOT NULL,
  model_sku TEXT NOT NULL,
  frame_number TEXT,

  -- Current state
  current_status assembly_status NOT NULL DEFAULT 'inwarded',
  current_location_id UUID REFERENCES locations(id),
  priority BOOLEAN DEFAULT false,

  -- Checklist (3 items: tyres, brakes, gears)
  checklist JSONB DEFAULT '{"tyres": false, "brakes": false, "gears": false}'::jsonb,

  -- Assembly details
  technician_id UUID REFERENCES user_profiles(id),
  supervisor_id UUID REFERENCES user_profiles(id),
  qc_person_id UUID REFERENCES user_profiles(id),

  -- Timestamps for each stage
  inwarded_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  qc_started_at TIMESTAMPTZ,
  qc_completed_at TIMESTAMPTZ,

  -- Flags and metadata
  parts_missing BOOLEAN DEFAULT false,
  parts_missing_list TEXT[],
  damage_reported BOOLEAN DEFAULT false,
  damage_notes TEXT,
  damage_photos TEXT[],
  assembly_paused BOOLEAN DEFAULT false,
  pause_reason TEXT,

  -- QC information
  qc_status qc_result DEFAULT 'pending',
  qc_failure_reason TEXT,
  qc_photos TEXT[],
  rework_count INTEGER DEFAULT 0,

  -- GRN reference
  grn_reference TEXT,

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT checklist_structure CHECK (
    checklist ? 'tyres' AND
    checklist ? 'brakes' AND
    checklist ? 'gears'
  )
);

-- Status History (Audit trail for every status change)
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

-- Location History (Track bike movements)
CREATE TABLE assembly_location_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journey_id UUID NOT NULL REFERENCES assembly_journeys(id) ON DELETE CASCADE,
  from_location_id UUID REFERENCES locations(id),
  to_location_id UUID NOT NULL REFERENCES locations(id),
  moved_by UUID NOT NULL REFERENCES user_profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- QC Checklists (Detailed QC inspection records)
CREATE TABLE qc_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journey_id UUID NOT NULL REFERENCES assembly_journeys(id) ON DELETE CASCADE,
  qc_person_id UUID NOT NULL REFERENCES user_profiles(id),

  -- QC items
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

  -- Overall result
  result qc_result NOT NULL,
  failure_reason TEXT,
  photos TEXT[],

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

CREATE INDEX idx_assembly_journeys_barcode ON assembly_journeys(barcode);
CREATE INDEX idx_assembly_journeys_status ON assembly_journeys(current_status);
CREATE INDEX idx_assembly_journeys_technician ON assembly_journeys(technician_id);
CREATE INDEX idx_assembly_journeys_location ON assembly_journeys(current_location_id);
CREATE INDEX idx_assembly_journeys_priority ON assembly_journeys(priority) WHERE priority = true;
CREATE INDEX idx_status_history_journey ON assembly_status_history(journey_id);
CREATE INDEX idx_location_history_journey ON assembly_location_history(journey_id);
CREATE INDEX idx_qc_checklists_journey ON qc_checklists(journey_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
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

-- Auto-log status changes
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_status IS DISTINCT FROM NEW.current_status THEN
    INSERT INTO assembly_status_history (
      journey_id,
      from_status,
      to_status,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.current_status,
      NEW.current_status,
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
      journey_id,
      from_location_id,
      to_location_id,
      moved_by
    ) VALUES (
      NEW.id,
      OLD.current_location_id,
      NEW.current_location_id,
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

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE assembly_journeys IS 'Single source of truth for bike assembly tracking';
COMMENT ON COLUMN assembly_journeys.barcode IS 'Unique bike identifier (scanned by technician)';
COMMENT ON COLUMN assembly_journeys.model_sku IS 'Bike model name/SKU';
COMMENT ON COLUMN assembly_journeys.current_status IS 'Assembly workflow status (6 mandatory stages)';
COMMENT ON COLUMN assembly_journeys.checklist IS 'Simple 3-item checklist: tyres, brakes, gears';
COMMENT ON COLUMN assembly_journeys.rework_count IS 'Auto-incremented when QC fails and sends back';
