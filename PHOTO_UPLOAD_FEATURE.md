# Photo Upload Feature Implementation

## Overview
Professional photo/media upload system for documenting issues during assembly and QC processes. Supervisors can view all photos from damage reports and QC failures in a comprehensive detail view.

## Features Implemented

### 1. Technician Damage Reporting
- **Component**: `ReportIssueModal.jsx`
- **Trigger**: "Report Issue" button in Assembly Checklist
- **Capabilities**:
  - Report two types of issues: Damage or Missing Parts
  - Upload photos (required for damage, optional for missing parts)
  - Add notes describing the issue
  - Photos are base64 encoded and stored in database

### 2. QC Failure Documentation
- **Component**: `QCReviewPanel.jsx` (updated)
- **Trigger**: Marking a bike as FAIL during QC review
- **Capabilities**:
  - Upload photos documenting quality issues (required for FAIL)
  - Photos must be provided to submit a QC failure
  - Photos stored with failure reason for supervisor review

### 3. Photo Upload Component
- **Component**: `PhotoUpload.jsx` (shared component)
- **Features**:
  - Drag-and-drop or click to upload
  - Maximum 5 photos per report
  - 5MB file size limit per photo
  - Validates image files only (jpg, jpeg, png, gif, webp)
  - Grid display with delete functionality
  - Base64 encoding for database storage
  - Shows upload progress and photo count

### 4. Photo Gallery Viewer
- **Component**: `PhotoGallery.jsx` (shared component)
- **Features**:
  - Lightbox display for viewing photos
  - Click to expand, swipe between photos
  - Keyboard navigation (arrow keys, escape)
  - Shows photo counter (e.g., "2/5")
  - Professional full-screen viewing experience

### 5. Supervisor Detail View
- **Component**: `BikeDetailModal.jsx` (new)
- **Integration**: `KanbanBoard.jsx` (updated)
- **Features**:
  - Click any bike card in Kanban to view details
  - Comprehensive bike information display
  - Damage reports with photos in red alert section
  - QC failure photos in failure section
  - Photo thumbnails clickable to open lightbox
  - Timeline of status changes
  - Technician and QC person information

## Technical Implementation

### Frontend Components Created/Modified

1. **frontend/src/components/shared/PhotoUpload.jsx** (new)
   - Reusable photo upload component
   - File validation and base64 encoding
   - Grid display with delete functionality

2. **frontend/src/components/technician/ReportIssueModal.jsx** (new)
   - Modal for reporting damage/missing parts
   - Integrates PhotoUpload component
   - Calls `assemblyApi.reportDamage()` or `flagPartsMissing()`

3. **frontend/src/components/shared/PhotoGallery.jsx** (new)
   - Lightbox photo viewer
   - Keyboard and click navigation

4. **frontend/src/components/supervisor/BikeDetailModal.jsx** (new)
   - Comprehensive bike detail view
   - Displays damage and QC photos
   - Opens PhotoGallery on photo click

5. **frontend/src/components/technician/AssemblyChecklist.jsx** (updated)
   - Added "Report Issue" button
   - Integrated with ReportIssueModal

6. **frontend/src/components/technician/TechnicianDashboard.jsx** (updated)
   - Added ReportIssueModal state management
   - Passes callback to AssemblyChecklist

7. **frontend/src/components/qc/QCReviewPanel.jsx** (updated)
   - Added PhotoUpload component for FAIL scenario
   - Required photos when marking as FAIL
   - Passes photos to submitQC API

8. **frontend/src/components/supervisor/KanbanBoard.jsx** (updated)
   - Made bike cards clickable
   - Integrated BikeDetailModal
   - Prevents priority button from triggering card click

9. **frontend/src/services/api.js** (updated)
   - Added `getBikeDetails(barcode)` method

### Backend Implementation

1. **backend/src/routes/assembly.routes.js** (updated)
   - Added GET `/api/assembly/bike/:barcode` route
   - Role: supervisor, admin
   - Returns comprehensive bike details

2. **backend/src/controllers/assembly.controller.js** (updated)
   - Added `getBikeDetails()` controller method
   - Fetches bike details from service

3. **backend/src/services/assembly.service.js** (updated)
   - Added `getBikeDetails()` service method
   - Fetches journey with technician, QC person, location, bin
   - Includes timeline from status_history table
   - Returns all photo arrays (damage_photos, qc_photos)

### Database Schema

**No migration needed!** The database already has the necessary columns:

```sql
-- assembly_journeys table (from 001_initial_schema.sql)
damage_photos TEXT[],  -- Array of base64 encoded images
qc_photos TEXT[],      -- Array of base64 encoded images
```

Existing methods already handle photos:
- `submitQC()` RPC function accepts photos parameter
- `reportDamage()` updates damage_photos column

## Usage Instructions

### For Technicians

1. **Start Assembly**: Select a bike from your queue
2. **During Assembly**: If you find damage or missing parts:
   - Click "Report Issue (Damage/Missing Parts)" button
   - Select issue type (Damage or Parts Missing)
   - Upload photos (required for damage)
   - Add notes describing the issue
   - Submit

### For QC Personnel

1. **Review Bike**: Select a bike from QC queue
2. **If Issues Found**:
   - Select "FAIL"
   - Choose failure reason
   - Upload photos documenting the issues (required)
   - Submit QC FAIL

### For Supervisors

1. **View Kanban Board**: See all bikes in different stages
2. **Click Any Bike Card**: Opens detailed view with:
   - Basic bike information
   - Assembly checklist status
   - Damage reports with photos
   - Parts missing alerts
   - QC status with failure photos
   - Complete timeline
3. **View Photos**: Click any photo thumbnail to open full-screen lightbox

## Photo Storage

- **Format**: Base64 encoded strings
- **Storage**: PostgreSQL TEXT[] columns
- **Limit**: 5 photos per report, 5MB per photo
- **Types**: Images only (jpg, jpeg, png, gif, webp)

### Future Enhancement Options

For production with many photos, consider:
- Migrate to Supabase Storage for file hosting
- Store URLs instead of base64 in database
- Implement image compression
- Add thumbnail generation

## Files Summary

### New Files (8)
- `frontend/src/components/shared/PhotoUpload.jsx`
- `frontend/src/components/shared/PhotoGallery.jsx`
- `frontend/src/components/technician/ReportIssueModal.jsx`
- `frontend/src/components/supervisor/BikeDetailModal.jsx`
- `PHOTO_UPLOAD_FEATURE.md` (this file)

### Modified Files (7)
- `frontend/src/components/technician/AssemblyChecklist.jsx`
- `frontend/src/components/technician/TechnicianDashboard.jsx`
- `frontend/src/components/qc/QCReviewPanel.jsx`
- `frontend/src/components/supervisor/KanbanBoard.jsx`
- `frontend/src/services/api.js`
- `backend/src/routes/assembly.routes.js`
- `backend/src/controllers/assembly.controller.js`
- `backend/src/services/assembly.service.js`

## Testing Checklist

- [ ] Technician can report damage with photos
- [ ] Photos are required for damage reports
- [ ] QC can fail bike with photos
- [ ] Photos are required for QC failures
- [ ] Photo upload validates file types
- [ ] Photo upload enforces size limits (5MB)
- [ ] Maximum 5 photos enforced
- [ ] Supervisor can view bike details
- [ ] Damage photos display in supervisor view
- [ ] QC failure photos display in supervisor view
- [ ] Photo gallery lightbox works
- [ ] Keyboard navigation in gallery works
- [ ] Photos persist after page refresh

## API Endpoints

### New
- `GET /api/assembly/bike/:barcode` - Get detailed bike information

### Existing (now with photo support)
- `POST /api/assembly/report-damage` - Report damage with photos
- `POST /api/assembly/qc/submit` - Submit QC with photos

## Professional Features

✅ Validation: File type, size, and count limits
✅ User Experience: Drag-and-drop, preview, delete
✅ Accessibility: Keyboard navigation, clear labels
✅ Error Handling: Validation messages, required fields
✅ Visual Feedback: Upload progress, photo counters
✅ Responsive Design: Works on all screen sizes
✅ Integration: Seamless with existing workflows

This implementation provides a complete, professional photo documentation system for the assembly tracking workflow.
