# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Buildline** is a bicycle assembly journey tracking system for retail businesses. Tracks bikes from 50% assembled (inwarded) to 100% complete (ready for sale).

**Critical Note:** The QC (Quality Control) process has been removed from the system (see migration 011). The current workflow is 4 stages, not 6 as mentioned in the README.

## Architecture

### Current Assembly Workflow (4 Stages)

1. **Inwarded** - Bike received via GRN, barcode assigned
2. **Assigned** - Supervisor assigns to technician
3. **In Progress** - Technician working on assembly
4. **Ready for Sale** - Assembly completed, bike can be invoiced

Status flow is enforced by Supabase PostgreSQL functions. Direct status updates are not allowed; must use workflow functions.

### Tech Stack

- **Backend:** Node.js + Express + Supabase (PostgreSQL)
- **Frontend:** React + Vite + TailwindCSS + React Router
- **Authentication:** Supabase Auth with JWT tokens
- **Barcode Scanning:** html5-qrcode library

### Database Architecture

**Single Source of Truth:** `assembly_journeys` table tracks all bike states.

**Business Logic Location:** PostgreSQL functions (NOT in application code)
- `assign_to_technician(p_barcode, p_technician_id, p_supervisor_id)`
- `start_assembly(p_barcode, p_technician_id)`
- `complete_assembly(p_barcode, p_technician_id, p_checklist)`
- `can_invoice_item(p_barcode)`

Backend services call these functions via `supabase.rpc()`. Do not implement status transitions in JavaScript.

### User Roles

- `technician` - Scans bikes, completes assembly checklist
- `supervisor` - Assigns bikes, views Kanban board, bulk operations
- `admin` - Full access, analytics dashboard
- `warehouse_staff` - Inward bikes, bin management
- ~~`qc_person`~~ - REMOVED (QC process eliminated)

## Development Commands

### Backend (Port 3001)

```bash
cd backend
npm install
npm run dev      # Start with nodemon (auto-reload)
npm start        # Production start
npm test         # Run tests
```

### Frontend (Port 3000)

```bash
cd frontend
npm install
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Environment Setup

**Backend (.env):**
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

**Frontend (.env):**
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:3001/api
```

## Database Migrations

**CRITICAL:** Migrations must be run in numerical order via Supabase SQL Editor.

Location: `supabase/migrations/`

Latest migration: `011_remove_qc_process.sql` (removed QC workflow)

When adding new migrations:
1. Create new file with next number: `012_description.sql`
2. Test locally first
3. Document changes in migration file header
4. Update views/functions if status changes are made

## Code Organization

### Backend Structure

```
backend/src/
├── index.js                 # Express app entry point
├── middleware/
│   └── auth.js             # authenticate() and authorize() middleware
├── routes/
│   ├── assembly.routes.js  # All assembly endpoints
│   └── user.routes.js      # User management
├── controllers/
│   └── assembly.controller.js  # Request handlers
├── services/
│   └── assembly.service.js     # Business logic (calls Supabase RPC)
└── config/
    └── supabase.js         # Supabase client initialization
```

**Pattern:** Route → Controller → Service → Supabase RPC Function

### Frontend Structure

```
frontend/src/
├── App.jsx                      # Routes and role-based redirects
├── contexts/
│   └── AuthContext.jsx          # Global auth state (user, profile, role)
├── components/
│   ├── technician/
│   │   ├── TechnicianDashboard.jsx
│   │   ├── BikeScanner.jsx      # Camera barcode scanning
│   │   └── AssemblyChecklist.jsx
│   ├── supervisor/
│   │   ├── SupervisorDashboard.jsx
│   │   ├── KanbanBoard.jsx      # 4-column board (inwarded/assigned/in_progress/ready_for_sale)
│   │   ├── AssignmentPanel.jsx
│   │   ├── BulkInwardModal.jsx  # CSV upload + manual entry
│   │   └── InwardBikeForm.jsx
│   └── shared/
│       └── SalesLockChecker.jsx  # Invoice validation
├── services/
│   └── api.js                   # Axios API client
├── constants/
│   └── assemblyConstants.js     # Status labels, colors, workflow order
└── pages/
    ├── LoginPage.jsx
    └── DashboardPage.jsx
```

### Authentication Flow

1. Frontend: User logs in via Supabase Auth (`AuthContext.jsx`)
2. Frontend: Stores JWT token in localStorage (handled by Supabase)
3. Frontend: API calls include `Authorization: Bearer <token>` header (via axios interceptor in `api.js`)
4. Backend: `authenticate` middleware verifies token with Supabase
5. Backend: Fetches `user_profiles` to get role
6. Backend: `authorize(...roles)` middleware checks role access

## Important Conventions

### Status Constants

**ALWAYS use `assemblyConstants.js` for status values.** Do not hardcode status strings.

```javascript
import { ASSEMBLY_STATUS_LABELS, STATUS_ORDER } from '../constants/assemblyConstants';

// Correct
const label = ASSEMBLY_STATUS_LABELS[status];

// Incorrect
const label = status === 'in_progress' ? 'In Progress' : '...';
```

Valid statuses: `'inwarded'` | `'assigned'` | `'in_progress'` | `'ready_for_sale'`

### API Response Format

All API responses follow this structure:

```javascript
{
  success: true,
  message: "Operation succeeded",
  data: { ... }  // Actual response data
}
```

Error responses:
```javascript
{
  success: false,
  message: "Error description"
}
```

### Mobile-First Styling

All supervisor components use responsive Tailwind classes:
- Mobile: `block`, `flex-col`, `text-sm`, `px-2`, `py-1.5`
- Desktop: `sm:hidden`, `sm:flex-row`, `sm:text-base`, `sm:px-4`, `sm:py-2`

Pattern: Mobile styles first, then `sm:` prefix for desktop overrides.

## Common Tasks

### Adding a New Assembly Status

⚠️ **Not recommended.** System is designed for 4-stage workflow. If absolutely necessary:

1. Add enum value in `001_initial_schema.sql` (requires new migration)
2. Update `STATUS_ORDER` in `assemblyConstants.js`
3. Add color mapping in `STATUS_COLORS` constant
4. Update all Supabase functions that reference status
5. Update `KanbanBoard.jsx` stages array
6. Update any dashboard views/reports

### Modifying the Checklist

Current: Tyres, Brakes, Gears (3 items)

To change:
1. Database: Update `checklist_structure` constraint in migration
2. Backend: Modify validation in `assembly.service.js` `completeAssembly()`
3. Frontend: Update `checklistItems` array in `AssemblyChecklist.jsx`
4. All three must match or checklist will fail validation

### Adding Bulk Operations

Pattern used in `BulkInwardModal.jsx`:
1. Parse data (CSV or manual entry)
2. Validate all entries
3. Loop through with progress tracking
4. Call individual API endpoints (not batch endpoint)
5. Collect results (success/failure per item)
6. Show toast notifications for summary

### Barcode Scanner Issues

Scanner component: `BikeScanner.jsx`

Common issues:
- Camera permission denied → Show error message with instructions
- Camera in use by another app → AbortError, suggest closing other apps
- Scanner not initializing → Check `html5-qrcode` version compatibility
- Scanner cleanup → Always call `scanner.clear()` in useEffect cleanup

Scanner config:
```javascript
formatsToSupport: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] // All barcode formats
videoConstraints: { facingMode: "environment" } // Prefer rear camera
```

## Testing

### Manual Testing Flow

1. **Inward a bike** (Supervisor)
   - Go to "Inward" tab
   - Enter barcode, model SKU
   - Verify status = 'inwarded'

2. **Assign to technician** (Supervisor)
   - Go to "Assign" tab
   - Select bike(s) + technician
   - Click "Assign Selected"

3. **Complete assembly** (Technician)
   - Scan bike barcode (or enter manually)
   - Check all 3 checklist items
   - Click "Mark as Ready to Sale"
   - Verify status = 'ready_for_sale'

4. **Test sales lock**
   - Try to invoice the barcode
   - Should succeed if status is 'ready_for_sale'
   - Should fail otherwise

### Common Test Users

Create in Supabase Auth, then insert profiles:

```sql
INSERT INTO user_profiles (id, email, full_name, role, is_active) VALUES
  ('uuid-from-auth', 'tech@test.com', 'Test Technician', 'technician', true),
  ('uuid-from-auth', 'super@test.com', 'Test Supervisor', 'supervisor', true);
```

## Deployment Notes

### Backend Deployment

Recommended platforms: Railway, Heroku, DigitalOcean App Platform

Requirements:
- Node.js 18+
- Set all environment variables from `.env.example`
- Ensure `NODE_ENV=production`
- Backend must be accessible from frontend origin (CORS)

### Frontend Deployment

Recommended platforms: Vercel, Netlify, Cloudflare Pages

Build command: `npm run build`
Output directory: `dist`

**Critical:** Set `VITE_API_URL` to production backend URL

For SPAs, configure redirects (Vercel example):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Troubleshooting

### "User profile not found" after login

User exists in Supabase Auth but not in `user_profiles` table. Run:
```sql
INSERT INTO user_profiles (id, email, full_name, role, is_active)
VALUES ('user-id-from-auth', 'email@example.com', 'Full Name', 'role', true);
```

### Bike stuck in status

Check `assembly_status_history` table for audit trail:
```sql
SELECT * FROM assembly_status_history
WHERE journey_id = 'journey-id'
ORDER BY changed_at DESC;
```

### Supabase RPC function errors

Error: "function does not exist"
- Migration not run or run out of order
- Check migration files in Supabase SQL Editor

Error: "violates check constraint"
- Status transition not allowed by workflow
- Check function logic in migrations

### Frontend build errors

Error: "process is not defined"
- Vite environment variables must start with `VITE_`
- Check all imports use `import.meta.env.VITE_*`

## Key Files to Check First

When debugging:
- Status/workflow issues: `011_remove_qc_process.sql`, `assemblyConstants.js`
- Auth issues: `AuthContext.jsx`, `auth.js` (backend middleware)
- API errors: `assembly.routes.js`, `assembly.controller.js`, `api.js` (frontend)
- UI/display issues: `*Dashboard.jsx` files, Tailwind classes

## Additional Notes

- The README.md mentions 6 stages with QC - this is **outdated**. QC was removed in migration 011.
- Bin locations are optional but recommended for physical warehouse management
- Priority flags are cosmetic (don't affect workflow, just visual indicators)
- All timestamps are stored in UTC, converted to local time in frontend
- Barcode/Serial number terminology is used interchangeably
