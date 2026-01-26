-- ============================================================================
-- BUILDLINE: Add Bin Location Tracking
-- Migration 008: Storage Bin Management
-- ============================================================================

-- ============================================================================
-- Bins Table (Storage locations within warehouses/stores)
-- ============================================================================

CREATE TABLE bins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  bin_code TEXT NOT NULL, -- e.g., "A1-01", "B2-15", "RACK-05"
  bin_name TEXT, -- Optional description
  zone TEXT, -- Optional zone grouping (e.g., "Zone A", "Ground Floor")
  is_active BOOLEAN DEFAULT true,
  capacity INTEGER DEFAULT 1, -- How many bikes can fit
  current_occupancy INTEGER DEFAULT 0, -- How many bikes currently stored
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure bin_code is unique within each location
  CONSTRAINT unique_bin_per_location UNIQUE(location_id, bin_code),

  -- Ensure occupancy doesn't exceed capacity
  CONSTRAINT valid_occupancy CHECK (current_occupancy >= 0 AND current_occupancy <= capacity)
);

-- Add bin_location to assembly_journeys
ALTER TABLE assembly_journeys
  ADD COLUMN bin_location_id UUID REFERENCES bins(id);

-- Create index for faster lookups
CREATE INDEX idx_bins_location ON bins(location_id);
CREATE INDEX idx_bins_active ON bins(is_active) WHERE is_active = true;
CREATE INDEX idx_assembly_journeys_bin ON assembly_journeys(bin_location_id);

-- Trigger to auto-update bins.updated_at
CREATE TRIGGER update_bins_updated_at
  BEFORE UPDATE ON bins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Function: Update bin occupancy when bike is assigned to bin
-- ============================================================================

CREATE OR REPLACE FUNCTION update_bin_occupancy()
RETURNS TRIGGER AS $$
BEGIN
  -- If bin location changed
  IF OLD.bin_location_id IS DISTINCT FROM NEW.bin_location_id THEN

    -- Decrease occupancy from old bin
    IF OLD.bin_location_id IS NOT NULL THEN
      UPDATE bins
      SET current_occupancy = GREATEST(current_occupancy - 1, 0)
      WHERE id = OLD.bin_location_id;
    END IF;

    -- Increase occupancy in new bin
    IF NEW.bin_location_id IS NOT NULL THEN
      UPDATE bins
      SET current_occupancy = current_occupancy + 1
      WHERE id = NEW.bin_location_id;

      -- Check if bin is full
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

-- Also handle INSERT (when bike is first inwarded with bin)
CREATE OR REPLACE FUNCTION insert_bin_occupancy()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.bin_location_id IS NOT NULL THEN
    UPDATE bins
    SET current_occupancy = current_occupancy + 1
    WHERE id = NEW.bin_location_id;

    -- Check if bin is full
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

-- ============================================================================
-- Seed Sample Bins
-- ============================================================================

-- Main Warehouse bins
INSERT INTO bins (location_id, bin_code, bin_name, zone, capacity)
SELECT
  id,
  bin,
  'Rack ' || bin,
  CASE
    WHEN bin LIKE 'A%' THEN 'Zone A'
    WHEN bin LIKE 'B%' THEN 'Zone B'
    WHEN bin LIKE 'C%' THEN 'Zone C'
    ELSE 'General'
  END,
  5 -- Each bin can hold 5 bikes
FROM locations,
  (SELECT 'A1-' || LPAD(n::text, 2, '0') as bin FROM generate_series(1, 10) n
   UNION ALL
   SELECT 'A2-' || LPAD(n::text, 2, '0') FROM generate_series(1, 10) n
   UNION ALL
   SELECT 'B1-' || LPAD(n::text, 2, '0') FROM generate_series(1, 10) n
   UNION ALL
   SELECT 'B2-' || LPAD(n::text, 2, '0') FROM generate_series(1, 10) n
   UNION ALL
   SELECT 'C1-' || LPAD(n::text, 2, '0') FROM generate_series(1, 10) n
  ) bins_list
WHERE code = 'WH001';

-- Store bins (fewer bins for stores)
INSERT INTO bins (location_id, bin_code, bin_name, zone, capacity)
SELECT
  id,
  'STORE-' || LPAD(n::text, 2, '0'),
  'Display Area ' || n,
  'Sales Floor',
  3 -- Each store bin can hold 3 bikes
FROM locations, generate_series(1, 5) n
WHERE type = 'store';

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE bins IS 'Storage bin locations within warehouses and stores';
COMMENT ON COLUMN bins.bin_code IS 'Unique bin identifier within location (e.g., A1-01, RACK-05)';
COMMENT ON COLUMN bins.capacity IS 'Maximum number of bikes that can be stored';
COMMENT ON COLUMN bins.current_occupancy IS 'Current number of bikes in this bin';
COMMENT ON COLUMN assembly_journeys.bin_location_id IS 'Physical bin where the bike is currently stored';
