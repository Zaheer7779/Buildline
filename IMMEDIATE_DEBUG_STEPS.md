# 🔍 IMMEDIATE DEBUG STEPS

## The Problem:
When you click checklist items, the frontend calls:
```
PUT http://localhost:3001/api/assembly/checklist
```

This is returning 500 error, which means backend is crashing.

---

## Step 1: CHECK IF BACKEND IS RUNNING

Look at your backend terminal. Do you see this error pattern repeating?
```
Update checklist error: [some message]
PUT /api/assembly/checklist 500
```

If backend crashed (terminal shows nothing or "Terminated"), restart it:
```bash
cd backend
npm run dev
```

---

## Step 2: ADD DEBUG LOGGING TO BACKEND

We need to see WHY it's failing. Let's add better logging.

### Open this file:
`backend/src/controllers/assembly.controller.js`

### Find line 142 (updateChecklist function) and replace it with:

```javascript
async updateChecklist(req, res) {
  try {
    console.log('===== UPDATE CHECKLIST DEBUG =====');
    console.log('Request body:', req.body);
    console.log('User profile:', req.profile);
    console.log('Technician ID:', req.profile?.id);
    console.log('==================================');

    const { barcode, checklist } = req.body;
    const technician_id = req.profile.id;

    const journey = await assemblyService.updateChecklist(
      barcode,
      technician_id,
      checklist
    );

    console.log('✅ Update successful:', journey);

    res.json({
      success: true,
      data: journey
    });
  } catch (error) {
    console.error('❌ Update checklist error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details
    });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update checklist'
    });
  }
}
```

### Save the file and restart backend:
```bash
# Stop backend (Ctrl+C)
npm run dev
```

---

## Step 3: TEST AGAIN AND WATCH LOGS

1. Go back to browser
2. Login as technician (tech@test.com / Test123!)
3. Click on DEMO-BIKE-001
4. Click ONE checkbox (e.g., Tyres)
5. **IMMEDIATELY** look at backend terminal

### What you should see:

#### ✅ GOOD (if working):
```
===== UPDATE CHECKLIST DEBUG =====
Request body: { barcode: 'DEMO-BIKE-001', checklist: { tyres: true, brakes: false, gears: false } }
User profile: { id: 'xxx-xxx-xxx', email: 'tech@test.com', role: 'technician', full_name: 'John Technician' }
Technician ID: xxx-xxx-xxx
==================================
✅ Update successful: { id: '...', barcode: 'DEMO-BIKE-001', ... }
PUT /api/assembly/checklist 200
```

#### ❌ BAD (if failing):
```
===== UPDATE CHECKLIST DEBUG =====
Request body: { barcode: 'DEMO-BIKE-001', checklist: { tyres: true, brakes: false, gears: false } }
User profile: undefined   <--- THIS IS THE PROBLEM
Technician ID: undefined
==================================
❌ Update checklist error: Cannot read property 'id' of undefined
Error details: { message: 'Cannot read property...', ... }
PUT /api/assembly/checklist 500
```

**COPY THE ENTIRE ERROR OUTPUT** and send it to me!

---

## Step 4: COMMON ISSUES AND FIXES

### Issue A: "User profile is undefined"
**Cause:** Auth middleware not working
**Fix:** Check if you're logged in, check JWT token

### Issue B: "No rows returned"
**Cause:** Bike is not in 'in_progress' status
**Fix:** Run this SQL:
```sql
-- Check bike status
SELECT barcode, current_status, technician_id, started_at
FROM assembly_journeys
WHERE barcode = 'DEMO-BIKE-001';

-- If status is 'assigned', manually change to 'in_progress'
UPDATE assembly_journeys
SET current_status = 'in_progress',
    started_at = NOW()
WHERE barcode = 'DEMO-BIKE-001';
```

### Issue C: "Technician ID doesn't match"
**Cause:** Bike assigned to different technician
**Fix:** Re-assign bike or login as correct technician

---

## Step 5: MANUAL WORKAROUND (Skip Checklist)

If you just want to test QC workflow RIGHT NOW without fixing backend:

```sql
-- Manually complete the bike
UPDATE assembly_journeys
SET
  current_status = 'completed',
  completed_at = NOW(),
  checklist = '{"tyres": true, "brakes": true, "gears": true}'::jsonb
WHERE barcode = 'DEMO-BIKE-001';

-- Verify
SELECT barcode, current_status, checklist, completed_at
FROM assembly_journeys
WHERE barcode = 'DEMO-BIKE-001';
```

Then:
1. Logout
2. Login as QC (qc@test.com / Test123!)
3. You should see the bike in QC dashboard
4. Test pass/fail workflow

---

## Next Steps:

After you add the debug logging and test again, send me:
1. ✅ Full console output from backend terminal
2. ✅ Screenshot of browser error (if any)
3. ✅ Current status of bike from SQL query

I'll fix the root cause immediately!
