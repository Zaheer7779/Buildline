import React, { useState } from 'react';
import { FaFlag, FaClock } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { BikeDetailModal } from './BikeDetailModal';

export const KanbanBoard = ({ bikes, onSetPriority, onRefresh }) => {
  const [selectedBike, setSelectedBike] = useState(null);
  const stages = [
    { key: 'inwarded', label: 'Inwarded', color: 'bg-gray-100' },
    { key: 'assigned', label: 'Assigned', color: 'bg-orange-100' },
    { key: 'in_progress', label: 'In Progress', color: 'bg-blue-100' },
    { key: 'ready_for_sale', label: 'Ready for Sale', color: 'bg-green-100' }
  ];

  return (
    <div className="overflow-x-auto pb-4 -mx-2 sm:mx-0">
      <div className="flex gap-2 sm:gap-4 min-w-max px-2 sm:px-0">
        {stages.map((stage) => {
          const stageBikes = bikes.filter(
            (b) => b.current_status === stage.key
          );

          return (
            <div key={stage.key} className="w-64 sm:w-80 flex-shrink-0">
              <div className={`${stage.color} rounded-t-lg px-2 sm:px-4 py-2 sm:py-3`}>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                  {stage.label}
                  <span className="ml-2 text-xs sm:text-sm font-normal">
                    ({stageBikes.length})
                  </span>
                </h3>
              </div>

              <div className="bg-gray-50 rounded-b-lg p-1.5 sm:p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-200px)] sm:max-h-[calc(100vh-250px)] overflow-y-auto">
                {stageBikes.map((bike) => (
                  <BikeCard
                    key={bike.id}
                    bike={bike}
                    onSetPriority={onSetPriority}
                    onClick={() => setSelectedBike(bike)}
                  />
                ))}

                {stageBikes.length === 0 && (
                  <div className="text-center text-gray-400 py-8 text-xs sm:text-sm">
                    No cycles
                  </div>
                )}
              </div>
            </div>
          );
        })}
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

const BikeCard = ({ bike, onSetPriority, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow p-2.5 sm:p-4 hover:shadow-md transition-shadow cursor-pointer active:scale-95"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 text-xs sm:text-sm truncate">{bike.model_sku}</h4>
          <p className="text-xs text-gray-500 truncate">{bike.barcode}</p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSetPriority(bike.barcode, !bike.priority);
          }}
          className={`p-1 rounded flex-shrink-0 ml-2 ${bike.priority
              ? 'text-red-600 hover:bg-red-50'
              : 'text-gray-400 hover:bg-gray-50'
            }`}
          title={bike.priority ? 'Remove priority' : 'Mark as priority'}
        >
          <FaFlag className="text-xs sm:text-sm" />
        </button>
      </div>

      {bike.technician_name && (
        <div className="text-xs text-gray-600 mb-1.5 truncate">
          👤 {bike.technician_name}
        </div>
      )}

      {bike.hours_in_current_status && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
          <FaClock className="text-xs flex-shrink-0" />
          <span>
            {Math.round(bike.hours_in_current_status)}h in this stage
          </span>
        </div>
      )}

      {bike.rework_count > 0 && (
        <div className="mt-1.5 text-xs font-medium text-red-600">
          🔄 Rework #{bike.rework_count}
        </div>
      )}

      {bike.parts_missing && (
        <div className="mt-1.5 text-xs font-medium text-orange-600">
          ⚠️ Parts Missing
        </div>
      )}

      {bike.damage_reported && (
        <div className="mt-1.5 text-xs font-medium text-red-600">
          💥 Damage Reported
        </div>
      )}
    </div>
  );
};
