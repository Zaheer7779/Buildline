import React, { useState, useEffect } from 'react';
import { assemblyApi } from '../../services/api';
import { getZoneLabel, getZoneColor, BIN_ZONE_LABELS } from '../../constants/assemblyConstants';

/**
 * Bin Zone View Component
 * Displays bin zones with statistics and occupancy visualization
 */
const BinZoneView = ({ locationId }) => {
  const [zoneStats, setZoneStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneBins, setZoneBins] = useState([]);

  useEffect(() => {
    fetchZoneStatistics();
  }, [locationId]);

  const fetchZoneStatistics = async () => {
    try {
      setLoading(true);
      const response = await assemblyApi.getBinZoneStatistics(locationId);
      setZoneStats(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch zone statistics:', err);
      setError('Failed to load zone statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleZoneClick = async (zone) => {
    if (!locationId) return;

    try {
      setSelectedZone(zone);
      const response = await assemblyApi.getBinsByZone(locationId, zone.status_zone);
      setZoneBins(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch zone bins:', err);
    }
  };

  const getOccupancyColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading bin zones...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (zoneStats.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No bin zones configured for this location</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Bin Zone Overview</h2>
        <button
          onClick={fetchZoneStatistics}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Zone Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {zoneStats.map((zone) => {
          const occupancyPercent = parseFloat(zone.occupancy_percentage) || 0;
          const zoneColor = getZoneColor(zone.status_zone);

          return (
            <div
              key={zone.status_zone}
              onClick={() => handleZoneClick(zone)}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
              style={{ borderLeftWidth: '4px', borderLeftColor: zoneColor }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {getZoneLabel(zone.status_zone)}
                </h3>
                <span
                  className="px-3 py-1 text-xs font-medium rounded-full text-white"
                  style={{ backgroundColor: zoneColor }}
                >
                  {zone.total_bins} Bins
                </span>
              </div>

              {/* Occupancy Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Occupancy</span>
                  <span className="font-semibold text-gray-900">
                    {zone.total_occupancy} / {zone.total_capacity}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${getOccupancyColor(occupancyPercent)}`}
                    style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {occupancyPercent.toFixed(1)}% Full
                </div>
              </div>

              {/* Available Slots */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Available Slots</span>
                <span className="text-lg font-bold text-green-600">
                  {zone.available_slots}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Zone Details Modal/Panel */}
      {selectedZone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  {getZoneLabel(selectedZone.status_zone)} - Bins
                </h3>
                <button
                  onClick={() => setSelectedZone(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {zoneBins.map((bin) => {
                  const binOccupancyPercent = (bin.current_occupancy / bin.capacity) * 100;

                  return (
                    <div
                      key={bin.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{bin.bin_code}</h4>
                          {bin.bin_name && (
                            <p className="text-sm text-gray-600">{bin.bin_name}</p>
                          )}
                          {bin.zone && (
                            <p className="text-xs text-gray-500">{bin.zone}</p>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          bin.current_occupancy >= bin.capacity
                            ? 'bg-red-100 text-red-800'
                            : bin.current_occupancy > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {bin.current_occupancy >= bin.capacity ? 'Full' : bin.current_occupancy > 0 ? 'In Use' : 'Empty'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Capacity</span>
                          <span className="font-medium">{bin.current_occupancy} / {bin.capacity}</span>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getOccupancyColor(binOccupancyPercent)}`}
                            style={{ width: `${Math.min(binOccupancyPercent, 100)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Available: {bin.available_slots}</span>
                          <span>{binOccupancyPercent.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {zoneBins.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No bins found in this zone
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BinZoneView;
