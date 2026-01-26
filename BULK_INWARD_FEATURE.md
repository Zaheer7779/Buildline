# Bulk Inward Feature

## Overview
Professional bulk cycle inward system that allows supervisors and warehouse staff to add multiple cycles to the system at once using CSV upload or manual entry.

## Features

### 1. CSV Upload Mode
- **Upload CSV File**: Import cycles from a properly formatted CSV file
- **Download Template**: Get a CSV template with correct format
- **Data Validation**: Validates file format, data structure, and bin codes
- **Preview Table**: Shows parsed data before submission
- **Bin Code Mapping**: Automatically maps bin codes to bin IDs
- **Error Detection**: Highlights missing bins or invalid data

### 2. Manual Entry Mode
- **Dynamic Rows**: Add/remove rows as needed
- **Inline Editing**: Edit all fields directly in table
- **Bin Dropdown**: Select bins from available options
- **Row Counter**: Shows number of valid entries
- **Validation**: Only submits rows with barcode and model_sku

### 3. Common Features
- **Location Selection**: Choose warehouse location for all cycles
- **Progress Tracking**: Shows real-time progress during bulk processing
- **Success/Failure Report**: Detailed results showing which cycles succeeded/failed
- **Partial Success**: Successfully processes valid entries even if some fail
- **Real-time Bin Loading**: Available bins load when location is selected

## Usage Instructions

### For Supervisors/Warehouse Staff

#### Using CSV Upload:

1. **Navigate to Inward Tab**
   - Click "Inward Cycles" in supervisor dashboard
   - Click "📦 Bulk Inward" button

2. **Select CSV Upload Mode**
   - Click "CSV Upload" tab
   - Download the CSV template using "Download Template" button

3. **Prepare Your CSV File**
   ```csv
   barcode,model_sku,frame_number,grn_reference,bin_code
   BIKE-001,HERO-SPRINT-24-RED,FRAME001,GRN-001,A1-01
   BIKE-002,HERO-SPRINT-24-BLUE,FRAME002,GRN-001,A1-02
   BIKE-003,HERO-SPRINT-26-BLACK,FRAME003,GRN-002,A1-03
   ```

   **CSV Format:**
   - `barcode` (required): Unique bike identifier
   - `model_sku` (required): Model name/SKU
   - `frame_number` (optional): Frame serial number
   - `grn_reference` (optional): GRN reference number
   - `bin_code` (optional): Bin code (e.g., A1-01)

4. **Upload and Review**
   - Click to upload or drag-drop your CSV file
   - Review the parsed data in the preview table
   - Check for any warnings (invalid bin codes)
   - Select the warehouse location

5. **Submit**
   - Click "Inward All Cycles"
   - Monitor progress bar
   - Review success/failure report
   - Successful cycles are immediately available in the system

#### Using Manual Entry:

1. **Navigate to Inward Tab**
   - Click "Inward Cycles" in supervisor dashboard
   - Click "📦 Bulk Inward" button

2. **Select Manual Entry Mode**
   - Click "Manual Entry" tab
   - Select warehouse location

3. **Add Cycles**
   - Fill in the first row:
     - Barcode (required)
     - Model SKU (required)
     - Frame Number (optional)
     - GRN Reference (optional)
     - Bin Location (optional, select from dropdown)

4. **Add More Rows**
   - Click "Add Row" button to add another cycle
   - Remove rows with the trash icon if needed

5. **Submit**
   - Click "Inward All Cycles"
   - Only valid rows (with barcode and model_sku) will be processed
   - Review success/failure report

## CSV Template Format

### Required Columns:
- `barcode` - Unique identifier for the bike
- `model_sku` - Model name or SKU

### Optional Columns:
- `frame_number` - Physical frame serial number
- `grn_reference` - Goods Receipt Note reference
- `bin_code` - Bin location code (must exist in system)

### Example CSV:
```csv
barcode,model_sku,frame_number,grn_reference,bin_code
DEMO-BIKE-001,HERO-SPRINT-24-RED,FR001,GRN2024-001,A1-01
DEMO-BIKE-002,HERO-SPRINT-24-BLUE,FR002,GRN2024-001,A1-02
DEMO-BIKE-003,HERO-SPRINT-26-BLACK,FR003,GRN2024-002,A2-01
DEMO-BIKE-004,HERO-SPRINT-26-RED,FR004,GRN2024-002,A2-02
DEMO-BIKE-005,HERO-SPRINT-24-GREEN,,,
```

**Notes:**
- Empty fields are allowed (just leave blank or omit)
- Bin codes must match existing bins in the selected location
- Invalid bin codes won't fail the import - bins will be left unassigned

## Technical Implementation

### Frontend Components

#### BulkInwardModal.jsx (New Component)
**Location:** `frontend/src/components/supervisor/BulkInwardModal.jsx`

**Features:**
- Dual-mode interface (CSV vs Manual)
- CSV parsing and validation
- Manual entry table with add/remove rows
- Bin code to bin ID mapping
- Progress tracking
- Success/failure reporting

**State Management:**
- `mode`: 'csv' or 'manual'
- `selectedLocation`: Current warehouse location
- `csvFile`: Uploaded CSV file
- `parsedData`: Parsed CSV entries
- `manualEntries`: Array of manual entries
- `bins`: Available bins for selected location
- `loading`: Processing state
- `progress`: Current operation progress

#### SupervisorDashboard.jsx (Updated)
**Changes:**
- Imported BulkInwardModal component
- Added `showBulkInwardModal` state
- Added "Bulk Inward" button in Inward view
- Integrated modal with proper callbacks

### Backend Implementation

#### Routes (assembly.routes.js)
**New Route:**
```javascript
POST /api/assembly/inward/bulk
```

**Authorization:** warehouse_staff, admin, supervisor

**Request Body:**
```json
{
  "bikes": [
    {
      "barcode": "BIKE-001",
      "model_sku": "HERO-SPRINT-24-RED",
      "frame_number": "FR001",
      "grn_reference": "GRN-001",
      "location_id": "uuid",
      "bin_location_id": "uuid-or-null"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully inwarded 5 bikes. Failed: 0",
  "data": {
    "successful": [
      {
        "barcode": "BIKE-001",
        "journey": { /* journey object */ }
      }
    ],
    "failed": [],
    "total": 5
  }
}
```

#### Controller (assembly.controller.js)
**New Method:** `bulkInward(req, res)`

**Processing Logic:**
1. Validates request (bikes array required)
2. Iterates through each bike
3. Sanitizes bin_location_id (empty strings to null)
4. Calls `assemblyService.createJourney()` for each
5. Tracks successful and failed entries
6. Returns comprehensive report

**Error Handling:**
- Individual bike failures don't stop the batch
- Failed bikes are collected with error messages
- Partial success is allowed and reported

### API Integration

#### api.js (Updated)
**New Method:**
```javascript
bulkInward: (bikes) => api.post('/assembly/inward/bulk', { bikes })
```

**Usage:**
```javascript
const bikes = [
  { barcode: 'BIKE-001', model_sku: 'HERO-SPRINT', location_id: 'uuid' },
  { barcode: 'BIKE-002', model_sku: 'HERO-SPRINT', location_id: 'uuid' }
];

const response = await assemblyApi.bulkInward(bikes);
```

## Workflow Examples

### Example 1: CSV Upload with 10 Bikes
```
1. User clicks "Bulk Inward" → Modal opens
2. Selects "CSV Upload" mode
3. Downloads template
4. Fills template with 10 bikes
5. Uploads CSV file
6. System parses: "Parsed 10 cycles from CSV"
7. Preview table shows all 10 bikes
8. Selects location: "Warehouse A"
9. Clicks "Inward All Cycles"
10. Progress bar: 0/10 → 5/10 → 10/10
11. Success: "Successfully inwarded 10 cycles"
12. Modal closes, kanban refreshes
13. All 10 bikes appear in "Inwarded" column
```

### Example 2: Manual Entry with 3 Bikes
```
1. User clicks "Bulk Inward" → Modal opens
2. Selects "Manual Entry" mode
3. Selects location: "Warehouse A"
4. Fills first row:
   - Barcode: BIKE-001
   - Model: HERO-SPRINT-24
   - Bin: A1-01
5. Clicks "Add Row" (2 more times)
6. Fills remaining rows
7. Counter shows: "3 valid entries"
8. Clicks "Inward All Cycles"
9. Success: "Successfully inwarded 3 cycles"
10. Modal closes
```

### Example 3: Partial Success Scenario
```
CSV contains 5 bikes:
- BIKE-001 ✓ Success
- BIKE-002 ✓ Success
- BIKE-002 ✗ Failed (duplicate barcode)
- BIKE-003 ✓ Success
- BIKE-004 ✓ Success

Result:
"Inwarded 4 cycles. Failed to inward 1 cycle"

Failed entries shown in console:
"BIKE-002: Duplicate barcode"
```

## Error Handling

### Frontend Validation:
- ✅ File type must be CSV
- ✅ At least one valid entry required
- ✅ Location must be selected
- ✅ Barcode and model_sku are required fields
- ✅ Warns about invalid bin codes

### Backend Validation:
- ✅ bikes array must be non-empty
- ✅ Each bike processed independently
- ✅ Failures don't stop batch processing
- ✅ Detailed error messages for each failure

### Common Errors:
| Error | Cause | Solution |
|-------|-------|----------|
| "Please upload a CSV file" | Wrong file type | Upload .csv file |
| "CSV file is empty" | No data rows | Add bike data to CSV |
| "Please select a location" | No location selected | Choose warehouse location |
| "Bin not found" | Invalid bin code | Check bin codes or leave empty |
| "Duplicate barcode" | Barcode already exists | Use unique barcodes |

## Benefits

### Time Savings:
- Import 50+ bikes in under 2 minutes
- No need to enter bikes one-by-one
- Reusable CSV templates

### Data Quality:
- Bulk validation before submission
- Preview before confirming
- Clear error reporting

### Flexibility:
- CSV for large batches
- Manual for small batches
- Mix of optional fields supported

### User Experience:
- Professional modal interface
- Progress tracking
- Success/failure feedback
- Downloadable template

## Files Modified/Created

### New Files (1):
- `frontend/src/components/supervisor/BulkInwardModal.jsx`

### Modified Files (3):
- `frontend/src/components/supervisor/SupervisorDashboard.jsx` - Added bulk inward button and modal
- `frontend/src/services/api.js` - Added bulkInward API method
- `backend/src/routes/assembly.routes.js` - Added bulk inward route
- `backend/src/controllers/assembly.controller.js` - Added bulkInward controller

## Future Enhancements

### Potential Additions:
- 📊 Import history and logs
- 📁 Save/load CSV drafts
- 🔄 Retry failed entries
- 📧 Email report after bulk import
- 📋 Import from Excel (.xlsx)
- 🎯 Auto-assign to technicians during bulk import
- 📸 Bulk photo upload for bikes
- 🏷️ Barcode label printing for bulk imports

## Testing Checklist

- [ ] CSV template downloads correctly
- [ ] CSV parsing handles all field types
- [ ] Invalid bin codes are detected
- [ ] Manual entry allows add/remove rows
- [ ] Location change updates bin options
- [ ] Progress bar shows during processing
- [ ] Success toast for all successful
- [ ] Error toast for any failures
- [ ] Partial success handled correctly
- [ ] Bikes appear in kanban immediately
- [ ] Duplicate barcodes are rejected
- [ ] Empty fields are handled properly
- [ ] Large files (100+ bikes) work
- [ ] Modal can be cancelled mid-process

This feature significantly improves the efficiency of onboarding new inventory!
