import React from 'react';
import { FaClock, FaFlag, FaExclamationTriangle } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

export const QueueList = ({ queue, onSelectBike, onRefresh }) => {
  if (queue.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-12 text-center">
        <div className="text-gray-400 mb-4">
          <FaClock className="text-6xl mx-auto" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          No bikes in queue
        </h3>
        <p className="text-gray-500 mb-6">
          Your supervisor will assign bikes to you
        </p>
        <button
          onClick={onRefresh}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
    );
  }

  // Separate bikes by status and QC failure
  const assigned = queue.filter((b) => b.current_status === 'assigned');
  const qcFailed = queue.filter((b) => b.current_status === 'in_progress' && b.qc_status === 'fail');
  const inProgress = queue.filter((b) => b.current_status === 'in_progress' && b.qc_status !== 'fail');

  return (
    <div className="space-y-6">
      {/* QC Failed Section - Priority */}
      {qcFailed.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FaExclamationTriangle className="text-red-600 text-xl" />
            <h2 className="text-lg font-bold text-red-900">
              QC Failed - Rework Required ({qcFailed.length})
            </h2>
          </div>
          <div className="grid gap-4">
            {qcFailed.map((bike) => (
              <BikeCard
                key={bike.barcode}
                bike={bike}
                onSelect={onSelectBike}
                status="in_progress"
              />
            ))}
          </div>
        </div>
      )}

      {/* In Progress Section */}
      {inProgress.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            In Progress ({inProgress.length})
          </h2>
          <div className="grid gap-4">
            {inProgress.map((bike) => (
              <BikeCard
                key={bike.barcode}
                bike={bike}
                onSelect={onSelectBike}
                status="in_progress"
              />
            ))}
          </div>
        </div>
      )}

      {/* Assigned Section */}
      {assigned.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Assigned to You ({assigned.length})
          </h2>
          <div className="grid gap-4">
            {assigned.map((bike) => (
              <BikeCard
                key={bike.barcode}
                bike={bike}
                onSelect={onSelectBike}
                status="assigned"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const BikeCard = ({ bike, onSelect, status }) => {
  const progress = bike.checklist
    ? Object.values(bike.checklist).filter(Boolean).length
    : 0;

  const hasQcFailure = bike.qc_status === 'fail' && bike.qc_failure_reason;

  // Parse bin_location if it comes as JSON string from database
  let binLocation = bike.bin_location;

  // DEBUG: Log what we receive
  if (bike.barcode) {
    console.log(`[${bike.barcode}] bin_location raw:`, bike.bin_location);
    console.log(`[${bike.barcode}] bin_location type:`, typeof bike.bin_location);
  }

  if (typeof binLocation === 'string' && binLocation) {
    try {
      binLocation = JSON.parse(binLocation);
      console.log(`[${bike.barcode}] bin_location parsed:`, binLocation);
    } catch (e) {
      console.error('Failed to parse bin_location:', e);
      binLocation = null;
    }
  }

  return (
    <div
      onClick={() => onSelect(bike)}
      className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 cursor-pointer border-l-4 ${
        hasQcFailure ? 'border-red-500' : 'border-blue-500'
      }`}
    >
      {/* QC Failure Alert */}
      {hasQcFailure && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <FaExclamationTriangle className="text-red-600 text-xl mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-bold text-red-900 mb-1">
                QC Failed - Rework Required
              </h4>
              <p className="text-sm text-red-800 mb-1">
                <span className="font-medium">Reason:</span> {bike.qc_failure_reason}
              </p>
              <p className="text-xs text-red-700">
                <span className="font-medium">Rework Count:</span> {bike.rework_count || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-gray-900">{bike.model_sku}</h3>
          {bike.priority && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
              <FaFlag className="text-xs" />
              PRIORITY
            </span>
          )}
        </div>

        <div
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            status === 'in_progress'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-orange-100 text-orange-800'
          }`}
        >
          {status === 'in_progress' ? 'In Progress' : 'Assigned'}
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div>
          <span className="font-medium">Barcode:</span> {bike.barcode}
        </div>
        {binLocation && binLocation.bin_code && (
          <div>
            <span className="font-medium">Bin:</span> {binLocation.bin_code}
          </div>
        )}
        {bike.assigned_at && (
          <div>
            <span className="font-medium">Assigned:</span>{' '}
            {formatDistanceToNow(new Date(bike.assigned_at), {
              addSuffix: true
            })}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {status === 'in_progress' && (
        <div>
          <div className="flex items-center justify-between mb-1 text-xs">
            <span className="font-medium text-gray-700">Checklist Progress</span>
            <span className="font-bold text-gray-900">{progress} / 3</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(progress / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      {status === 'assigned' && (
        <button className="w-full mt-2 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
          Start Assembly
        </button>
      )}

      {status === 'in_progress' && (
        <button className="w-full mt-2 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors">
          Continue Assembly
        </button>
      )}
    </div>
  );
};
