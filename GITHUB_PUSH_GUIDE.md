# Push Buildline to GitHub - Complete Guide

## Step 1: Configure Git (First Time Only)

```powershell
# Open PowerShell in your project folder
cd e:\2xg\Buildline

# Set your Git username and email
git config --global user.name "Zaheer7779"
git config --global user.email "mohammad.zaheer.7779@gmail.com"

# Verify configuration
git config --list
```

---

## Step 2: Initialize Git Repository

```powershell
# Check if already a git repo
git status

# If NOT a git repo, initialize
git init

# Create .gitignore file (if not exists)
# This prevents node_modules and sensitive files from being pushed
```

Create `.gitignore` in project root with:

```
# Dependencies
node_modules/
**/node_modules/

# Build outputs
dist/
build/
.next/

# Environment files (NEVER commit these!)
.env
.env.local
.env.production
.env.development
*.env

# Logs
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Uploads
uploads/
```

---

## Step 3: Add Files to Git

```powershell
# Add all files
git add .

# Check what will be committed
git status

# You should see files in green (staged for commit)
# Make sure .env files are NOT listed!
```

---

## Step 4: Create Initial Commit

```powershell
# Commit with message
git commit -m "Initial commit - Buildline Assembly Tracking System

- React frontend with Vite
- Node.js Express backend
- Supabase database integration
- 4-stage assembly workflow (QC removed)
- Barcode scanner with html5-qrcode
- Mobile-responsive UI with Tailwind
- Role-based access (supervisor, technician, admin)
"
```

---

## Step 5: Create GitHub Repository

### Option A: Via GitHub Website (Recommended)

1. Go to: https://github.com/Zaheer7779
2. Click **"New"** (green button) or **"+"** → **"New repository"**
3. Fill in:
   - **Repository name:** `Buildline`
   - **Description:** `Bicycle Assembly Journey Tracking System - Full-stack React + Node.js app with Supabase`
   - **Visibility:**
     - Choose **Public** (anyone can see)
     - OR **Private** (only you can see)
   - ⚠️ **DO NOT** check "Initialize with README"
   - ⚠️ **DO NOT** add .gitignore or license yet
4. Click **"Create repository"**

### Option B: Via GitHub CLI (if installed)

```powershell
# Install GitHub CLI first: https://cli.github.com/
gh auth login
gh repo create Buildline --public --source=. --remote=origin --push
```

---

## Step 6: Connect Local Repo to GitHub

After creating repo on GitHub, you'll see this page. Copy the commands or use these:

```powershell
# Add remote repository
git remote add origin https://github.com/Zaheer7779/Buildline.git

# Verify remote was added
git remote -v

# Should show:
# origin  https://github.com/Zaheer7779/Buildline.git (fetch)
# origin  https://github.com/Zaheer7779/Buildline.git (push)
```

---

## Step 7: Push to GitHub

```powershell
# Rename branch to 'main' (GitHub default)
git branch -M main

# Push to GitHub
git push -u origin main
```

### If Authentication Required:

**GitHub no longer accepts passwords! Use Personal Access Token:**

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: `Buildline Project`
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
5. Click **"Generate token"**
6. **COPY THE TOKEN NOW** (you can't see it again!)

**When prompted for password:**
```
Username: Zaheer7779
Password: [PASTE YOUR TOKEN HERE, NOT YOUR GITHUB PASSWORD]
```

**Save credentials (so you don't need to enter token every time):**

```powershell
# Windows - Credential Manager (automatic)
# Just enter token once, Windows will remember it

# OR configure Git to remember credentials
git config --global credential.helper store
```

---

## Step 8: Verify Push Success

```powershell
# Check if push succeeded
git status

# Should say: "Your branch is up to date with 'origin/main'"
```

Go to: https://github.com/Zaheer7779/Buildline

You should see all your files!

---

## Step 9: Add Useful README Sections

Go to your repo on GitHub, click **"Add a README"** or create locally:

```powershell
# Already has README.md, just verify it's pushed
git log --oneline

# Should show your commit
```

---

## Step 10: On Mac - Clone and Setup

Now on your Mac, do this:

```bash
# Clone the repository
git clone https://github.com/Zaheer7779/Buildline.git
cd Buildline

# Install dependencies
cd backend
npm install

cd ../frontend
npm install

# Copy environment files
cd backend
cp .env.example .env
# Edit .env with your Supabase credentials

cd ../frontend
cp .env.example .env
# Edit .env with your Supabase credentials

# Run the application
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd frontend && npm run dev
```

---

## Common Issues & Solutions:

### Issue 1: "remote origin already exists"

```powershell
# Remove existing remote
git remote remove origin

# Add again
git remote add origin https://github.com/Zaheer7779/Buildline.git
```

### Issue 2: "failed to push some refs"

```powershell
# Pull first (if repo has changes)
git pull origin main --allow-unrelated-histories

# Then push again
git push -u origin main
```

### Issue 3: ".env file got committed"

```powershell
# URGENT - Remove .env from Git history
git rm --cached .env
git rm --cached backend/.env
git rm --cached frontend/.env

# Add to .gitignore
echo ".env" >> .gitignore
echo "*.env" >> .gitignore

# Commit the removal
git commit -m "Remove sensitive .env files"
git push origin main

# ⚠️ Then change all your Supabase keys!
# Anyone who saw the push now has your keys
```

### Issue 4: "node_modules got committed"

```powershell
# Remove node_modules from Git
git rm -r --cached node_modules
git rm -r --cached backend/node_modules
git rm -r --cached frontend/node_modules

# Make sure .gitignore has:
echo "node_modules/" >> .gitignore

# Commit and push
git commit -m "Remove node_modules from tracking"
git push origin main
```

---

## Daily Git Workflow (After Initial Setup):

```powershell
# 1. Check status
git status

# 2. Add changes
git add .

# 3. Commit with meaningful message
git commit -m "Add bulk inward modal with CSV upload"

# 4. Push to GitHub
git push origin main

# 5. On Mac - Pull latest changes
git pull origin main
```

---

## Useful Git Commands:

```powershell
# View commit history
git log --oneline --graph

# See what changed
git diff

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all local changes (⚠️ Dangerous!)
git reset --hard HEAD

# Create a new branch
git checkout -b feature/new-feature

# Switch back to main
git checkout main

# Merge feature branch into main
git merge feature/new-feature

# Delete branch
git branch -d feature/new-feature

# Push all branches
git push --all origin
```

---

## Get Supabase Migrations:

All migration SQL files are in: `supabase/migrations/`

**To get all queries in one place:**

```powershell
# Combine all migrations into one file (PowerShell)
Get-Content supabase\migrations\*.sql | Out-File -FilePath "COMPLETE_MIGRATIONS.sql"

# Or manually copy from:
# 1. supabase/migrations/001_initial_schema.sql
# 2. supabase/migrations/002_views_and_functions.sql
# 3. supabase/migrations/003_seed_data.sql
# 4. supabase/migrations/008_add_bin_locations.sql
# 5. supabase/migrations/009_add_bin_to_views.sql
# 6. supabase/migrations/010_enhance_bin_zones.sql
# 7. supabase/migrations/011_remove_qc_process.sql
```

**I've also created `DEPLOYMENT_GUIDE.md` with:**
- ✅ All migration instructions
- ✅ How to create test users
- ✅ Environment variables needed
- ✅ Quick test workflow

---

## Next Steps:

1. ✅ Push to GitHub (this guide)
2. ✅ Clone on Mac
3. ✅ Run Supabase migrations (see `DEPLOYMENT_GUIDE.md`)
4. ✅ Setup environment variables
5. ✅ Test the application
6. ⏭️ Deploy to Coolify (optional)

---

## Repository URL:

Once pushed, your repo will be at:
**https://github.com/Zaheer7779/Buildline**

Share this URL with your team or use it to clone on other systems!

---

## Security Checklist Before Pushing:

- ✅ `.gitignore` includes `.env` files
- ✅ `.gitignore` includes `node_modules/`
- ✅ No API keys in code
- ✅ No passwords in code
- ✅ No database connection strings in code
- ✅ All secrets are in `.env` files (which are ignored)

---

## Questions?

- **Git Help:** https://git-scm.com/doc
- **GitHub Guides:** https://guides.github.com/
- **Personal Access Tokens:** https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token
