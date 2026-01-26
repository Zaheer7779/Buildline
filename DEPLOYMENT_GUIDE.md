# Complete Supabase Migrations for Buildline

**IMPORTANT:** Run these migrations IN ORDER in Supabase SQL Editor

## How to Run:

1. Login to https://app.supabase.com
2. Select your project
3. Go to **SQL Editor** → **New query**
4. Copy migration SQL below
5. Click **Run** (Ctrl/Cmd + Enter)
6. Wait for "Success" message
7. Move to next migration

---

## Migration Order:

1. ✅ 001_initial_schema.sql - Core tables and schema
2. ✅ 002_views_and_functions.sql - Business logic
3. ✅ 003_seed_data.sql - Sample locations
4. ✅ 008_add_bin_locations.sql - Bin management
5. ✅ 009_add_bin_to_views.sql - Update views for bins
6. ✅ 010_enhance_bin_zones.sql - Zone-based bins
7. ✅ 011_remove_qc_process.sql - **IMPORTANT** - Updates workflow to 4 stages

---

## Files Location:

All migration files are in: `supabase/migrations/`

Copy each file content and run in Supabase SQL Editor.

---

## After Migrations - Create Test Users:

### Step 1: Create Auth Users

Go to: **Authentication** → **Users** → **Add user**

Create these users:

1. **Supervisor:**
   - Email: `supervisor@test.com`
   - Password: `Test@123456`
   - Auto Confirm: ✅ Yes

2. **Technician:**
   - Email: `technician@test.com`
   - Password: `Test@123456`
   - Auto Confirm: ✅ Yes

3. **Admin:**
   - Email: `admin@test.com`
   - Password: `Test@123456`
   - Auto Confirm: ✅ Yes

### Step 2: Link Users to Profiles

Go to: **SQL Editor** → **New query**

**Get User IDs first:**

```sql
SELECT id, email FROM auth.users;
```

**Then insert profiles** (replace UUIDs with actual IDs from above):

```sql
-- Insert user profiles
INSERT INTO user_profiles (id, email, full_name, role, is_active) VALUES
  ('PASTE-SUPERVISOR-UUID-HERE', 'supervisor@test.com', 'Test Supervisor', 'supervisor', true),
  ('PASTE-TECHNICIAN-UUID-HERE', 'technician@test.com', 'Test Technician', 'technician', true),
  ('PASTE-ADMIN-UUID-HERE', 'admin@test.com', 'Test Admin', 'admin', true);
```

### Step 3: Test Login

1. Start your backend: `cd backend && npm run dev`
2. Start your frontend: `cd frontend && npm run dev`
3. Go to: http://localhost:3000
4. Login with: `supervisor@test.com` / `Test@123456`

---

## Quick Test Workflow:

### 1. Inward a Bike (Supervisor):

```sql
INSERT INTO assembly_journeys (
  barcode,
  model_sku,
  current_location_id,
  current_status
) VALUES (
  'TEST-001',
  'HERO-SPRINT-24',
  (SELECT id FROM locations WHERE code = 'WH001' LIMIT 1),
  'inwarded'
);
```

### 2. Assign to Technician:

```sql
SELECT assign_to_technician(
  'TEST-001'::TEXT,
  (SELECT id FROM user_profiles WHERE role = 'technician' LIMIT 1),
  (SELECT id FROM user_profiles WHERE role = 'supervisor' LIMIT 1)
);
```

### 3. Start Assembly:

```sql
SELECT start_assembly(
  'TEST-001'::TEXT,
  (SELECT id FROM user_profiles WHERE role = 'technician' LIMIT 1)
);
```

### 4. Complete Assembly:

```sql
SELECT complete_assembly(
  'TEST-001'::TEXT,
  (SELECT id FROM user_profiles WHERE role = 'technician' LIMIT 1),
  '{"tyres": true, "brakes": true, "gears": true}'::JSONB
);
```

### 5. Check if Ready for Invoice:

```sql
SELECT * FROM can_invoice_item('TEST-001');
```

Should return: `can_invoice = true`, `status = ready_for_sale`

---

## Environment Variables Needed:

### Backend (.env):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_URL=http://localhost:3001/api
```

### Get Your Supabase Keys:

1. Go to: https://app.supabase.com
2. Select your project
3. **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

---

## Troubleshooting:

### Error: "relation does not exist"
- Migration wasn't run or failed
- Re-run the specific migration

### Error: "function does not exist"
- Migration 002 wasn't run
- Re-run migration 002

### Error: "user profile not found"
- User exists in auth.users but not in user_profiles
- Run Step 2 above to link users

### Error: "violates check constraint"
- Checklist is incomplete
- All 3 items (tyres, brakes, gears) must be true

---

## Important Notes:

1. **Migration 011** removes QC process - workflow is now 4 stages:
   - inwarded → assigned → in_progress → ready_for_sale

2. **DO NOT** skip migrations - run in order

3. **Backup your database** before running migrations in production

4. **Test locally first** with development database

---

## Need Help?

Check these files:
- `CLAUDE.md` - Development guide
- `README.md` - Project overview
- `backend/src/services/assembly.service.js` - Business logic
- `supabase/migrations/` - All SQL files

GitHub Repo: https://github.com/Zaheer7779/Buildline
