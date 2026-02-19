import React, { useState } from 'react';
import { FaExclamationTriangle, FaCamera, FaPause, FaUser } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { BikeDetailModal } from './BikeDetailModal';

export const DamagedBikesList = ({ bikes, onRefresh }) => {
  const [selectedBike, setSelectedBike] = useState(null);

  const damagedBikes = bikes.filter((b) => b.damage_reported);

  if (damagedBikes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <FaExclamationTriangle className="text-4xl text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-600">No Damaged Bikes</h3>
        <p className="text-sm text-gray-400 mt-1">
          No bikes have been reported as damaged
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <FaExclamationTriangle className="text-red-600 text-xl flex-shrink-0" />
          <div>
            <h3 className="font-bold text-red-900">
              {damagedBikes.length} Damaged Bike{damagedBikes.length !== 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-red-700">
              These bikes have been reported with damage and need attention
            </p>
          </div>
        </div>
      </div>

      {/* Damaged Bikes Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {damagedBikes.map((bike) => (
          <div
            key={bike.id}
            onClick={() => setSelectedBike(bike)}
            className="bg-white rounded-lg shadow border-l-4 border-red-500 p-4 hover:shadow-lg transition-shadow cursor-pointer active:scale-[0.98]"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0">
                <h4 className="font-bold text-gray-900 text-sm truncate">
                  {bike.model_sku}
                </h4>
                <p className="text-xs text-gray-500 truncate">{bike.barcode}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 ${
                bike.current_status === 'inwarded' ? 'bg-gray-100 text-gray-700' :
                bike.current_status === 'assigned' ? 'bg-orange-100 text-orange-700' :
                bike.current_status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                'bg-green-100 text-green-700'
              }`}>
                {bike.current_status?.replace('_', ' ')}
              </span>
            </div>

            {/* Damage Info */}
            <div className="bg-red-50 rounded-lg p-3 mb-3">
              <div className="flex items-start gap-2">
                <FaExclamationTriangle className="text-red-500 text-sm mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-800 line-clamp-2">
                  {bike.damage_notes || 'Damage reported - view details'}
                </p>
              </div>
            </div>

            {/* Damage Photos Preview */}
            {bike.damage_photos && bike.damage_photos.length > 0 && (
              <div className="flex gap-1 mb-3 overflow-hidden">
                {bike.damage_photos.slice(0, 3).map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Damage ${index + 1}`}
                    className="w-16 h-16 object-cover rounded border border-red-200"
                  />
                ))}
                {bike.damage_photos.length > 3 && (
                  <div className="w-16 h-16 bg-red-100 rounded border border-red-200 flex items-center justify-center">
                    <span className="text-xs font-bold text-red-600">
                      +{bike.damage_photos.length - 3}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              {bike.technician_name && (
                <div className="flex items-center gap-1">
                  <FaUser className="text-gray-400" />
                  <span>{bike.technician_name}</span>
                </div>
              )}
              {bike.assembly_paused && (
                <div className="flex items-center gap-1 text-orange-600">
                  <FaPause />
                  <span>Paused</span>
                </div>
              )}
            </div>

            {/* View Details CTA */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs font-medium text-blue-600">
                Tap to view details & photos
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Bike Detail Modal */}
      {selectedBike && (
        <BikeDetailModal
          bike={selectedBike}
          onClose={() => setSelectedBike(null)}
        />
      )}
    </div>
  );
};
