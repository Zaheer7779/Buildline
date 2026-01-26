# ⚡ RUN BUILDLINE NOW - 5 Minute Quick Start

## ✅ What's Already Done

- ✅ Dependencies installed (backend + frontend)
- ✅ `.env` files created
- ✅ Project structure ready

## 🚨 What You Need To Do (5 minutes)

### Step 1: Create Supabase Project (2 min)

1. Go to https://supabase.com and sign in
2. Click **"New Project"**
3. Enter:
   - **Name:** `buildline-local`
   - **Database Password:** Make one up and save it!
   - **Region:** Choose closest to you
4. Click **"Create new project"**
5. Wait ~2 minutes ⏳

### Step 2: Get Supabase Credentials (1 min)

1. Once your project is ready, go to **Settings** (gear icon) → **API**
2. Copy these 3 values:

   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJxxx...
   service_role key: eyJxxx... (click "Reveal" button first)
   ```

### Step 3: Update .env Files (1 min)

**Edit `backend/.env`:**
```env
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR-ANON-KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

**Edit `frontend/.env`:**
```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
VITE_API_URL=http://localhost:3001/api
```

Replace `YOUR-PROJECT`, `YOUR-ANON-KEY`, and `YOUR-SERVICE-ROLE-KEY` with the values from Step 2.

### Step 4: Setup Database (1 min)

1. In Supabase Dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open `supabase/migrations/001_initial_schema.sql` from this project
4. Copy **ALL** the content
5. Paste into Supabase SQL Editor
6. Click **"Run"** ▶️ (wait ~10 seconds)
7. **Repeat** for `002_views_and_functions.sql`
8. **Repeat** for `003_seed_data.sql`

**Verify:** Go to **Table Editor** → you should see tables like `assembly_journeys`, `user_profiles`, etc.

---

## 🚀 START THE SERVERS

### Terminal 1 - Backend

```bash
cd backend
npm run dev
```

**Success looks like:**
```
╔════════════════════════════════════════════════════╗
║   🚲  BUILDLINE API Server                         ║
║   Port: 3001                                       ║
╚════════════════════════════════════════════════════╝
```

**Or on Windows, just double-click:** `start-backend.bat`

### Terminal 2 - Frontend

Open a **NEW** terminal:

```bash
cd frontend
npm run dev
```

**Success looks like:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
```

**Or on Windows, just double-click:** `start-frontend.bat`

---

## 🎉 OPEN THE APP

Open your browser: **http://localhost:3000**

You should see the **Buildline Login Page**!

---

## 🔑 Create Your First User

Before you can login, you need to create users:

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Click **"Add User"** → **"Create new user"**
3. Create a test user:
   - **Email:** `admin@test.com`
   - **Password:** `Test123!`
   - **Auto Confirm Email:** ✅ **CHECK THIS BOX**
4. Click **"Create user"**
5. **Copy the User ID (UUID)** from the users list

6. Go to **SQL Editor** and run:

```sql
-- Replace with the actual UUID from step 5
INSERT INTO user_profiles (id, email, full_name, role, is_active)
VALUES ('PASTE-USER-UUID-HERE', 'admin@test.com', 'Admin User', 'admin', true);
```

7. Now login at http://localhost:3000 with:
   - Email: `admin@test.com`
   - Password: `Test123!`

---

## ✅ You're Running!

If you see a dashboard after login, **congratulations!** 🎉

You now have:
- ✅ Backend API running on http://localhost:3001
- ✅ Frontend UI running on http://localhost:3000
- ✅ Database connected to Supabase
- ✅ First user created and logged in

---

## 🆘 Troubleshooting

### "Cannot connect to backend"
- Check if backend terminal shows the server running
- Verify `backend/.env` has correct Supabase credentials
- Try opening http://localhost:3001/health (should show JSON)

### "Authentication failed"
- Make sure you created the user in Supabase Auth
- Verify you added the user profile in SQL
- Check that the UUID matches between auth.users and user_profiles

### "Invalid credentials"
- Password must be exactly `Test123!`
- Email must match what you created
- Try clicking "Confirm" on the user in Supabase Auth dashboard

### Backend or Frontend won't start
- Make sure `.env` files exist
- Check for port conflicts (3000 or 3001 already in use)
- Try closing and reopening terminals

---

## 📚 What's Next?

1. **Create more users** (see [SETUP_GUIDE.md](SETUP_GUIDE.md))
   - Technician role
   - Supervisor role
   - QC Person role

2. **Test the workflow:**
   - Create a test bike (SQL)
   - Assign it to a technician
   - Complete assembly
   - Pass QC
   - Test sales lock

3. **Read the docs:**
   - [README.md](README.md) - Complete guide
   - [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Cheat sheet
   - [ARCHITECTURE.md](ARCHITECTURE.md) - How it works

---

## 🛑 Stop Servers

**To stop:**
- Press `Ctrl + C` in each terminal

**To restart later:**
- Just run the same commands again or double-click the .bat files

---

**Total Time: 5-10 minutes**
**You're now running Buildline locally! 🚲✨**
