import React, { useState } from 'react';
import { FaFlag, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { BikeDetailModal } from './BikeDetailModal';

const stages = [
  { key: 'inwarded', label: 'Inwarded', color: 'bg-gray-100', activeColor: 'bg-gray-600' },
  { key: 'assigned', label: 'Assigned', color: 'bg-orange-100', activeColor: 'bg-orange-500' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-blue-100', activeColor: 'bg-blue-600' },
  { key: 'ready_for_sale', label: 'Ready', color: 'bg-green-100', activeColor: 'bg-green-600' },
  { key: 'damaged', label: 'Damaged', color: 'bg-red-100', activeColor: 'bg-red-600' }
];

export const KanbanBoard = ({ bikes, onSetPriority, onRefresh }) => {
  const [selectedBike, setSelectedBike] = useState(null);
  const [activeStage, setActiveStage] = useState('inwarded');

  const getBikesForStage = (key) => {
    if (key === 'damaged') {
      return bikes.filter((b) => b.damage_reported);
    }
    return bikes.filter((b) => b.current_status === key);
  };

  const activeBikes = getBikesForStage(activeStage);

  return (
    <div>
      {/* Stage selector buttons - always shown */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-3 mb-4">
        {stages.map((stage) => {
          const count = getBikesForStage(stage.key).length;
          const isActive = activeStage === stage.key;
          return (
            <button
              key={stage.key}
              onClick={() => setActiveStage(stage.key)}
              className={`py-3 sm:py-4 px-1 sm:px-2 rounded-xl text-center transition-all ${
                isActive
                  ? `${stage.activeColor} text-white shadow-lg scale-[1.02]`
                  : `${stage.color} text-gray-700 hover:shadow-md`
              }`}
            >
              <div className={`text-[10px] sm:text-xs font-bold leading-tight ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                {stage.label}
              </div>
              <div className={`text-xl sm:text-3xl font-bold mt-0.5 ${isActive ? 'text-white' : 'text-gray-900'}`}>
                {count}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active stage header */}
      <div className={`${stages.find(s => s.key === activeStage)?.color} rounded-lg px-4 py-2.5 mb-3 flex items-center justify-between`}>
        <h3 className="font-bold text-gray-900 text-sm sm:text-base">
          {stages.find(s => s.key === activeStage)?.label}
          <span className="ml-2 text-xs sm:text-sm font-normal text-gray-600">
            ({activeBikes.length} cycle{activeBikes.length !== 1 ? 's' : ''})
          </span>
        </h3>
        {activeStage === 'damaged' && (
          <FaExclamationTriangle className="text-red-500" />
        )}
      </div>

      {/* Bikes list */}
      <div className="space-y-2">
        {activeBikes.map((bike) => (
          <BikeCard
            key={bike.id}
            bike={bike}
            onSetPriority={onSetPriority}
            onClick={() => setSelectedBike(bike)}
            showDamageInfo={activeStage === 'damaged'}
          />
        ))}

        {activeBikes.length === 0 && (
          <div className="text-center text-gray-400 py-16 text-sm">
            No cycles in this stage
          </div>
        )}
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

const BikeCard = ({ bike, onSetPriority, onClick, showDamageInfo }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98] ${
        showDamageInfo ? 'border-l-4 border-red-500' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 text-sm truncate">{bike.model_sku}</h4>
          <p className="text-xs text-gray-500 truncate">{bike.barcode}</p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSetPriority(bike.barcode, !bike.priority);
          }}
          className={`p-1.5 rounded flex-shrink-0 ml-2 ${bike.priority
              ? 'text-red-600 bg-red-50'
              : 'text-gray-400 hover:bg-gray-50'
            }`}
          title={bike.priority ? 'Remove priority' : 'Mark as priority'}
        >
          <FaFlag className="text-sm" />
        </button>
      </div>

      {bike.technician_name && (
        <div className="text-xs text-gray-600 mb-1.5 truncate">
          👤 {bike.technician_name}
        </div>
      )}

      {bike.hours_in_current_status != null && bike.hours_in_current_status > 0 && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
          <FaClock className="text-xs flex-shrink-0" />
          <span>{Math.round(bike.hours_in_current_status)}h in this stage</span>
        </div>
      )}

      {/* Damage info shown in damaged view */}
      {showDamageInfo && bike.damage_notes && (
        <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-800 line-clamp-2">
          {bike.damage_notes}
        </div>
      )}

      {/* Status badges */}
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {bike.rework_count > 0 && (
          <span className="text-xs font-medium text-red-600">🔄 Rework #{bike.rework_count}</span>
        )}
        {bike.parts_missing && (
          <span className="text-xs font-medium text-orange-600">⚠️ Parts Missing</span>
        )}
        {bike.damage_reported && !showDamageInfo && (
          <span className="text-xs font-medium text-red-600">💥 Damaged</span>
        )}
        {bike.assembly_paused && showDamageInfo && (
          <span className="text-xs font-medium text-orange-600">⏸ Paused</span>
        )}
      </div>
    </div>
  );
};
