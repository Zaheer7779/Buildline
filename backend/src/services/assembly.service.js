const { supabaseAdmin: supabase } = require('../../config/supabase');

class AssemblyService {
  /**
   * Create new assembly journey (Inward bike)
   */
  async createJourney(data) {
    const { data: journey, error } = await supabase
      .from('assembly_journeys')
      .insert({
        barcode: data.barcode,
        model_sku: data.model_sku,
        frame_number: data.frame_number,
        current_location_id: data.location_id,
        bin_location_id: data.bin_location_id,
        grn_reference: data.grn_reference,
        current_status: 'inwarded'
      })
      .select()
      .single();

    if (error) throw error;
    return journey;
  }

  /**
   * Get journey by barcode
   */
  async getJourneyByBarcode(barcode) {
    const { data, error } = await supabase
      .from('assembly_journeys')
      .select(`
        *,
        current_location:locations(*),
        bin_location:bins(*),
        technician:user_profiles!assembly_journeys_technician_id_fkey(*),
        supervisor:user_profiles!assembly_journeys_supervisor_id_fkey(*),
        qc_person:user_profiles!assembly_journeys_qc_person_id_fkey(*)
      `)
      .eq('barcode', barcode)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Assign bike to technician
   */
  async assignToTechnician(barcode, technicianId, supervisorId) {
    const { data, error } = await supabase.rpc('assign_to_technician', {
      p_barcode: barcode,
      p_technician_id: technicianId,
      p_supervisor_id: supervisorId
    });

    if (error) throw error;
    return data;
  }

  /**
   * Bulk assign bikes to technician
   */
  async bulkAssign(barcodes, technicianId, supervisorId) {
    const results = [];

    for (const barcode of barcodes) {
      try {
        const result = await this.assignToTechnician(barcode, technicianId, supervisorId);
        results.push({ barcode, ...result });
      } catch (error) {
        results.push({
          barcode,
          success: false,
          message: error.message
        });
      }
    }

    return results;
  }

  /**
   * Start assembly (Technician scans to start)
   */
  async startAssembly(barcode, technicianId) {
    const { data, error } = await supabase.rpc('start_assembly', {
      p_barcode: barcode,
      p_technician_id: technicianId
    });

    if (error) throw error;
    return data;
  }

  /**
   * Update checklist item
   */
  async updateChecklist(barcode, technicianId, checklist) {
    const { data, error } = await supabase
      .from('assembly_journeys')
      .update({ checklist })
      .eq('barcode', barcode)
      .eq('technician_id', technicianId)
      .eq('current_status', 'in_progress')
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Complete assembly with checklist validation
   */
  async completeAssembly(barcode, technicianId, checklist) {
    const { data, error } = await supabase.rpc('complete_assembly', {
      p_barcode: barcode,
      p_technician_id: technicianId,
      p_checklist: checklist
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get technician's queue (assigned and in-progress bikes)
   */
  async getTechnicianQueue(technicianId) {
    const { data, error } = await supabase.rpc('get_technician_queue', {
      p_technician_id: technicianId
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get Kanban board view
   */
  async getKanbanBoard(filters = {}) {
    let query = supabase.from('kanban_board').select('*');

    if (filters.status) {
      query = query.eq('current_status', filters.status);
    }

    if (filters.location_id) {
      query = query.eq('current_location_id', filters.location_id);
    }

    if (filters.technician_id) {
      query = query.eq('technician_id', filters.technician_id);
    }

    if (filters.priority) {
      query = query.eq('priority', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  /**
   * Get daily dashboard stats
   */
  async getDailyDashboard() {
    const { data, error } = await supabase
      .from('daily_dashboard')
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get bottleneck report
   */
  async getBottleneckReport() {
    const { data, error } = await supabase
      .from('bottleneck_report')
      .select('*');

    if (error) throw error;
    return data;
  }

  /**
   * Get technician workload
   */
  async getTechnicianWorkload() {
    const { data, error } = await supabase
      .from('technician_workload')
      .select('*');

    if (error) throw error;
    return data;
  }

  /**
   * Get QC failure analysis
   */
  async getQCFailureAnalysis() {
    const { data, error } = await supabase
      .from('qc_failure_analysis')
      .select('*');

    if (error) throw error;
    return data;
  }

  /**
   * Check if bike can be invoiced (Sales Lock)
   */
  async canInvoice(barcode) {
    const { data, error } = await supabase.rpc('can_invoice_item', {
      p_barcode: barcode
    });

    if (error) throw error;
    return data[0]; // RPC returns array
  }

  /**
   * Flag part missing
   */
  async flagPartMissing(barcode, partsList, notes) {
    const { data, error } = await supabase
      .from('assembly_journeys')
      .update({
        parts_missing: true,
        parts_missing_list: partsList,
        notes: notes,
        assembly_paused: true,
        pause_reason: 'parts_missing'
      })
      .eq('barcode', barcode)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Report damage
   */
  async reportDamage(barcode, damageNotes, photos) {
    const { data, error } = await supabase
      .from('assembly_journeys')
      .update({
        damage_reported: true,
        damage_notes: damageNotes,
        damage_photos: photos,
        assembly_paused: true,
        pause_reason: 'damage_reported'
      })
      .eq('barcode', barcode)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Set priority flag
   */
  async setPriority(barcode, priority = true) {
    const { data, error } = await supabase
      .from('assembly_journeys')
      .update({ priority })
      .eq('barcode', barcode)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get assembly history for a bike
   */
  async getAssemblyHistory(journeyId) {
    const { data, error } = await supabase
      .from('assembly_status_history')
      .select(`
        *,
        changed_by_user:user_profiles(full_name, email, role)
      `)
      .eq('journey_id', journeyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
  /**
   * Get all locations
   */
  async getLocations() {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  }

  /**
   * Get all bins
   */
  async getBins() {
    const { data, error } = await supabase
      .from('bins')
      .select(`
        *,
        location:locations(*)
      `)
      .eq('is_active', true)
      .order('bin_code');

    if (error) throw error;
    return data;
  }

  /**
   * Get bins by location
   */
  async getBinsByLocation(locationId) {
    const { data, error } = await supabase
      .from('bins')
      .select('*')
      .eq('location_id', locationId)
      .eq('is_active', true)
      .order('bin_code');

    if (error) throw error;
    return data;
  }

  /**
   * Get detailed bike information
   */
  async getBikeDetails(barcode) {
    const { data, error } = await supabase
      .from('assembly_journeys')
      .select(`
        *,
        location:locations(id, name, code),
        bin_location:bins(id, bin_code, bin_name),
        technician:user_profiles!assembly_journeys_technician_id_fkey(id, full_name, email),
        qc_person:user_profiles!assembly_journeys_qc_person_id_fkey(id, full_name, email)
      `)
      .eq('barcode', barcode)
      .single();

    if (error) throw error;

    // Get timeline from status_history
    const { data: timeline } = await supabase
      .from('status_history')
      .select('status, changed_at')
      .eq('journey_id', data.id)
      .order('changed_at', { ascending: false });

    return {
      ...data,
      technician_name: data.technician?.full_name,
      timeline: timeline?.map(t => ({
        status: t.status,
        timestamp: t.changed_at
      })) || []
    };
  }

  /**
   * Get available bins (not at full capacity)
   */
  async getAvailableBins(locationId = null) {
    let query = supabase
      .from('bins')
      .select(`
        *,
        location:locations(*)
      `)
      .eq('is_active', true)
      .order('bin_code');

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Filter bins where current_occupancy < capacity (not at full capacity)
    const availableBins = data.filter(bin => bin.current_occupancy < bin.capacity);

    return availableBins;
  }

  /**
   * Get bins by zone
   */
  async getBinsByZone(locationId, zone) {
    const { data, error } = await supabase.rpc('get_bins_by_zone', {
      p_location_id: locationId,
      p_zone: zone
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get all bin zones for a location
   */
  async getBinZones(locationId = null) {
    let query = supabase
      .from('bins')
      .select('status_zone, location_id')
      .eq('is_active', true);

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Get unique zones
    const zones = [...new Set(data.map(b => b.status_zone))];
    return zones;
  }

  /**
   * Get bin zone statistics
   */
  async getBinZoneStatistics(locationId = null) {
    let query = supabase.from('bin_zone_statistics').select('*');

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Move bike to specific bin manually
   */
  async moveBikeToBin(barcode, newBinId, movedBy, reason = null) {
    const { data, error } = await supabase.rpc('move_bike_to_bin', {
      p_barcode: barcode,
      p_new_bin_id: newBinId,
      p_moved_by: movedBy,
      p_reason: reason
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get bin movement history for a bike
   */
  async getBinMovementHistory(journeyId) {
    const { data, error } = await supabase
      .from('bin_movement_history')
      .select(`
        *,
        from_bin:bins!bin_movement_history_from_bin_id_fkey(bin_code, bin_name, status_zone),
        to_bin:bins!bin_movement_history_to_bin_id_fkey(bin_code, bin_name, status_zone),
        moved_by_user:user_profiles(full_name, email)
      `)
      .eq('journey_id', journeyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Get status display labels
   */
  getStatusLabel(status) {
    const labels = {
      'inwarded': 'Inwarded',
      'assigned': 'Assigned for Assembly',
      'in_progress': 'Assembly in Progress',
      'completed': 'Assembly Completed',
      'qc_review': 'Quality Check (QC)',
      'ready_for_sale': 'Ready for Sale (100%)'
    };
    return labels[status] || status;
  }

  /**
   * Get zone display labels
   */
  getZoneLabel(zone) {
    const labels = {
      'inward_zone': 'Inward Zone',
      'assembly_zone': 'Assembly Zone',
      'completion_zone': 'Completion Zone',
      'qc_zone': 'QC Zone',
      'ready_zone': 'Ready for Sale Zone'
    };
    return labels[zone] || zone;
  }
}

module.exports = new AssemblyService();
