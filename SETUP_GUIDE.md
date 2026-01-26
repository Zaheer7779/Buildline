# 🚀 Quick Setup Guide - Buildline

## Step-by-Step Setup (30 minutes)

### Step 1: Create Supabase Project (5 min)

1. Go to https://supabase.com
2. Click "New Project"
3. Fill in:
   - **Name:** Buildline
   - **Database Password:** (save this!)
   - **Region:** Choose closest to you
4. Wait for project to initialize (~2 min)
5. Note down:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### Step 2: Setup Database (5 min)

1. In Supabase Dashboard, go to **SQL Editor**
2. Create a new query
3. Copy entire content of `supabase/migrations/001_initial_schema.sql`
4. Click **Run**
5. Repeat for `002_views_and_functions.sql`
6. Repeat for `003_seed_data.sql` (optional)

**Verify:** Go to Table Editor, you should see tables:
- ✅ user_profiles
- ✅ locations
- ✅ assembly_journeys
- ✅ assembly_status_history

### Step 3: Create Test Users (5 min)

1. In Supabase Dashboard, go to **Authentication**
2. Click **Add User** → **Create new user**
3. Create 3 users:

**Technician:**
- Email: `tech@test.com`
- Password: `Test123!`
- Confirm email: ✅

**Supervisor:**
- Email: `supervisor@test.com`
- Password: `Test123!`
- Confirm email: ✅

**QC Person:**
- Email: `qc@test.com`
- Password: `Test123!`
- Confirm email: ✅

4. **Important:** Copy each user's UUID from the user list

### Step 4: Create User Profiles (3 min)

1. Go back to **SQL Editor**
2. Run this (replace UUIDs with actual UUIDs from step 3):

```sql
-- Replace these UUIDs with actual ones from Auth → Users
INSERT INTO user_profiles (id, email, full_name, role, is_active) VALUES
  ('paste-tech-uuid-here', 'tech@test.com', 'John Technician', 'technician', true),
  ('paste-supervisor-uuid-here', 'supervisor@test.com', 'Jane Supervisor', 'supervisor', true),
  ('paste-qc-uuid-here', 'qc@test.com', 'Bob QC', 'qc_person', true);
```

3. **Verify:** Go to Table Editor → user_profiles
   - You should see 3 rows

### Step 5: Create Locations (2 min)

```sql
INSERT INTO locations (name, code, type, address) VALUES
  ('Main Warehouse', 'WH001', 'warehouse', '123 Warehouse St'),
  ('Retail Store', 'ST001', 'store', '456 Main St');
```

### Step 6: Backend Setup (5 min)

```bash
cd backend

# Install dependencies (takes ~2 min)
npm install

# Create .env file
cp .env.example .env
```

Edit `backend/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-from-step-1
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-step-1
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

Start backend:
```bash
npm run dev
```

**Verify:** Open http://localhost:3001/health
- Should see: `{"success": true, "message": "Buildline API is running"}`

### Step 7: Frontend Setup (5 min)

Open **new terminal**:

```bash
cd frontend

# Install dependencies (takes ~2 min)
npm install

# Create .env file
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-from-step-1
VITE_API_URL=http://localhost:3001/api
```

Start frontend:
```bash
npm run dev
```

**Verify:** Open http://localhost:3000
- Should see login page

## Step 8: Test the System (5 min)

### Test 1: Login as Technician

1. Go to http://localhost:3000
2. Login:
   - Email: `tech@test.com`
   - Password: `Test123!`
3. Should see: **Technician Workspace**
4. Should show: "0 bikes in your queue"

✅ Success!

### Test 2: Create Test Bike (via SQL)

1. Go to Supabase → SQL Editor
2. Run:

```sql
-- Get location ID first
SELECT id FROM locations WHERE code = 'WH001';

-- Create test bike (replace location_id with actual UUID from above)
INSERT INTO assembly_journeys (
  barcode,
  model_sku,
  frame_number,
  current_status,
  current_location_id,
  grn_reference
) VALUES (
  'TEST-BIKE-001',
  'HERO-SPRINT-24',
  'FRAME001',
  'inwarded',
  'paste-warehouse-location-id-here',
  'GRN-TEST-001'
);
```

### Test 3: Assign Bike (as Supervisor)

1. Logout (if logged in)
2. Login as:
   - Email: `supervisor@test.com`
   - Password: `Test123!`
3. Should see: **Supervisor Dashboard**
4. Click: **Assign Bikes**
5. Select the test bike
6. Choose technician: **John Technician**
7. Click: **Assign**

✅ Bike assigned!

### Test 4: Complete Assembly (as Technician)

1. Logout
2. Login as: `tech@test.com`
3. Should see: 1 bike in "Assigned to You"
4. Click the bike card
5. Check all 3 items:
   - ✅ Tyres
   - ✅ Brakes
   - ✅ Gears
6. Click: **Complete Assembly & Send for QC**

✅ Assembly complete!

### Test 5: QC Pass (as QC Person)

1. Logout
2. Login as: `qc@test.com`
3. Should see: 1 bike pending QC
4. Click: **Start QC Review**
5. Click: **PASS** button
6. Click: **Submit QC PASS ✓**

✅ Bike now ready for sale!

### Test 6: Sales Lock

1. Go to Supabase → SQL Editor
2. Run:

```sql
SELECT * FROM can_invoice_item('TEST-BIKE-001');
```

**Result should be:**
```
can_invoice: true
message: "Ready for sale - QC passed"
```

✅ Sales lock working!

## 🎉 Setup Complete!

You now have:
- ✅ Database with all tables
- ✅ 3 test users (technician, supervisor, qc)
- ✅ Backend API running
- ✅ Frontend running
- ✅ Complete workflow tested

## Next Steps

### For Production:

1. **Deploy Backend:**
   - Use Railway, Heroku, or similar
   - Set production env vars
   - Point to your production Supabase

2. **Deploy Frontend:**
   - Use Vercel (recommended)
   - Set production env vars
   - Update CORS_ORIGIN in backend

3. **Create Real Users:**
   - Remove test users
   - Create actual staff accounts
   - Assign proper roles

4. **Customize:**
   - Update branding colors
   - Add your logo
   - Configure locations

5. **Integrate with Your ERP:**
   - Use `can_invoice_item()` function
   - Call before creating invoices
   - Block sales if QC not passed

## Common Issues

### Backend won't start
```bash
# Check Node version
node --version  # Should be 18+

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Frontend shows blank page
```bash
# Check browser console for errors
# Verify .env file exists and has correct values
# Try clearing browser cache
```

### Can't login
```bash
# Verify user exists in Supabase Auth
# Check user profile exists in user_profiles table
# Verify .env has correct Supabase keys
```

### Database errors
```bash
# Re-run migrations in order
# Check Supabase logs in Dashboard
# Verify UUIDs match between auth.users and user_profiles
```

## Support

Need help?
1. Check [README.md](README.md) for detailed docs
2. Review code comments
3. Check Supabase Dashboard → Logs
4. Open browser DevTools → Console

---

**Time to setup: ~30 minutes**
**Difficulty: Easy (if following steps exactly)**

Built with ❤️ for bicycle retailers
