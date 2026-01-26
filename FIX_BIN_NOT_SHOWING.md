# Fix: Bin Location Not Showing in Technician Queue

## Problem
Bin location is not appearing in the technician's queue view.

## Root Cause
The database migrations haven't been run yet, so:
- `bins` table doesn't exist
- `bin_location_id` column is missing from `assembly_journeys`
- `get_technician_queue()` function doesn't return bin data

---

## Solution: Run Migrations in Correct Order

### Step 1: Verify Current State

Go to Supabase Dashboard → SQL Editor and run:

```sql
-- Check if bins table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'bins'
) as bins_table_exists;
```

**If it returns `FALSE`**, continue with Step 2.
**If it returns `TRUE`**, skip to Step 3.

---

### Step 2: Run Migration 008 (Create Bins)

1. Go to Supabase Dashboard → SQL Editor
2. Open file: `e:\2xg\Buildline\supabase\migrations\008_add_bin_locations.sql`
3. Copy the **ENTIRE** content
4. Paste in SQL Editor
5. Click **RUN**

**Expected Result:**
- ✅ Bins table created
- ✅ 50+ bins inserted (A1-01 to C1-10 for warehouse, STORE-01 to STORE-05 for stores)
- ✅ bin_location_id added to assembly_journeys
- ✅ Triggers created for occupancy tracking

---

### Step 3: Run Migration 009 (Update Views)

1. Go to Supabase Dashboard → SQL Editor
2. Open file: `e:\2xg\Buildline\supabase\migrations\009_add_bin_to_views.sql`
3. Copy the **ENTIRE** content
4. Paste in SQL Editor
5. Click **RUN**

**Expected Result:**
- ✅ `get_technician_queue()` function updated with bin_location
- ✅ `kanban_board` view updated with bin columns

---

### Step 4: Verify Setup

Run this verification query:

```sql
-- Check function returns bin_location
SELECT
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_columns
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_technician_queue';
```

**You should see `bin_location jsonb` in the return_columns.**

---

### Step 5: Test Inward with Bin Location

1. **Restart your backend server**:
   ```bash
   cd e:\2xg\Buildline\backend
   # Stop with Ctrl+C, then:
   npm start
   ```

2. **Refresh your frontend** (Ctrl+F5)

3. **Inward a new cycle**:
   - Fill in barcode, model, etc.
   - Select **Downtown Store (ST001)**
   - You should now see bins in the **Bin Location** dropdown:
     - STORE-01 - Display Area 1 (0/3)
     - STORE-02 - Display Area 2 (0/3)
     - etc.

4. **Select a bin** and click "Inward Cycle"

5. **Assign the cycle to a technician** (supervisor view)

6. **Login as technician** and check queue

7. **Bin should now appear** on the bike card:
   ```
   HERO-SPRINT-24-RED
   Barcode: CYCLE-123456-789
   Bin: STORE-01          ← THIS SHOULD NOW SHOW
   Assigned: 2 minutes ago
   ```

---

## Still Not Working?

### Check Backend Logs

Look for errors when calling `/api/assembly/technician/queue`

### Check Frontend Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors related to `bin_location`

### Manual Database Check

Run this to see if bin data is being stored:

```sql
SELECT
  aj.barcode,
  aj.model_sku,
  b.bin_code
FROM assembly_journeys aj
LEFT JOIN bins b ON aj.bin_location_id = b.id
WHERE aj.current_status IN ('assigned', 'in_progress')
LIMIT 5;
```

If `bin_code` is showing, then backend is storing it correctly.

---

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "No bins available at this location" | Run migration 008 to create bins |
| Dropdown disabled/empty | Select a location first, or bins don't exist |
| Bin not showing in queue | Run migration 009 to update function |
| UUID error when selecting bin | Restart backend server |
| "Bin is at full capacity" | Select a different bin or increase capacity |

---

## Summary

**Run these in order:**
1. ✅ Migration 008 → Creates bins
2. ✅ Migration 009 → Updates queue function
3. ✅ Restart backend
4. ✅ Refresh frontend
5. ✅ Test by inwarding a cycle with bin location

After these steps, bin locations should appear everywhere!
