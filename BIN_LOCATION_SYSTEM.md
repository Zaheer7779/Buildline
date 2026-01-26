# Bin Location System - Implementation Guide

## Overview

The Buildline system now includes a comprehensive **zone-based bin location management system** that automatically tracks items through the assembly workflow with proper bin assignments.

## Status Workflow

Items progress through 6 mandatory stages with automatic bin assignment:

### 1. Inwarded (50% Assembled)
- **Status**: `inwarded`
- **Zone**: Inward Zone
- **Label**: "Inwarded"
- Item just received, 50% assembled

### 2. Assigned for Assembly
- **Status**: `assigned`
- **Zone**: Assembly Zone
- **Label**: "Assigned for Assembly"
- Item assigned to a technician

### 3. Assembly in Progress
- **Status**: `in_progress`
- **Zone**: Assembly Zone
- **Label**: "Assembly in Progress"
- Technician actively working on assembly

### 4. Assembly Completed
- **Status**: `completed`
- **Zone**: Completion Zone
- **Label**: "Assembly Completed"
- Assembly finished, waiting for QC

### 5. Quality Check (QC)
- **Status**: `qc_review`
- **Zone**: QC Zone
- **Label**: "Quality Check (QC)"
- Under quality inspection

### 6. Ready for Sale (100%)
- **Status**: `ready_for_sale`
- **Zone**: Ready Zone
- **Label**: "Ready for Sale (100%)"
- QC passed, fully assembled and ready

## Bin Zones

Bins are organized into zones that correspond to workflow stages:

| Zone | Purpose | Statuses |
|------|---------|----------|
| **Inward Zone** | New arrivals | Inwarded |
| **Assembly Zone** | Active assembly | Assigned, In Progress |
| **Completion Zone** | Completed assemblies | Assembly Completed |
| **QC Zone** | Quality inspection | QC Review |
| **Ready Zone** | Finished products | Ready for Sale |

## Automatic Bin Assignment

The system automatically assigns bikes to appropriate bins when status changes:

1. **Status Change Trigger**: When a bike's status changes, a database trigger fires
2. **Zone Determination**: System determines the target zone based on new status
3. **Bin Selection**: Finds an available bin in the target zone (least occupied first)
4. **Assignment**: Automatically updates the bike's bin location
5. **History Tracking**: Logs the movement in `bin_movement_history` table

### Example Flow:
```
Bike Inwarded (Status: inwarded)
  → Auto-assigned to bin A1-01 in Inward Zone

Technician Assigned (Status: assigned)
  → Auto-moved to bin A2-05 in Assembly Zone

Assembly Started (Status: in_progress)
  → Remains in Assembly Zone

Assembly Completed (Status: completed)
  → Auto-moved to bin B2-03 in Completion Zone

QC Started (Status: qc_review)
  → Auto-moved to bin C1-02 in QC Zone

QC Passed (Status: ready_for_sale)
  → Auto-moved to bin STORE-01 in Ready Zone
```

## Database Schema

### Tables

#### `bins`
```sql
- id: UUID (Primary Key)
- location_id: UUID (Foreign Key to locations)
- bin_code: TEXT (e.g., "A1-01", "B2-15")
- bin_name: TEXT (Optional description)
- zone: TEXT (Optional area grouping)
- status_zone: bin_zone (ENUM: Zone designation)
- bin_status: bin_status (ENUM: active, maintenance, full, inactive)
- is_active: BOOLEAN
- capacity: INTEGER (Max bikes)
- current_occupancy: INTEGER (Current bikes)
```

#### `bin_movement_history`
```sql
- id: UUID (Primary Key)
- journey_id: UUID (Foreign Key to assembly_journeys)
- from_bin_id: UUID (Foreign Key to bins)
- to_bin_id: UUID (Foreign Key to bins)
- from_status: assembly_status
- to_status: assembly_status
- moved_by: UUID (Foreign Key to user_profiles)
- reason: TEXT
- auto_assigned: BOOLEAN (True for automatic movements)
- created_at: TIMESTAMPTZ
```

### Functions

#### `auto_assign_bin_on_status_change()`
Automatically assigns bikes to appropriate bins when status changes.

#### `move_bike_to_bin(barcode, bin_id, moved_by, reason)`
Manually move a bike to a specific bin with reason tracking.

#### `get_bins_by_zone(location_id, zone)`
Get all bins in a specific zone for a location.

### Views

#### `bin_zone_statistics`
Real-time statistics for bin utilization by zone:
- Total bins per zone
- Total capacity
- Current occupancy
- Available slots
- Occupancy percentage

#### `kanban_board`
Enhanced view including bin zone information for all bikes.

## API Endpoints

### Bin Zones

#### GET `/api/assembly/bins/zones?location_id={uuid}`
Get all available bin zones for a location.

**Response:**
```json
{
  "success": true,
  "data": ["inward_zone", "assembly_zone", "completion_zone", "qc_zone", "ready_zone"]
}
```

#### GET `/api/assembly/bins/zone/{locationId}/{zone}`
Get all bins in a specific zone.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "bin_code": "A1-01",
      "bin_name": "Rack A1-01",
      "zone": "Zone A",
      "status_zone": "inward_zone",
      "capacity": 5,
      "current_occupancy": 3,
      "available_slots": 2,
      "bin_status": "active"
    }
  ]
}
```

#### GET `/api/assembly/bins/zone-statistics?location_id={uuid}`
Get occupancy statistics for all zones.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "location_id": "uuid",
      "location_name": "Main Warehouse",
      "status_zone": "inward_zone",
      "total_bins": 10,
      "total_capacity": 50,
      "total_occupancy": 35,
      "available_slots": 15,
      "occupancy_percentage": 70.00
    }
  ]
}
```

### Bin Movement

#### POST `/api/assembly/bins/move`
Manually move a bike to a specific bin.

**Request:**
```json
{
  "barcode": "BIKE123",
  "bin_id": "uuid",
  "reason": "Manual relocation for priority order"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bike moved to new bin successfully",
  "journey_id": "uuid",
  "old_bin_id": "uuid",
  "new_bin_id": "uuid"
}
```

#### GET `/api/assembly/bins/movement-history/{journeyId}`
Get bin movement history for a bike.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "from_bin": {
        "bin_code": "A1-01",
        "bin_name": "Rack A1-01",
        "status_zone": "inward_zone"
      },
      "to_bin": {
        "bin_code": "A2-05",
        "bin_name": "Rack A2-05",
        "status_zone": "assembly_zone"
      },
      "from_status": "inwarded",
      "to_status": "assigned",
      "moved_by_user": {
        "full_name": "John Doe",
        "email": "john@example.com"
      },
      "auto_assigned": true,
      "created_at": "2026-01-24T10:30:00Z"
    }
  ]
}
```

## Frontend Components

### StatusBadge Component
Display status with proper labels and colors.

```jsx
import StatusBadge from './components/assembly/StatusBadge';

<StatusBadge status="inwarded" />
<StatusBadge status="in_progress" showProgress={true} />
```

### BinZoneView Component
Visualize bin zones with occupancy statistics.

```jsx
import BinZoneView from './components/assembly/BinZoneView';

<BinZoneView locationId={locationId} />
```

### Constants and Helpers

```javascript
import {
  getStatusLabel,
  getZoneLabel,
  getStatusColor,
  getZoneColor,
  getProgressPercentage,
  getZoneForStatus
} from './constants/assemblyConstants';

// Get status label
const label = getStatusLabel('inwarded'); // "Inwarded"

// Get zone for status
const zone = getZoneForStatus('assigned'); // "assembly_zone"

// Get progress percentage
const progress = getProgressPercentage('qc_review'); // 83
```

## Migration Instructions

### 1. Run Database Migration

Execute the migration file:
```bash
psql -h your-db-host -U your-user -d your-database -f supabase/migrations/010_enhance_bin_zones.sql
```

Or use Supabase CLI:
```bash
supabase db push
```

### 2. Verify Migration

Check that zones are properly assigned:
```sql
SELECT status_zone, COUNT(*) as bin_count
FROM bins
WHERE is_active = true
GROUP BY status_zone
ORDER BY status_zone;
```

### 3. Test Automatic Assignment

Create a test journey and verify bin assignment:
```sql
-- Check current bin
SELECT barcode, current_status, bin_location_id FROM assembly_journeys WHERE barcode = 'TEST001';

-- Update status and verify auto-assignment
UPDATE assembly_journeys SET current_status = 'assigned' WHERE barcode = 'TEST001';

-- Check bin movement history
SELECT * FROM bin_movement_history WHERE journey_id = (SELECT id FROM assembly_journeys WHERE barcode = 'TEST001');
```

## Benefits

1. **Automatic Organization**: Bikes automatically move to appropriate zones as they progress
2. **Real-Time Tracking**: Always know where each bike is located
3. **Capacity Management**: Prevent bin overflow with capacity limits
4. **Audit Trail**: Complete history of all bin movements
5. **Visual Dashboard**: See zone occupancy at a glance
6. **Optimized Workflow**: Bins organized by workflow stage for efficient operations

## Best Practices

1. **Bin Naming**: Use consistent naming conventions (e.g., A1-01, A1-02)
2. **Zone Configuration**: Configure bins according to your physical layout
3. **Capacity Setting**: Set realistic bin capacities based on physical space
4. **Regular Monitoring**: Monitor zone statistics to identify bottlenecks
5. **Manual Override**: Use manual bin movement only when necessary
6. **History Review**: Regularly review movement history for optimization opportunities

## Troubleshooting

### Bin Not Auto-Assigned
- Verify the target zone has active bins
- Check bin capacity (might be full)
- Ensure location_id matches between bike and bins

### Occupancy Mismatch
- Run occupancy recalculation:
```sql
UPDATE bins SET current_occupancy = (
  SELECT COUNT(*) FROM assembly_journeys WHERE bin_location_id = bins.id
);
```

### Zone Statistics Not Showing
- Verify bins have status_zone set
- Check that bins.is_active = true
- Ensure location_id filter is correct
