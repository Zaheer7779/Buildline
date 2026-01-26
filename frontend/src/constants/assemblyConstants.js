/**
 * Assembly Status Labels
 * Maps database status values to human-readable labels
 */
export const ASSEMBLY_STATUS_LABELS = {
  'inwarded': 'Inwarded',
  'assigned': 'Assigned for Assembly',
  'in_progress': 'Assembly in Progress',
  'ready_for_sale': 'Ready for Sale (100%)'
};

/**
 * Bin Zone Labels
 * Maps database zone values to human-readable labels
 */
export const BIN_ZONE_LABELS = {
  'inward_zone': 'Inward Zone',
  'assembly_zone': 'Assembly Zone',
  'ready_zone': 'Ready for Sale Zone'
};

/**
 * Status to Zone Mapping
 * Maps assembly status to the appropriate bin zone
 */
export const STATUS_TO_ZONE_MAP = {
  'inwarded': 'inward_zone',
  'assigned': 'assembly_zone',
  'in_progress': 'assembly_zone',
  'ready_for_sale': 'ready_zone'
};

/**
 * Status Colors for UI
 */
export const STATUS_COLORS = {
  'inwarded': '#6366f1', // Indigo
  'assigned': '#f59e0b', // Amber
  'in_progress': '#3b82f6', // Blue
  'ready_for_sale': '#10b981' // Green
};

/**
 * Zone Colors for UI
 */
export const ZONE_COLORS = {
  'inward_zone': '#6366f1', // Indigo
  'assembly_zone': '#3b82f6', // Blue
  'ready_zone': '#10b981' // Green
};

/**
 * Get status label
 * @param {string} status - Database status value
 * @returns {string} Human-readable label
 */
export const getStatusLabel = (status) => {
  return ASSEMBLY_STATUS_LABELS[status] || status;
};

/**
 * Get zone label
 * @param {string} zone - Database zone value
 * @returns {string} Human-readable label
 */
export const getZoneLabel = (zone) => {
  return BIN_ZONE_LABELS[zone] || zone;
};

/**
 * Get zone for status
 * @param {string} status - Assembly status
 * @returns {string} Corresponding bin zone
 */
export const getZoneForStatus = (status) => {
  return STATUS_TO_ZONE_MAP[status];
};

/**
 * Get status color
 * @param {string} status - Assembly status
 * @returns {string} Color hex code
 */
export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || '#6b7280'; // Default gray
};

/**
 * Get zone color
 * @param {string} zone - Bin zone
 * @returns {string} Color hex code
 */
export const getZoneColor = (zone) => {
  return ZONE_COLORS[zone] || '#6b7280'; // Default gray
};

/**
 * Status progression order
 */
export const STATUS_ORDER = [
  'inwarded',
  'assigned',
  'in_progress',
  'ready_for_sale'
];

/**
 * Get progress percentage based on status
 * @param {string} status - Current status
 * @returns {number} Progress percentage (0-100)
 */
export const getProgressPercentage = (status) => {
  const index = STATUS_ORDER.indexOf(status);
  if (index === -1) return 0;
  return Math.round(((index + 1) / STATUS_ORDER.length) * 100);
};

/**
 * Check if status is complete
 * @param {string} status - Current status
 * @returns {boolean} True if status is ready_for_sale
 */
export const isStatusComplete = (status) => {
  return status === 'ready_for_sale';
};

/**
 * Get next status in the workflow
 * @param {string} currentStatus - Current status
 * @returns {string|null} Next status or null if already at final status
 */
export const getNextStatus = (currentStatus) => {
  const index = STATUS_ORDER.indexOf(currentStatus);
  if (index === -1 || index === STATUS_ORDER.length - 1) return null;
  return STATUS_ORDER[index + 1];
};
