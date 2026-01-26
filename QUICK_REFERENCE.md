# 🚀 Buildline Quick Reference

## One-Page Cheat Sheet

### 🎯 6 Stages (In Order)

| # | Stage | Who | Action |
|---|-------|-----|--------|
| 1 | **Inwarded** (50%) | Warehouse | GRN + Barcode |
| 2 | **Assigned** | Supervisor | Assign to tech |
| 3 | **In Progress** | Technician | Assembly work |
| 4 | **Completed** | Technician | Checklist ✓✓✓ |
| 5 | **QC Review** | QC Person | Inspect bike |
| 6 | **Ready for Sale** (100%) | System | Can invoice |

### ✅ 3-Item Checklist

1. **Tyres** - Pressure, alignment, condition
2. **Brakes** - Functionality, adjustment
3. **Gears** - Shifting, derailleur

All 3 must be checked before completing assembly.

### 👥 User Roles

| Role | Login Suffix | Main View | Key Action |
|------|-------------|-----------|------------|
| Technician | `tech@...` | Workspace | Complete bikes |
| Supervisor | `supervisor@...` | Kanban | Assign bikes |
| QC Person | `qc@...` | QC Queue | Pass/Fail |
| Admin | `admin@...` | Dashboard | All access |

### 🔒 Sales Lock

**Function:** `can_invoice_item(barcode)`

**Returns:**
```json
{
  "can_invoice": true/false,
  "message": "...",
  "barcode": "...",
  "status": "...",
  "sku": "..."
}
```

**Rule:** Can only invoice if `status = 'ready_for_sale'` AND `qc_status = 'pass'`

### 📡 Key API Endpoints

```bash
# Auth
POST /api/auth/login              # Login (returns JWT)

# Technician
GET  /api/assembly/technician/queue
POST /api/assembly/start
POST /api/assembly/complete

# Supervisor
POST /api/assembly/assign
POST /api/assembly/assign-bulk    # Bulk assign
GET  /api/assembly/kanban

# QC
GET  /api/assembly/qc/pending
POST /api/assembly/qc/submit

# Sales Lock (Important!)
GET  /api/assembly/can-invoice/:barcode

# Reports
GET  /api/assembly/dashboard
```

### 🗄️ Key Database Tables

```
assembly_journeys        [MAIN TABLE - Single source of truth]
├── barcode             [UNIQUE]
├── model_sku
├── current_status      [6 stages]
├── checklist           [JSON: {tyres, brakes, gears}]
├── qc_status          [pass/fail/pending]
├── technician_id
├── qc_person_id
└── timestamps...

user_profiles           [Users with roles]
locations              [Warehouses + Stores]
assembly_status_history [Audit trail]
qc_checklists          [QC details]
```

### 🚦 Status Flow

```
   ┌──────────┐
   │ Inwarded │ (Warehouse creates)
   └────┬─────┘
        │ Supervisor assigns
   ┌────▼─────┐
   │ Assigned │
   └────┬─────┘
        │ Technician scans & starts
   ┌────▼────────┐
   │ In Progress │
   └────┬────────┘
        │ Technician completes checklist
   ┌────▼─────┐
   │Completed │
   └────┬─────┘
        │ QC Person reviews
   ┌────▼───────┐
   │ QC Review  │
   └────┬───────┘
        │
        ├─ PASS ─────┐
        │             │
   ┌────▼────────────▼──┐
   │ Ready for Sale     │ ← CAN INVOICE ✅
   └────────────────────┘
        │
        └─ FAIL → Back to "In Progress" (Rework)
```

### 🔧 Common Commands

**Backend:**
```bash
cd backend
npm install
cp .env.example .env    # Edit with Supabase keys
npm run dev             # Start on :3001
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env    # Edit with Supabase keys
npm run dev             # Start on :3000
```

**Database Migration:**
```sql
-- In Supabase SQL Editor, run in order:
1. 001_initial_schema.sql
2. 002_views_and_functions.sql
3. 003_seed_data.sql
```

### 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't login | Check user exists in `user_profiles` |
| Bike not found | Check `assembly_journeys` has barcode |
| Can't complete checklist | All 3 items must be checked |
| Can't assign bike | Status must be 'inwarded' |
| Can't invoice | Check `can_invoice_item(barcode)` |
| Backend error | Check Supabase keys in `.env` |
| Frontend blank | Check browser console, verify `.env` |

### 📊 Key Reports

**Daily Dashboard:**
- Inwarded today
- Assembled today
- QC passed today
- Stuck >24hrs

**Technician Performance:**
- Completion rate
- QC pass rate %
- Avg assembly time

**Bottleneck Report:**
- Time in each stage
- Bikes stuck by location

**QC Failure Analysis:**
- Top failure reasons
- Failure by model

### 🔑 Environment Variables

**Backend (.env):**
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

**Frontend (.env):**
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=http://localhost:3001/api
```

### 🎨 Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | TailwindCSS |
| Routing | React Router v6 |
| Charts | Recharts |
| Backend | Node.js + Express |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth (JWT) |
| Deployment | Vercel + Railway |

### 📝 File Structure

```
Buildline/
├── backend/
│   ├── config/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── index.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── technician/
│   │   │   ├── supervisor/
│   │   │   ├── qc/
│   │   │   └── shared/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   └── package.json
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql
        ├── 002_views_and_functions.sql
        └── 003_seed_data.sql
```

### 🚀 Deployment Checklist

- [ ] Create Supabase production project
- [ ] Run all migrations
- [ ] Create production users
- [ ] Deploy backend (Railway/Heroku)
- [ ] Deploy frontend (Vercel)
- [ ] Set production env vars
- [ ] Update CORS origin
- [ ] Test complete workflow
- [ ] Test sales lock integration
- [ ] Setup monitoring

### 📞 Support Resources

1. **README.md** - Full documentation
2. **SETUP_GUIDE.md** - Step-by-step setup
3. **ARCHITECTURE.md** - System design
4. **Supabase Docs** - https://supabase.com/docs
5. **React Docs** - https://react.dev

---

**Print this page and keep it handy!** 📄
