const express = require('express');
const router = express.Router();
const assemblyController = require('../controllers/assembly.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { body } = require('express-validator');

// All routes require authentication
router.use(authenticate);

// ============================================================================
// WAREHOUSE/ADMIN ROUTES
// ============================================================================

/**
 * Inward new bike (50% assembled)
 * Role: warehouse_staff, admin
 */
router.post(
  '/inward',
  authorize('warehouse_staff', 'admin', 'supervisor'),
  [
    body('barcode').notEmpty().trim(),
    body('model_sku').notEmpty().trim(),
    body('location_id').isUUID(),
    body('grn_reference').optional().trim()
  ],
  assemblyController.inwardBike
);

/**
 * Bulk inward bikes
 * Role: warehouse_staff, admin, supervisor
 */
router.post(
  '/inward/bulk',
  authorize('warehouse_staff', 'admin', 'supervisor'),
  [
    body('bikes').isArray().withMessage('bikes must be an array')
  ],
  assemblyController.bulkInward
);

// ============================================================================
// SUPERVISOR ROUTES
// ============================================================================

/**
 * Assign bike to technician
 * Role: supervisor, admin
 */
router.post(
  '/assign',
  authorize('supervisor', 'admin'),
  [
    body('barcode').notEmpty().trim(),
    body('technician_id').isUUID()
  ],
  assemblyController.assignBike
);

/**
 * Bulk assign bikes
 * Role: supervisor, admin
 */
router.post(
  '/assign-bulk',
  authorize('supervisor', 'admin'),
  [
    body('barcodes').isArray(),
    body('technician_id').isUUID()
  ],
  assemblyController.bulkAssign
);

/**
 * Set priority flag
 * Role: supervisor, admin
 */
router.post(
  '/set-priority',
  authorize('supervisor', 'admin'),
  [
    body('barcode').notEmpty().trim(),
    body('priority').isBoolean()
  ],
  assemblyController.setPriority
);

// ============================================================================
// TECHNICIAN ROUTES
// ============================================================================

/**
 * Get technician's queue
 * Role: technician
 */
router.get(
  '/technician/queue',
  authorize('technician'),
  assemblyController.getTechnicianQueue
);

/**
 * Scan bike (universal)
 * Role: all
 */
router.get(
  '/scan/:barcode',
  assemblyController.scanBike
);

/**
 * Start assembly
 * Role: technician
 */
router.post(
  '/start',
  authorize('technician'),
  [body('barcode').notEmpty().trim()],
  assemblyController.startAssembly
);

/**
 * Update checklist
 * Role: technician
 */
router.put(
  '/checklist',
  authorize('technician'),
  [
    body('barcode').notEmpty().trim(),
    body('checklist').isObject()
  ],
  assemblyController.updateChecklist
);

/**
 * Complete assembly
 * Role: technician
 */
router.post(
  '/complete',
  authorize('technician'),
  [
    body('barcode').notEmpty().trim(),
    body('checklist').isObject()
  ],
  assemblyController.completeAssembly
);

/**
 * Flag parts missing
 * Role: technician, supervisor
 */
router.post(
  '/flag-parts-missing',
  authorize('technician', 'supervisor', 'admin'),
  [
    body('barcode').notEmpty().trim(),
    body('parts_list').isArray(),
    body('notes').optional().trim()
  ],
  assemblyController.flagPartsMissing
);

/**
 * Report damage
 * Role: technician, supervisor
 */
router.post(
  '/report-damage',
  authorize('technician', 'supervisor', 'admin'),
  [
    body('barcode').notEmpty().trim(),
    body('damage_notes').notEmpty().trim(),
    body('photos').optional().isArray()
  ],
  assemblyController.reportDamage
);

// ============================================================================
// DASHBOARD & REPORTS (Admin/Supervisor)
// ============================================================================

/**
 * Get Kanban board
 * Role: supervisor, admin
 */
router.get(
  '/kanban',
  authorize('supervisor', 'admin'),
  assemblyController.getKanban
);

/**
 * Get dashboard stats
 * Role: supervisor, admin
 */
router.get(
  '/dashboard',
  authorize('supervisor', 'admin'),
  assemblyController.getDashboard
);

/**
 * Get assembly history
 * Role: supervisor, admin
 */
router.get(
  '/history/:journeyId',
  authorize('supervisor', 'admin'),
  assemblyController.getHistory
);

/**
 * Get detailed bike information
 * Role: supervisor, admin
 */
router.get(
  '/bike/:barcode',
  authorize('supervisor', 'admin'),
  assemblyController.getBikeDetails
);

// ============================================================================
// SALES INTEGRATION
// ============================================================================

/**
 * Check if bike can be invoiced (Sales Lock)
 * Role: all authenticated
 */
router.get(
  '/can-invoice/:barcode',
  assemblyController.canInvoice
);

router.get(
  '/locations',
  authorize('warehouse_staff', 'admin', 'supervisor'),
  assemblyController.getLocations
);

// ============================================================================
// BIN LOCATIONS
// ============================================================================

/**
 * Get all bins
 * Role: warehouse_staff, admin, supervisor
 */
router.get(
  '/bins',
  authorize('warehouse_staff', 'admin', 'supervisor'),
  assemblyController.getBins
);

/**
 * Get bins by location
 * Role: warehouse_staff, admin, supervisor
 */
router.get(
  '/bins/location/:locationId',
  authorize('warehouse_staff', 'admin', 'supervisor'),
  assemblyController.getBinsByLocation
);

/**
 * Get available bins (not at full capacity)
 * Role: warehouse_staff, admin, supervisor
 */
router.get(
  '/bins/available',
  authorize('warehouse_staff', 'admin', 'supervisor'),
  assemblyController.getAvailableBins
);

/**
 * Get bins by zone
 * Role: warehouse_staff, admin, supervisor
 */
router.get(
  '/bins/zone/:locationId/:zone',
  authorize('warehouse_staff', 'admin', 'supervisor'),
  assemblyController.getBinsByZone
);

/**
 * Get all bin zones
 * Role: warehouse_staff, admin, supervisor
 */
router.get(
  '/bins/zones',
  authorize('warehouse_staff', 'admin', 'supervisor'),
  assemblyController.getBinZones
);

/**
 * Get bin zone statistics
 * Role: warehouse_staff, admin, supervisor
 */
router.get(
  '/bins/zone-statistics',
  authorize('warehouse_staff', 'admin', 'supervisor'),
  assemblyController.getBinZoneStatistics
);

/**
 * Move bike to specific bin
 * Role: warehouse_staff, admin, supervisor
 */
router.post(
  '/bins/move',
  authorize('warehouse_staff', 'admin', 'supervisor'),
  [
    body('barcode').notEmpty().trim(),
    body('bin_id').isUUID(),
    body('reason').optional().trim()
  ],
  assemblyController.moveBikeToBin
);

/**
 * Get bin movement history
 * Role: warehouse_staff, admin, supervisor
 */
router.get(
  '/bins/movement-history/:journeyId',
  authorize('warehouse_staff', 'admin', 'supervisor'),
  assemblyController.getBinMovementHistory
);

module.exports = router;
