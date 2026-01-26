# 🔧 QUICK FIX - Checklist Update Error

## Problem:
500 errors when clicking checklist items in technician workspace

## Solution Steps:

### Step 1: Restart Backend Server

1. Go to the terminal running backend (port 3001)
2. Press **Ctrl+C** to stop it
3. Run again:
   ```bash
   cd backend
   npm run dev
   ```
4. Watch for any startup errors

---

### Step 2: Check Bike Status in Database

Go to Supabase SQL Editor and run:

```sql
-- Check current status of DEMO-BIKE-001
SELECT
  barcode,
  current_status,
  technician_id,
  checklist,
  started_at,
  completed_at
FROM assembly_journeys
WHERE barcode = 'DEMO-BIKE-001';
```

**Expected result:**
- `current_status` should be **'in_progress'**
- `technician_id` should NOT be null
- `started_at` should have a timestamp

**If status is NOT 'in_progress'**, manually fix it:

```sql
-- Force bike into in_progress status
UPDATE assembly_journeys
SET
  current_status = 'in_progress',
  started_at = NOW()
WHERE barcode = 'DEMO-BIKE-001';
```

---

### Step 3: Test Again

1. Go back to technician dashboard
2. Refresh the page (F5)
3. Click on DEMO-BIKE-001 to open checklist
4. Try clicking one checkbox
5. Watch backend terminal for errors

---

### Step 4: If Still Failing - Manual Workaround

If checklist updates still fail, manually complete the bike in database:

```sql
-- Manually mark bike as completed with all checklist items done
UPDATE assembly_journeys
SET
  current_status = 'completed',
  completed_at = NOW(),
  checklist = '{"tyres": true, "brakes": true, "gears": true}'::jsonb
WHERE barcode = 'DEMO-BIKE-001';
```

Then:
1. Login as QC user (qc@test.com / Test123!)
2. The bike should now appear in QC dashboard
3. You can test the QC pass/fail workflow

---

### Step 5: Check Backend Logs

When you click a checkbox, look at the backend terminal. You should see:

✅ **Good:**
```
PUT /api/assembly/checklist 200
```

❌ **Bad (shows error):**
```
Update checklist error: [some error message]
PUT /api/assembly/checklist 500
```

**Copy and send me the exact error message** from backend logs so I can fix the root cause.

---

## Root Cause Analysis:

The `updateChecklist` method requires:
1. Bike status = 'in_progress' (not 'assigned')
2. Technician ID matches logged-in user
3. Valid auth token

Most likely issue: Bike didn't transition to 'in_progress' when you clicked "Start Assembly"

---

## Next Steps After Fix:

Once backend is restarted and bike is in correct status:
1. ✅ Complete checklist in technician workspace
2. ✅ Click "Complete Assembly"
3. ✅ Bike should move to 'completed' status
4. ✅ Login as QC and verify bike appears
5. ✅ Pass the bike in QC
6. ✅ Verify sales lock works
