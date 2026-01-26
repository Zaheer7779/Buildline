const assemblyService = require('../services/assembly.service');
const { validationResult } = require('express-validator');

class AssemblyController {
  /**
   * Create new assembly journey (Inward bike)
   * POST /api/assembly/inward
   */
  async inwardBike(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      // Sanitize input: convert empty strings to null for UUID fields
      const data = {
        ...req.body,
        bin_location_id: req.body.bin_location_id && req.body.bin_location_id.trim() !== ''
          ? req.body.bin_location_id
          : null
      };

      const journey = await assemblyService.createJourney(data);

      res.status(201).json({
        success: true,
        message: 'Bike inwarded successfully',
        data: journey
      });
    } catch (error) {
      console.error('Inward bike error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to inward bike'
      });
    }
  }

  /**
   * Bulk inward bikes
   * POST /api/assembly/inward/bulk
   */
  async bulkInward(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { bikes } = req.body;

      if (!Array.isArray(bikes) || bikes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'bikes must be a non-empty array'
        });
      }

      // Process bikes one by one
      const successful = [];
      const failed = [];

      for (const bike of bikes) {
        try {
          // Sanitize input
          const data = {
            ...bike,
            bin_location_id: bike.bin_location_id && bike.bin_location_id.trim() !== ''
              ? bike.bin_location_id
              : null
          };

          const journey = await assemblyService.createJourney(data);
          successful.push({
            barcode: bike.barcode,
            journey
          });
        } catch (error) {
          failed.push({
            barcode: bike.barcode,
            error: error.message
          });
        }
      }

      res.status(201).json({
        success: true,
        message: `Successfully inwarded ${successful.length} bikes. Failed: ${failed.length}`,
        data: {
          successful,
          failed,
          total: bikes.length
        }
      });
    } catch (error) {
      console.error('Bulk inward error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to bulk inward bikes'
      });
    }
  }

  /**
   * Get journey by barcode (Scan)
   * GET /api/assembly/scan/:barcode
   */
  async scanBike(req, res) {
    try {
      const { barcode } = req.params;
      const journey = await assemblyService.getJourneyByBarcode(barcode);

      if (!journey) {
        return res.status(404).json({
          success: false,
          message: 'Bike not found'
        });
      }

      res.json({
        success: true,
        data: journey
      });
    } catch (error) {
      console.error('Scan bike error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to scan bike'
      });
    }
  }

  /**
   * Assign bike to technician
   * POST /api/assembly/assign
   */
  async assignBike(req, res) {
    try {
      const { barcode, technician_id } = req.body;
      const supervisor_id = req.profile.id;

      const result = await assemblyService.assignToTechnician(
        barcode,
        technician_id,
        supervisor_id
      );

      res.json(result);
    } catch (error) {
      console.error('Assign bike error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to assign bike'
      });
    }
  }

  /**
   * Bulk assign bikes
   * POST /api/assembly/assign-bulk
   */
  async bulkAssign(req, res) {
    try {
      const { barcodes, technician_id } = req.body;
      const supervisor_id = req.profile.id;

      const results = await assemblyService.bulkAssign(
        barcodes,
        technician_id,
        supervisor_id
      );

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Bulk assign error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to bulk assign'
      });
    }
  }

  /**
   * Start assembly (Technician)
   * POST /api/assembly/start
   */
  async startAssembly(req, res) {
    try {
      const { barcode } = req.body;
      const technician_id = req.profile.id;

      const result = await assemblyService.startAssembly(barcode, technician_id);

      res.json(result);
    } catch (error) {
      console.error('Start assembly error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to start assembly'
      });
    }
  }

  /**
   * Update checklist
   * PUT /api/assembly/checklist
   */
  async updateChecklist(req, res) {
    try {
      const { barcode, checklist } = req.body;
      const technician_id = req.profile.id;

      const journey = await assemblyService.updateChecklist(
        barcode,
        technician_id,
        checklist
      );

      res.json({
        success: true,
        data: journey
      });
    } catch (error) {
      console.error('Update checklist error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update checklist'
      });
    }
  }

  /**
   * Complete assembly
   * POST /api/assembly/complete
   */
  async completeAssembly(req, res) {
    try {
      const { barcode, checklist } = req.body;
      const technician_id = req.profile.id;

      const result = await assemblyService.completeAssembly(
        barcode,
        technician_id,
        checklist
      );

      res.json(result);
    } catch (error) {
      console.error('Complete assembly error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to complete assembly'
      });
    }
  }

  /**
   * Get technician queue
   * GET /api/assembly/technician/queue
   */
  async getTechnicianQueue(req, res) {
    try {
      const technician_id = req.profile.id;
      const queue = await assemblyService.getTechnicianQueue(technician_id);

      // DEBUG: Log to see bin_location structure
      if (queue.length > 0) {
        console.log('=== QUEUE DEBUG ===');
        console.log('First bike:', JSON.stringify(queue[0], null, 2));
        console.log('bin_location value:', queue[0].bin_location);
        console.log('bin_location type:', typeof queue[0].bin_location);
        console.log('==================');
      }

      res.json({
        success: true,
        data: queue
      });
    } catch (error) {
      console.error('Get queue error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get queue'
      });
    }
  }

  /**
   * Get Kanban board
   * GET /api/assembly/kanban
   */
  async getKanban(req, res) {
    try {
      const filters = {
        status: req.query.status,
        location_id: req.query.location_id,
        technician_id: req.query.technician_id,
        priority: req.query.priority === 'true'
      };

      const board = await assemblyService.getKanbanBoard(filters);

      res.json({
        success: true,
        data: board
      });
    } catch (error) {
      console.error('Get Kanban error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get Kanban board'
      });
    }
  }

  /**
   * Get dashboard stats
   * GET /api/assembly/dashboard
   */
  async getDashboard(req, res) {
    try {
      const [daily, bottleneck, technicians, qcFailures] = await Promise.all([
        assemblyService.getDailyDashboard(),
        assemblyService.getBottleneckReport(),
        assemblyService.getTechnicianWorkload(),
        assemblyService.getQCFailureAnalysis()
      ]);

      res.json({
        success: true,
        data: {
          daily,
          bottleneck,
          technicians,
          qc_failures: qcFailures
        }
      });
    } catch (error) {
      console.error('Get dashboard error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get dashboard'
      });
    }
  }

  /**
   * Check if bike can be invoiced (Sales Lock)
   * GET /api/assembly/can-invoice/:barcode
   */
  async canInvoice(req, res) {
    try {
      const { barcode } = req.params;
      const result = await assemblyService.canInvoice(barcode);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Can invoice check error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to check invoice status'
      });
    }
  }

  /**
   * Flag part missing
   * POST /api/assembly/flag-parts-missing
   */
  async flagPartsMissing(req, res) {
    try {
      const { barcode, parts_list, notes } = req.body;

      const journey = await assemblyService.flagPartMissing(
        barcode,
        parts_list,
        notes
      );

      res.json({
        success: true,
        data: journey
      });
    } catch (error) {
      console.error('Flag parts missing error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to flag parts missing'
      });
    }
  }

  /**
   * Report damage
   * POST /api/assembly/report-damage
   */
  async reportDamage(req, res) {
    try {
      const { barcode, damage_notes, photos } = req.body;

      const journey = await assemblyService.reportDamage(
        barcode,
        damage_notes,
        photos
      );

      res.json({
        success: true,
        data: journey
      });
    } catch (error) {
      console.error('Report damage error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to report damage'
      });
    }
  }

  /**
   * Set priority
   * POST /api/assembly/set-priority
   */
  async setPriority(req, res) {
    try {
      const { barcode, priority } = req.body;

      const journey = await assemblyService.setPriority(barcode, priority);

      res.json({
        success: true,
        data: journey
      });
    } catch (error) {
      console.error('Set priority error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to set priority'
      });
    }
  }

  /**
   * Get assembly history
   * GET /api/assembly/history/:journeyId
   */
  async getHistory(req, res) {
    try {
      const { journeyId } = req.params;
      const history = await assemblyService.getAssemblyHistory(journeyId);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get history'
      });
    }
  }
  /**
   * Get all locations
   * GET /api/assembly/locations
   */
  async getLocations(req, res) {
    try {
      const locations = await assemblyService.getLocations();

      res.json({
        success: true,
        data: locations
      });
    } catch (error) {
      console.error('Get locations error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get locations'
      });
    }
  }

  /**
   * Get all bins
   * GET /api/assembly/bins
   */
  async getBins(req, res) {
    try {
      const bins = await assemblyService.getBins();

      res.json({
        success: true,
        data: bins
      });
    } catch (error) {
      console.error('Get bins error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get bins'
      });
    }
  }

  /**
   * Get bins by location
   * GET /api/assembly/bins/location/:locationId
   */
  async getBinsByLocation(req, res) {
    try {
      const { locationId } = req.params;
      const bins = await assemblyService.getBinsByLocation(locationId);

      res.json({
        success: true,
        data: bins
      });
    } catch (error) {
      console.error('Get bins by location error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get bins'
      });
    }
  }

  /**
   * Get detailed bike information
   * GET /api/assembly/bike/:barcode
   */
  async getBikeDetails(req, res) {
    try {
      const { barcode } = req.params;

      const details = await assemblyService.getBikeDetails(barcode);

      res.json({
        success: true,
        data: details
      });
    } catch (error) {
      console.error('Get bike details error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get bike details'
      });
    }
  }

  /**
   * Get available bins (not full)
   * GET /api/assembly/bins/available?location_id=xxx
   */
  async getAvailableBins(req, res) {
    try {
      const { location_id } = req.query;

      // Validate location_id if provided
      if (location_id && location_id.trim() === '') {
        return res.json({
          success: true,
          data: []
        });
      }

      const bins = await assemblyService.getAvailableBins(location_id || null);

      res.json({
        success: true,
        data: bins
      });
    } catch (error) {
      console.error('Get available bins error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get available bins'
      });
    }
  }

  /**
   * Get bins by zone
   * GET /api/assembly/bins/zone/:locationId/:zone
   */
  async getBinsByZone(req, res) {
    try {
      const { locationId, zone } = req.params;

      const bins = await assemblyService.getBinsByZone(locationId, zone);

      res.json({
        success: true,
        data: bins
      });
    } catch (error) {
      console.error('Get bins by zone error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get bins by zone'
      });
    }
  }

  /**
   * Get all bin zones
   * GET /api/assembly/bins/zones?location_id=xxx
   */
  async getBinZones(req, res) {
    try {
      const { location_id } = req.query;

      const zones = await assemblyService.getBinZones(location_id || null);

      res.json({
        success: true,
        data: zones
      });
    } catch (error) {
      console.error('Get bin zones error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get bin zones'
      });
    }
  }

  /**
   * Get bin zone statistics
   * GET /api/assembly/bins/zone-statistics?location_id=xxx
   */
  async getBinZoneStatistics(req, res) {
    try {
      const { location_id } = req.query;

      const stats = await assemblyService.getBinZoneStatistics(location_id || null);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get bin zone statistics error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get zone statistics'
      });
    }
  }

  /**
   * Move bike to specific bin
   * POST /api/assembly/bins/move
   */
  async moveBikeToBin(req, res) {
    try {
      const { barcode, bin_id, reason } = req.body;
      const moved_by = req.profile.id;

      const result = await assemblyService.moveBikeToBin(
        barcode,
        bin_id,
        moved_by,
        reason
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Move bike to bin error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to move bike to bin'
      });
    }
  }

  /**
   * Get bin movement history
   * GET /api/assembly/bins/movement-history/:journeyId
   */
  async getBinMovementHistory(req, res) {
    try {
      const { journeyId } = req.params;

      const history = await assemblyService.getBinMovementHistory(journeyId);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Get bin movement history error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get bin movement history'
      });
    }
  }
}

module.exports = new AssemblyController();
