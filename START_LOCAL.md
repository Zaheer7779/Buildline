# 🚀 Run Buildline Locally - Quick Start

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 18+ installed (`node --version`)
- ✅ npm installed (`npm --version`)
- ✅ A Supabase account (free tier is fine)

## Step 1: Create Supabase Project (5 minutes)

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in:
   - Name: `buildline-local`
   - Database Password: `your-secure-password` (save this!)
   - Region: Choose closest to you
4. Wait ~2 minutes for project to initialize

5. **Get your credentials:**
   - Go to Settings → API
   - Copy these 3 values:
     - `Project URL`
     - `anon public` key
     - `service_role` key (click "Reveal" button)

## Step 2: Setup Database (3 minutes)

1. In Supabase, go to **SQL Editor**
2. Click "New Query"
3. Open `supabase/migrations/001_initial_schema.sql` from this project
4. Copy all content and paste into SQL Editor
5. Click **Run** (wait ~10 seconds)
6. Repeat for `002_views_and_functions.sql`
7. Repeat for `003_seed_data.sql`

**Verify:** Go to Table Editor, you should see these tables:
- user_profiles
- locations
- assembly_journeys
- assembly_status_history

## Step 3: Create Test Users (2 minutes)

1. In Supabase, go to **Authentication** → **Users**
2. Click **Add User** → **Create new user**

Create these 3 users:

**User 1 - Technician:**
- Email: `tech@test.com`
- Password: `Test123!`
- Auto Confirm Email: ✅ YES

**User 2 - Supervisor:**
- Email: `supervisor@test.com`
- Password: `Test123!`
- Auto Confirm Email: ✅ YES

**User 3 - QC Person:**
- Email: `qc@test.com`
- Password: `Test123!`
- Auto Confirm Email: ✅ YES

3. **Copy the User IDs** (UUIDs) from the users list - you'll need them next!

## Step 4: Create User Profiles (1 minute)

1. Go back to **SQL Editor**
2. Run this query (replace the UUIDs with actual ones from step 3):

```sql
-- Get the UUIDs from Auth → Users and paste them below
INSERT INTO user_profiles (id, email, full_name, role, is_active) VALUES
  ('PASTE-TECH-USER-UUID-HERE', 'tech@test.com', 'John Technician', 'technician', true),
  ('PASTE-SUPERVISOR-USER-UUID-HERE', 'supervisor@test.com', 'Jane Supervisor', 'supervisor', true),
  ('PASTE-QC-USER-UUID-HERE', 'qc@test.com', 'Bob QC', 'qc_person', true);
```

**Verify:** Go to Table Editor → user_profiles → you should see 3 rows

## Step 5: Start Backend (2 minutes)

Open terminal in the `backend` folder:

```bash
cd backend

# Install dependencies (takes ~1 minute)
npm install

# Create .env file
cp .env.example .env
```

Now edit `backend/.env` with your Supabase credentials from Step 1:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

Start the backend:

```bash
npm run dev
```

**Success if you see:**
```
╔════════════════════════════════════════════════════╗
║   🚲  BUILDLINE API Server                         ║
║   Port: 3001                                       ║
╚════════════════════════════════════════════════════╝
```

**Test it:** Open http://localhost:3001/health in your browser
- Should see: `{"success":true,"message":"Buildline API is running"}`

## Step 6: Start Frontend (2 minutes)

Open **NEW terminal** in the `frontend` folder:

```bash
cd frontend

# Install dependencies (takes ~1 minute)
npm install

# Create .env file
cp .env.example .env
```

Edit `frontend/.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_URL=http://localhost:3001/api
```

Start the frontend:

```bash
npm run dev
```

**Success if you see:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

## Step 7: Open Application

Open your browser and go to: **http://localhost:3000**

You should see the **Buildline Login Page** 🎉

## Step 8: Test Login

Try logging in as different users:

**Test 1 - Technician:**
- Email: `tech@test.com`
- Password: `Test123!`
- Should see: **Technician Workspace** with "0 bikes in your queue"

**Test 2 - Supervisor:**
- Logout, then login with:
- Email: `supervisor@test.com`
- Password: `Test123!`
- Should see: **Supervisor Dashboard** with Kanban board

**Test 3 - QC Person:**
- Logout, then login with:
- Email: `qc@test.com`
- Password: `Test123!`
- Should see: **QC Dashboard** with "0 bikes pending QC"

## 🎉 Success! Your System is Running!

You should now have:
- ✅ Backend running on http://localhost:3001
- ✅ Frontend running on http://localhost:3000
- ✅ Database connected to Supabase
- ✅ 3 test users ready to use

---

## Next: Test Complete Workflow

### Create a Test Bike

1. Go to Supabase → SQL Editor
2. Run this to create a test bike:

```sql
-- First, get the warehouse location ID
SELECT id, name FROM locations;

-- Create test bike (use the location ID from above)
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
  (SELECT id FROM locations WHERE code = 'WH001'),
  'GRN-TEST-001'
);
```

### Test the Full Workflow

**As Supervisor:**
1. Login as `supervisor@test.com`
2. Click "Assign Bikes"
3. Select "TEST-BIKE-001"
4. Choose technician "John Technician"
5. Click "Assign"

**As Technician:**
1. Logout and login as `tech@test.com`
2. You should see 1 bike in "Assigned to You"
3. Click the bike card
4. Check all 3 items: ✅ Tyres ✅ Brakes ✅ Gears
5. Click "Complete Assembly & Send for QC"

**As QC Person:**
1. Logout and login as `qc@test.com`
2. You should see 1 bike pending QC
3. Click "Start QC Review"
4. Click the green "PASS" button
5. Click "Submit QC PASS ✓"

**Test Sales Lock:**
1. Go to Supabase → SQL Editor
2. Run:
```sql
SELECT * FROM can_invoice_item('TEST-BIKE-001');
```

Result should be:
```
can_invoice: true
message: "Ready for sale - QC passed"
```

🎉 **Complete workflow tested successfully!**

---

## Troubleshooting

### Backend won't start
```bash
# Check Node version
node --version  # Should be 18+

# Clear and reinstall
cd backend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Frontend shows blank page
- Open browser DevTools (F12) → Console
- Check for errors
- Verify `.env` file exists and has correct Supabase keys
- Try clearing browser cache (Ctrl+Shift+Delete)

### "Authentication failed" error
- Verify user exists in Supabase Auth → Users
- Check user profile exists in `user_profiles` table
- Ensure UUIDs match between auth.users and user_profiles
- Check `.env` files have correct Supabase keys

### Can't login
- Go to Supabase → Authentication → Users
- Verify user email is confirmed
- Check password is correct (`Test123!`)
- Look at Network tab in DevTools for error details

### Database errors
- Re-run migrations in order (001, 002, 003)
- Check Supabase Dashboard → Logs for SQL errors
- Verify tables were created in Table Editor

---

## Stopping the Servers

**Stop Backend:**
- Go to backend terminal
- Press `Ctrl + C`

**Stop Frontend:**
- Go to frontend terminal
- Press `Ctrl + C`

**Restart Later:**
```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2 (new terminal)
cd frontend
npm run dev
```

---

## Default URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health
- **Supabase Dashboard:** https://supabase.com/dashboard

---

**Total Setup Time: ~15 minutes**
**You're all set! Happy assembling! 🚲**
