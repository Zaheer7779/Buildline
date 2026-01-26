# Bin Location Tracking System - Implementation Guide

## Overview

The bin location tracking system allows you to assign specific storage bins to each cycle during the inward process. This helps warehouse staff quickly locate cycles and manage storage space efficiently.

---

## What's New

### Database Changes
- ✅ **New `bins` table** - Stores all bin locations (A1-01, A2-05, etc.)
- ✅ **`bin_location_id` field** - Added to `assembly_journeys` table
- ✅ **Automatic occupancy tracking** - Bins track how many cycles are stored
- ✅ **Capacity management** - Prevents overfilling bins

### Backend Changes
- ✅ **3 new API endpoints** for bin management
- ✅ **Updated views** to include bin location data
- ✅ **Updated functions** (get_technician_queue, kanban_board)

### Frontend Changes
- ✅ **Bin location dropdown** on Inward Bike form
- ✅ **Bin display** in technician queue view
- ✅ **Bin display** in kanban board

---

## Step-by-Step Implementation

### Step 1: Run Database Migrations

Run the migrations in order:

```bash
# Migration 008: Creates bins table and bin tracking
supabase migration up 008_add_bin_locations.sql

# Migration 009: Updates views and functions
supabase migration up 009_add_bin_to_views.sql
```

**Or manually via Supabase Dashboard:**
1. Go to SQL Editor in Supabase Dashboard
2. Copy content from `supabase/migrations/008_add_bin_locations.sql`
3. Click "Run"
4. Repeat for `009_add_bin_to_views.sql`

### Step 2: Verify Database Setup

Check that bins were created:

```sql
-- Check Main Warehouse bins
SELECT * FROM bins WHERE location_id = (SELECT id FROM locations WHERE code = 'WH001');

-- Check Store bins
SELECT * FROM bins WHERE location_id IN (SELECT id FROM locations WHERE type = 'store');

-- Should see:
-- - 50 bins for Main Warehouse (A1-01 to C1-10)
-- - 5 bins per store
```

### Step 3: Restart Backend Server

```bash
cd backend
npm start
```

The backend now includes 3 new endpoints:
- `GET /api/assembly/bins` - Get all bins
- `GET /api/assembly/bins/location/:locationId` - Get bins for a specific location
- `GET /api/assembly/bins/available?location_id=xxx` - Get available bins (not full)

### Step 4: Restart Frontend

```bash
cd frontend
npm start
```

---

## How to Use the Bin Location System

### For Warehouse Staff (Inward Process)

1. **Navigate to Inward Bike form**
2. **Fill in cycle details** (Barcode, Model SKU, etc.)
3. **Select Location** (e.g., Main Warehouse)
4. **Select Bin Location** (dropdown will show available bins)
   - Bins display as: `A1-01 - Rack A1-01 (0/5)`
   - Numbers show: current occupancy / total capacity
5. **Click "Inward Cycle"**

The bin location is **optional** - you can skip it if needed.

### For Technicians (Queue View)

When viewing your queue, each bike card now shows:
- **Barcode**: DEMO-BIKE-001
- **Bin**: A1-05 ← **NEW!**
- **Assigned**: 26 minutes ago

This helps technicians quickly find the cycle in the warehouse.

### For Supervisors (Kanban Board)

The Kanban board now includes:
- **Bin Code**: A1-05
- **Bin Zone**: Zone A

This helps supervisors see where cycles are physically located.

---

## Bin Naming Convention

The default bin codes follow this pattern:

| Pattern | Example | Description |
|---------|---------|-------------|
| `A1-01` | Zone A, Row 1, Position 01 | Warehouse bins |
| `B2-15` | Zone B, Row 2, Position 15 | Warehouse bins |
| `STORE-01` | Store Display Area 1 | Store bins |

### Customizing Bin Names

To add custom bins:

```sql
INSERT INTO bins (location_id, bin_code, bin_name, zone, capacity)
VALUES (
  (SELECT id FROM locations WHERE code = 'WH001'),
  'CUSTOM-01',
  'Special Storage Rack 1',
  'Special Zone',
  10  -- Capacity: 10 bikes
);
```

---

## Bin Features

### 1. Automatic Occupancy Tracking

When you assign a cycle to a bin:
- ✅ Bin's `current_occupancy` increases automatically
- ✅ When cycle moves/sells, occupancy decreases

### 2. Capacity Management

Bins have capacity limits:
- Default: 5 bikes per warehouse bin
- Default: 3 bikes per store bin
- **System prevents overfilling** - you'll see an error if bin is full

### 3. Zone Grouping

Bins are organized by zones:
- **Zone A** - A1-01 to A2-10
- **Zone B** - B1-01 to B2-10
- **Zone C** - C1-01 to C1-10

This helps organize large warehouses.

### 4. Available Bins Filter

The dropdown only shows bins that:
- ✅ Are active (`is_active = true`)
- ✅ Have available space (`current_occupancy < capacity`)
- ✅ Belong to the selected location

---

## API Endpoints

### Get All Bins
```javascript
GET /api/assembly/bins

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "bin_code": "A1-01",
      "bin_name": "Rack A1-01",
      "zone": "Zone A",
      "capacity": 5,
      "current_occupancy": 2,
      "location": {
        "name": "Main Warehouse",
        "code": "WH001"
      }
    }
  ]
}
```

### Get Bins by Location
```javascript
GET /api/assembly/bins/location/:locationId

Response:
{
  "success": true,
  "data": [/* bins for that location */]
}
```

### Get Available Bins
```javascript
GET /api/assembly/bins/available?location_id=xxx

Response:
{
  "success": true,
  "data": [/* only bins with available space */]
}
```

---

## Database Schema

### Bins Table

```sql
CREATE TABLE bins (
  id UUID PRIMARY KEY,
  location_id UUID REFERENCES locations(id),
  bin_code TEXT NOT NULL,           -- "A1-01", "B2-15"
  bin_name TEXT,                    -- "Rack A1-01"
  zone TEXT,                        -- "Zone A"
  is_active BOOLEAN DEFAULT true,
  capacity INTEGER DEFAULT 1,       -- Max bikes
  current_occupancy INTEGER,        -- Current bikes
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,

  UNIQUE(location_id, bin_code)
);
```

### Assembly Journeys (Updated)

```sql
ALTER TABLE assembly_journeys
  ADD COLUMN bin_location_id UUID REFERENCES bins(id);
```

---

## Troubleshooting

### "Bin is at full capacity" Error

**Problem**: Trying to inward a cycle into a full bin

**Solution**:
1. Choose a different bin from the dropdown
2. Or increase bin capacity:
   ```sql
   UPDATE bins SET capacity = 10 WHERE bin_code = 'A1-01';
   ```

### Bins Not Showing in Dropdown

**Problem**: Dropdown is empty or disabled

**Check**:
1. Is a location selected?
2. Are there bins for that location?
   ```sql
   SELECT * FROM bins WHERE location_id = 'your-location-id';
   ```
3. Are bins at full capacity?
   ```sql
   SELECT * FROM bins
   WHERE location_id = 'your-location-id'
   AND current_occupancy < capacity;
   ```

### Wrong Occupancy Count

**Problem**: Bin shows wrong number of cycles

**Fix**:
```sql
-- Recalculate occupancy for a bin
UPDATE bins b
SET current_occupancy = (
  SELECT COUNT(*)
  FROM assembly_journeys aj
  WHERE aj.bin_location_id = b.id
)
WHERE b.id = 'bin-uuid';
```

---

## Next Steps

### Recommended Enhancements

1. **Bin Management UI**
   - Create admin page to add/edit/deactivate bins
   - View bin occupancy heatmap

2. **Bin Reports**
   - Most utilized bins
   - Empty bins
   - Bins needing maintenance

3. **Barcode Scanning**
   - Scan bin barcode during inward process
   - Faster bin selection

4. **Bin Alerts**
   - Alert when bin is almost full (80% capacity)
   - Alert when bins are empty for rebalancing

---

## Summary

✅ **Database**: 2 new migrations create bins table and update views
✅ **Backend**: 3 new API endpoints + updated service functions
✅ **Frontend**: Bin dropdown on Inward form + display in queue view
✅ **Features**: Auto occupancy tracking, capacity management, zone organization

**Result**: Warehouse staff can now track exactly where each cycle is stored!

---

## Support

If you encounter issues:
1. Check migration files ran successfully
2. Verify bins exist in database
3. Check backend logs for API errors
4. Check browser console for frontend errors

---

**Last Updated**: 2026-01-23
**Version**: 1.0
