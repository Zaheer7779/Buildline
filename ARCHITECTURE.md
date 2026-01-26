# 🏗️ Buildline Architecture

## System Overview

Buildline is a 3-tier web application for tracking bicycle assembly from 50% completion to QC-approved ready-for-sale status.

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Technician│  │Supervisor│  │    QC    │  │Dashboard │   │
│  │  View    │  │   View   │  │   View   │  │  View    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│         │            │             │             │          │
│         └────────────┴─────────────┴─────────────┘          │
│                       │ axios + JWT                          │
└───────────────────────┼──────────────────────────────────────┘
                        │
┌───────────────────────┼──────────────────────────────────────┐
│                Backend (Node.js/Express)                      │
│  ┌────────────────────┴────────────────────┐                │
│  │         API Routes (Express)            │                │
│  │  ┌──────────┐  ┌──────────┐  ┌──────┐  │                │
│  │  │Assembly  │  │   Auth   │  │Reports│  │                │
│  │  │ Routes   │  │Middleware│  │Routes │  │                │
│  │  └──────────┘  └──────────┘  └──────┘  │                │
│  └──────────────────┬───────────────────────┘                │
│                     │                                         │
│  ┌──────────────────┴────────────────────┐                  │
│  │         Services Layer                │                  │
│  │  ┌─────────────────────────────────┐  │                  │
│  │  │    assembly.service.js          │  │                  │
│  │  │  - Business logic               │  │                  │
│  │  │  - Data validation              │  │                  │
│  │  │  - Supabase calls               │  │                  │
│  │  └─────────────────────────────────┘  │                  │
│  └──────────────────┬───────────────────────┘                │
└────────────────────┼──────────────────────────────────────────┘
                     │ Supabase Client
┌────────────────────┼──────────────────────────────────────────┐
│            Database (PostgreSQL via Supabase)                 │
│  ┌──────────────────┴────────────────────┐                   │
│  │           Core Tables                 │                   │
│  │  ┌────────────────────────────────┐   │                   │
│  │  │  assembly_journeys (MAIN)      │   │                   │
│  │  │  - Single source of truth      │   │                   │
│  │  │  - Current status               │   │                   │
│  │  │  - Checklist                    │   │                   │
│  │  │  - Timestamps                   │   │                   │
│  │  └────────────────────────────────┘   │                   │
│  │  ┌────────────────────────────────┐   │                   │
│  │  │  user_profiles                 │   │                   │
│  │  │  locations                     │   │                   │
│  │  │  assembly_status_history       │   │                   │
│  │  │  qc_checklists                 │   │                   │
│  │  └────────────────────────────────┘   │                   │
│  └────────────────────────────────────────┘                  │
│  ┌──────────────────────────────────────┐                    │
│  │           Views & Functions           │                    │
│  │  - kanban_board                       │                    │
│  │  - technician_workload                │                    │
│  │  - daily_dashboard                    │                    │
│  │  - can_invoice_item() [SALES LOCK]   │                    │
│  └──────────────────────────────────────┘                    │
└───────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Inward Bike (Warehouse → System)

```
GRN Receipt → Barcode Assigned → assembly_journeys.status = 'inwarded'
```

### 2. Assignment (Supervisor → Technician)

```
Supervisor selects bike(s) + technician
     ↓
POST /api/assembly/assign
     ↓
assign_to_technician() function
     ↓
assembly_journeys.status = 'assigned'
assembly_journeys.technician_id = assigned
     ↓
assembly_status_history logged (auto trigger)
```

### 3. Assembly (Technician)

```
Technician scans barcode
     ↓
GET /api/assembly/scan/:barcode
     ↓
Technician clicks "Start"
     ↓
POST /api/assembly/start
     ↓
start_assembly() function
     ↓
assembly_journeys.status = 'in_progress'
assembly_journeys.started_at = NOW()
     ↓
Technician checks items (tyres, brakes, gears)
     ↓
PUT /api/assembly/checklist (auto-save)
     ↓
Technician clicks "Complete"
     ↓
POST /api/assembly/complete
     ↓
complete_assembly() validates all 3 items checked
     ↓
assembly_journeys.status = 'completed'
assembly_journeys.completed_at = NOW()
```

### 4. QC Review (QC Person)

```
QC Person sees pending bikes
     ↓
GET /api/assembly/qc/pending
     ↓
Selects bike → Start QC
     ↓
POST /api/assembly/qc/start
     ↓
assembly_journeys.status = 'qc_review'
     ↓
QC Person selects PASS or FAIL
     ↓
POST /api/assembly/qc/submit
     ↓
submit_qc_result() function
     ↓
IF PASS:
   assembly_journeys.status = 'ready_for_sale'
   assembly_journeys.qc_status = 'pass'
ELSE:
   assembly_journeys.status = 'in_progress'
   assembly_journeys.rework_count++
   (sends back to technician)
```

### 5. Sales Lock (POS/ERP Integration)

```
POS tries to create invoice
     ↓
Calls: GET /api/assembly/can-invoice/:barcode
     ↓
can_invoice_item() function checks:
   - Does bike exist?
   - Is status = 'ready_for_sale'?
   - Is qc_status = 'pass'?
     ↓
IF ALL TRUE:
   Returns: { can_invoice: true }
   → POS proceeds with invoice
ELSE:
   Returns: { can_invoice: false, message: "..." }
   → POS blocks invoice
```

## Security Architecture

### Authentication Flow

```
User enters credentials (email/password)
     ↓
POST to Supabase Auth
     ↓
Supabase returns JWT token
     ↓
Frontend stores token
     ↓
Every API request includes:
   Authorization: Bearer <token>
     ↓
Backend middleware verifies JWT with Supabase
     ↓
Fetches user_profile with role
     ↓
Checks role-based permissions
     ↓
Proceeds or returns 403 Forbidden
```

### Role-Based Access Control (RBAC)

| Endpoint | Technician | Supervisor | QC Person | Admin |
|----------|------------|------------|-----------|-------|
| /api/assembly/technician/* | ✅ | ❌ | ❌ | ✅ |
| /api/assembly/assign | ❌ | ✅ | ❌ | ✅ |
| /api/assembly/kanban | ❌ | ✅ | ❌ | ✅ |
| /api/assembly/qc/* | ❌ | ❌ | ✅ | ✅ |
| /api/assembly/dashboard | ❌ | ✅ | ❌ | ✅ |
| /api/assembly/scan/* | ✅ | ✅ | ✅ | ✅ |
| /api/assembly/can-invoice/* | ✅ | ✅ | ✅ | ✅ |

## Database Design

### Core Principle: Single Source of Truth

**assembly_journeys** table is the ONLY place where:
- Current status is stored
- Checklist state is tracked
- QC result is recorded
- Bike location is tracked

All other tables are:
- Audit logs (history tables)
- Reference data (locations, users)
- Reporting views (kanban_board, etc.)

### Key Constraints

1. **Checklist Structure:**
   ```sql
   CONSTRAINT checklist_structure CHECK (
     checklist ? 'tyres' AND
     checklist ? 'brakes' AND
     checklist ? 'gears'
   )
   ```
   Ensures checklist always has exactly 3 items.

2. **Status Progression:**
   Enforced by application logic:
   ```
   inwarded → assigned → in_progress → completed → qc_review → ready_for_sale
                            ↑___________________________|
                            (if QC fails, loops back)
   ```

3. **Unique Barcode:**
   ```sql
   barcode TEXT UNIQUE NOT NULL
   ```
   No duplicate bikes.

### Automatic Triggers

1. **Status History:**
   ```sql
   CREATE TRIGGER log_assembly_status_change
   AFTER UPDATE ON assembly_journeys
   ```
   Auto-logs every status change with who/when.

2. **Location History:**
   ```sql
   CREATE TRIGGER log_assembly_location_change
   AFTER UPDATE ON assembly_journeys
   ```
   Auto-tracks bike movements.

3. **Updated Timestamp:**
   ```sql
   CREATE TRIGGER update_assembly_journeys_updated_at
   BEFORE UPDATE ON assembly_journeys
   ```
   Auto-updates updated_at on every change.

## Frontend Architecture

### Component Structure

```
src/
├── components/
│   ├── technician/
│   │   ├── TechnicianDashboard.jsx   [Main container]
│   │   ├── BikeScanner.jsx           [Barcode input]
│   │   ├── AssemblyChecklist.jsx     [3-item checklist]
│   │   └── QueueList.jsx             [Assigned bikes list]
│   ├── supervisor/
│   │   ├── SupervisorDashboard.jsx   [Main container]
│   │   ├── KanbanBoard.jsx           [Drag-and-drop board]
│   │   └── AssignmentPanel.jsx       [Bulk assign UI]
│   ├── qc/
│   │   ├── QCDashboard.jsx           [Main container]
│   │   └── QCReviewPanel.jsx         [Pass/Fail UI]
│   └── shared/
│       └── SalesLockChecker.jsx      [Invoice validation]
├── contexts/
│   └── AuthContext.jsx                [Global auth state]
├── services/
│   └── api.js                         [Axios + interceptors]
└── pages/
    ├── LoginPage.jsx
    └── DashboardPage.jsx              [Analytics]
```

### State Management

**Global State (Context):**
- User authentication
- User profile (role, name, etc.)

**Local State (Component):**
- UI state (loading, errors)
- Form data (checklist, QC results)
- Lists (queue, pending QC)

**No Redux:** Simple enough for Context API + local state.

### API Integration

All API calls go through centralized `api.js`:

```javascript
// Auto-attaches JWT token
api.interceptors.request.use(async (config) => {
  const { session } = await supabase.auth.getSession();
  config.headers.Authorization = `Bearer ${session.access_token}`;
  return config;
});

// Auto-handles 401 (redirect to login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## Performance Considerations

### Database Indexes

```sql
CREATE INDEX idx_assembly_journeys_barcode ON assembly_journeys(barcode);
CREATE INDEX idx_assembly_journeys_status ON assembly_journeys(current_status);
CREATE INDEX idx_assembly_journeys_technician ON assembly_journeys(technician_id);
```

Most queries filter by barcode or status → fast lookups.

### Materialized Views

Consider if scale >10,000 bikes:

```sql
CREATE MATERIALIZED VIEW daily_stats AS
SELECT ...
FROM assembly_journeys
WHERE created_at >= CURRENT_DATE;

-- Refresh every hour
REFRESH MATERIALIZED VIEW daily_stats;
```

### Frontend Optimizations

- **Code splitting:** React.lazy() for route-based splitting
- **Memoization:** React.memo() for expensive components
- **Debouncing:** Checklist auto-save debounced to 500ms
- **Image lazy loading:** For QC photos (future feature)

## Scalability

### Current Design Handles:

- ✅ 1-100 bikes/day: No changes needed
- ✅ 100-1,000 bikes/day: Add database indexes (already included)
- ⚠️ 1,000-10,000 bikes/day: Consider materialized views for reports
- ⚠️ 10,000+ bikes/day: Consider partitioning assembly_journeys by date

### Bottlenecks to Watch:

1. **Kanban board:** Loads ALL bikes. Solution: Add pagination or virtual scrolling
2. **Dashboard queries:** Complex aggregations. Solution: Cache results for 5-10 minutes
3. **History tables:** Grow forever. Solution: Archive old records (>1 year)

## Deployment Architecture

### Production Setup:

```
┌─────────────────┐
│   Cloudflare    │ (CDN + DNS)
└────────┬────────┘
         │
┌────────▼────────┐
│     Vercel      │ (Frontend - React SPA)
└────────┬────────┘
         │ HTTPS
┌────────▼────────┐
│    Railway      │ (Backend - Node.js API)
│  or Heroku      │
└────────┬────────┘
         │ Supabase Client
┌────────▼────────┐
│   Supabase      │ (PostgreSQL + Auth)
└─────────────────┘
```

### Environment Variables:

**Backend:**
```
SUPABASE_URL=production-url
SUPABASE_SERVICE_ROLE_KEY=secret-key
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
```

**Frontend:**
```
VITE_SUPABASE_URL=production-url
VITE_SUPABASE_ANON_KEY=public-key
VITE_API_URL=https://api.your-domain.com/api
```

## Monitoring & Logging

### What to Monitor:

1. **API Response Times:**
   - Target: <500ms for most endpoints
   - Alert: >2s consistently

2. **Database Query Performance:**
   - Supabase has built-in slow query logs
   - Check queries >1s

3. **Error Rates:**
   - Track 4xx/5xx responses
   - Alert on spike

4. **User Metrics:**
   - Bikes inwarded per day
   - Avg time in each stage
   - QC pass rate %

### Logging Strategy:

**Backend:**
```javascript
// Use morgan for HTTP logging
app.use(morgan('combined'));

// Log business events
console.log('Bike assigned:', { barcode, technician_id, timestamp });
```

**Frontend:**
```javascript
// Sentry or similar for error tracking
// Log important user actions
console.log('Assembly completed:', { barcode, duration });
```

## Security Checklist

✅ JWT authentication on all API endpoints
✅ Role-based access control (RBAC)
✅ SQL injection prevention (parameterized queries via Supabase)
✅ CORS configured (specific origin only)
✅ Helmet.js for security headers
✅ HTTPS only in production
✅ Environment variables for secrets (never commit .env)
✅ Input validation (express-validator)
✅ Password hashing (handled by Supabase Auth)

## Backup & Recovery

### Database Backups:

Supabase provides:
- Daily automatic backups (retained 7 days)
- Point-in-time recovery (paid plans)

**Manual backup script:**
```bash
pg_dump -h your-supabase-host -U postgres buildline > backup.sql
```

### Disaster Recovery Plan:

1. Database corrupted → Restore from Supabase backup
2. Backend down → Auto-restart via Railway/Heroku
3. Frontend down → Vercel auto-deploys from git
4. Supabase down → Wait for Supabase (99.9% uptime SLA)

---

**Last Updated:** 2026-01-22
**Version:** 1.0.0
