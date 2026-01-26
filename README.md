# 🚲 BUILDLINE - Cycle Assembly Journey Tracking System

A complete assembly tracking system for bicycle retail businesses. Track every bike from 50% assembled (inwarded) to 100% QC-approved (ready for sale).

## 📋 What This System Does

**Core Problem Solved:** Prevents selling incomplete or unsafe bicycles by enforcing a mandatory QC approval workflow.

**Key Features:**
- ✅ 6-stage assembly workflow (no shortcuts)
- ✅ 3-item checklist (Tyres, Brakes, Gears)
- ✅ Sales lock - blocks invoicing until QC passes
- ✅ Real-time Kanban board for supervisors
- ✅ Mobile-first technician interface
- ✅ QC pass/fail with automatic rework routing
- ✅ Complete audit trail with timestamps
- ✅ Role-based access control

## 🎯 6 Mandatory Stages

| Stage | Status | Who | Action |
|-------|--------|-----|--------|
| 1 | **Inwarded** | Warehouse | Bike received via GRN, barcode assigned |
| 2 | **Assigned** | Supervisor | Assigned to technician |
| 3 | **In Progress** | Technician | Assembly work happening |
| 4 | **Completed** | Technician | All checklist items done |
| 5 | **QC Review** | QC Person | Quality inspection |
| 6 | **Ready for Sale** | System | QC passed, can be invoiced |

## 🛠 Tech Stack

**Backend:**
- Node.js + Express
- Supabase (PostgreSQL)
- JWT Authentication

**Frontend:**
- React + Vite
- TailwindCSS
- React Router
- Recharts (dashboards)

## 📦 Installation

### Prerequisites
- Node.js 18+
- Supabase account
- npm or yarn

### 1. Clone and Setup

```bash
git clone <repository>
cd Buildline
```

### 2. Database Setup (Supabase)

1. Create a new Supabase project at https://supabase.com
2. Run migrations in order:

```sql
-- In Supabase SQL Editor, run these files in order:
-- 1. supabase/migrations/001_initial_schema.sql
-- 2. supabase/migrations/002_views_and_functions.sql
-- 3. supabase/migrations/003_seed_data.sql (optional - for demo data)
```

3. Create test users via Supabase Auth Dashboard
4. Insert user profiles:

```sql
-- Example: Create profiles after creating auth users
INSERT INTO user_profiles (id, email, full_name, role, is_active)
VALUES
  ('user-uuid-from-auth', 'tech@example.com', 'John Technician', 'technician', true),
  ('user-uuid-from-auth', 'supervisor@example.com', 'Jane Supervisor', 'supervisor', true),
  ('user-uuid-from-auth', 'qc@example.com', 'Bob QC', 'qc_person', true);
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your Supabase credentials:
# SUPABASE_URL=your_supabase_url
# SUPABASE_ANON_KEY=your_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Start backend server
npm run dev
```

Backend runs on http://localhost:3001

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your Supabase credentials:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_anon_key
# VITE_API_URL=http://localhost:3001/api

# Start frontend dev server
npm run dev
```

Frontend runs on http://localhost:3000

## 👥 User Roles & Access

### 🔧 Technician
**Access:** Technician Dashboard

**Can:**
- View assigned bikes queue
- Scan barcode to start assembly
- Complete 3-item checklist
- Mark assembly complete

**Workflow:**
1. Scan bike barcode
2. Auto-starts assembly
3. Check off: Tyres ✓ Brakes ✓ Gears ✓
4. Complete → sends to QC

### 👨‍💼 Supervisor
**Access:** Supervisor Dashboard

**Can:**
- View Kanban board (all bikes)
- Assign bikes to technicians (bulk assign supported)
- Set priority flags
- Monitor stuck items (>24hrs)
- View bottleneck reports

**Workflow:**
1. View inwarded bikes
2. Select bikes + technician
3. Bulk assign
4. Monitor progress on Kanban

### ✅ QC Person
**Access:** QC Dashboard

**Can:**
- View pending QC bikes
- Start QC review
- Pass or Fail with reason
- Automatic rework routing on fail

**Workflow:**
1. View completed bikes
2. Start QC review
3. Select PASS or FAIL
4. If FAIL → select reason → auto sends back to technician
5. If PASS → bike becomes "Ready for Sale"

### 👑 Admin
**Access:** All dashboards + reports

**Can:**
- Everything supervisors can do
- View analytics dashboard
- Access all reports
- Override permissions

## 🔒 Sales Lock Integration

**Critical Feature:** Prevents invoicing bikes that haven't passed QC.

### How to Integrate with Your POS/ERP

```javascript
import { assemblyApi } from './services/api';

// Before creating invoice, check if bike can be sold
const checkBike = async (barcode) => {
  const response = await assemblyApi.canInvoice(barcode);
  const result = response.data.data;

  if (result.can_invoice) {
    // ✅ Proceed with invoice
    console.log('Bike ready for sale:', result.sku);
    return true;
  } else {
    // ❌ Block invoice
    alert(`Cannot invoice: ${result.message}`);
    return false;
  }
};
```

### Sales Lock Component

Use the pre-built component:

```javascript
import { SalesLockChecker } from './components/shared/SalesLockChecker';

<SalesLockChecker
  onBarcodeVerified={(result) => {
    // Bike is verified, proceed to invoice
    createInvoice(result.barcode, result.sku);
  }}
/>
```

## 📊 API Endpoints

### Authentication
All endpoints require `Authorization: Bearer <token>` header.

### Key Endpoints

**Technician:**
```
GET  /api/assembly/technician/queue    - Get my assigned bikes
GET  /api/assembly/scan/:barcode       - Scan bike
POST /api/assembly/start               - Start assembly
PUT  /api/assembly/checklist           - Update checklist
POST /api/assembly/complete            - Complete assembly
```

**Supervisor:**
```
POST /api/assembly/assign              - Assign bike to tech
POST /api/assembly/assign-bulk         - Bulk assign bikes
GET  /api/assembly/kanban              - Get Kanban board
POST /api/assembly/set-priority        - Set priority flag
```

**QC:**
```
GET  /api/assembly/qc/pending          - Get pending QC bikes
POST /api/assembly/qc/start            - Start QC review
POST /api/assembly/qc/submit           - Submit QC result
```

**Reports:**
```
GET  /api/assembly/dashboard           - Get all dashboard stats
GET  /api/assembly/history/:journeyId  - Get assembly history
```

**Sales Lock:**
```
GET  /api/assembly/can-invoice/:barcode - Check if bike can be invoiced
```

## 📈 Reports & Analytics

### Daily Dashboard
- Bikes inwarded today
- Bikes assembled today
- Bikes QC passed today
- Bikes stuck >24 hours

### Bottleneck Report
- Time spent in each stage
- Bikes stuck by location
- Heatmap view

### Technician Performance
- Completion rate
- QC pass rate %
- Average assembly time
- Current workload

### QC Failure Analysis
- Top failure reasons
- Failure by model
- Rework count trends

## 🔧 Configuration

### Checklist Customization

To modify the 3-item checklist, edit:

1. **Database:** `supabase/migrations/001_initial_schema.sql`
   - Update `checklist_structure` constraint
   - Set new default checklist

2. **Backend:** `backend/src/services/assembly.service.js`
   - Update validation in `completeAssembly()`

3. **Frontend:** `frontend/src/components/technician/AssemblyChecklist.jsx`
   - Update `checklistItems` array

### Adding More Stages

Not recommended - system designed for 6 stages. If absolutely needed:

1. Add enum value to `assembly_status` in migration
2. Update all views and functions
3. Update Kanban board component
4. Update status colors in `tailwind.config.js`

## 🚀 Deployment

### Backend (Node.js)

Deploy to:
- Heroku
- Railway
- DigitalOcean App Platform
- AWS Elastic Beanstalk

Required env vars:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORT`
- `NODE_ENV=production`

### Frontend (React)

Deploy to:
- Vercel (recommended)
- Netlify
- Cloudflare Pages

Build command: `npm run build`
Output dir: `dist`

Required env vars:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` (your backend URL)

## 🐛 Troubleshooting

### "Authentication failed"
- Check Supabase credentials in .env
- Verify user exists in `user_profiles` table
- Check JWT token expiry

### "Bike not found"
- Verify barcode exists in `assembly_journeys`
- Check GRN inward process completed
- Ensure barcode is unique

### "Cannot complete checklist"
- All 3 items must be checked
- Bike must be in "in_progress" status
- Must be assigned to current technician

### QC not showing pending bikes
- Check bikes are in "completed" status
- Verify QC person role assigned
- Refresh pending QC list

## 📝 Database Schema

**Main Tables:**
- `user_profiles` - Users with roles
- `locations` - Warehouses and stores
- `assembly_journeys` - **Single source of truth** for bike tracking
- `assembly_status_history` - Audit trail of status changes
- `assembly_location_history` - Bike movement tracking
- `qc_checklists` - Detailed QC records

**Key Views:**
- `kanban_board` - Real-time Kanban data
- `technician_workload` - Performance metrics
- `daily_dashboard` - Daily stats
- `bottleneck_report` - Stage analysis
- `qc_failure_analysis` - QC insights

## 🎨 Customization

### Branding

Edit colors in `frontend/tailwind.config.js`:

```javascript
colors: {
  primary: {
    500: '#0ea5e9', // Your brand color
  }
}
```

### Logo

Replace:
- `frontend/public/bicycle.svg`
- Update `frontend/index.html` favicon

## 📄 License

MIT License - Free to use and modify

## 🤝 Support

For issues or questions:
1. Check this README
2. Review code comments
3. Check Supabase logs
4. Review browser console for frontend errors

## 🎯 Next Steps After Setup

1. **Create users** in Supabase Auth
2. **Add user profiles** with roles
3. **Add locations** (warehouses/stores)
4. **Test workflow:**
   - Inward a bike (creates assembly_journey)
   - Assign to technician (supervisor)
   - Complete assembly (technician)
   - Pass QC (qc_person)
   - Test sales lock
5. **Integrate with your ERP** using sales lock API

---

Built with ❤️ for bicycle retailers who care about quality and safety.
