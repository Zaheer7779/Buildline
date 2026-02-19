import axios from 'axios';
import { supabase } from '../config/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - attach auth token
api.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// Assembly API Calls
// ============================================================================

export const assemblyApi = {
  // Inward
  inwardBike: (data) => api.post('/assembly/inward', data),

  bulkInward: (bikes) => api.post('/assembly/inward/bulk', { bikes }),

  // Scan
  scanBike: (barcode) => api.get(`/assembly/scan/${barcode}`),

  // Assign
  assignBike: (barcode, technician_id) =>
    api.post('/assembly/assign', { barcode, technician_id }),

  bulkAssign: (barcodes, technician_id) =>
    api.post('/assembly/assign-bulk', { barcodes, technician_id }),

  // Technician
  getTechnicianQueue: () => api.get('/assembly/technician/queue'),

  startAssembly: (barcode) => api.post('/assembly/start', { barcode }),

  updateChecklist: (barcode, checklist) =>
    api.put('/assembly/checklist', { barcode, checklist }),

  completeAssembly: (barcode, checklist) =>
    api.post('/assembly/complete', { barcode, checklist }),

  // Dashboard
  getKanban: (filters) => api.get('/assembly/kanban', { params: filters }),

  getDashboard: () => api.get('/assembly/dashboard'),

  getHistory: (journeyId) => api.get(`/assembly/history/${journeyId}`),

  getBikeDetails: (barcode) => api.get(`/assembly/bike/${barcode}`),

  // Actions
  setPriority: (barcode, priority) =>
    api.post('/assembly/set-priority', { barcode, priority }),

  flagPartsMissing: (barcode, parts_list, notes) =>
    api.post('/assembly/flag-parts-missing', {
      barcode,
      parts_list,
      notes
    }),

  reportDamage: (barcode, damage_notes, photos) =>
    api.post('/assembly/report-damage', {
      barcode,
      damage_notes,
      photos
    }),

  // Sales lock
  canInvoice: (barcode) => api.get(`/assembly/can-invoice/${barcode}`),

  // Locations
  getLocations: () => api.get('/assembly/locations'),
  createLocation: (data) => api.post('/assembly/locations', data),
  updateLocation: (id, data) => api.put(`/assembly/locations/${id}`, data),
  deleteLocation: (id) => api.delete(`/assembly/locations/${id}`),

  // Bins
  getBins: () => api.get('/assembly/bins'),
  getBinsByLocation: (locationId) => api.get(`/assembly/bins/location/${locationId}`),
  getAvailableBins: (locationId) => api.get('/assembly/bins/available', { params: { location_id: locationId } }),

  // Bin Zones
  getBinsByZone: (locationId, zone) => api.get(`/assembly/bins/zone/${locationId}/${zone}`),
  getBinZones: (locationId) => api.get('/assembly/bins/zones', { params: { location_id: locationId } }),
  getBinZoneStatistics: (locationId) => api.get('/assembly/bins/zone-statistics', { params: { location_id: locationId } }),

  // Bin Movement
  moveBikeToBin: (barcode, bin_id, reason) => api.post('/assembly/bins/move', { barcode, bin_id, reason }),
  getBinMovementHistory: (journeyId) => api.get(`/assembly/bins/movement-history/${journeyId}`)
};

export const userApi = {
  createTechnician: (data) => api.post('/users/technician', data),
  getTechnicians: () => api.get('/users/technicians')
};

export default api;
