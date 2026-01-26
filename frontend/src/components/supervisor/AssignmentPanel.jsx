import React, { useState } from 'react';
import toast from 'react-hot-toast';

export const AssignmentPanel = ({ bikes, technicians, onAssign }) => {
  const [selectedBikes, setSelectedBikes] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState('');

  const handleToggleBike = (barcode) => {
    setSelectedBikes((prev) =>
      prev.includes(barcode)
        ? prev.filter((b) => b !== barcode)
        : [...prev, barcode]
    );
  };

  const handleSelectAll = () => {
    if (selectedBikes.length === bikes.length) {
      setSelectedBikes([]);
    } else {
      setSelectedBikes(bikes.map((b) => b.barcode));
    }
  };

  const handleAssign = () => {
    if (selectedBikes.length === 0) {
      toast.error('Please select at least one cycle');
      return;
    }

    if (!selectedTechnician) {
      toast.error('Please select a technician');
      return;
    }

    onAssign(selectedBikes, selectedTechnician);
    setSelectedBikes([]);
    setSelectedTechnician('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Cycles to Assign */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Cycles Pending Assignment ({bikes.length})
              </h2>
              {bikes.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {selectedBikes.length === bikes.length
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {bikes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No cycles pending assignment</p>
              </div>
            ) : (
              <div className="space-y-2">
                {bikes.map((bike) => (
                  <div
                    key={bike.barcode}
                    onClick={() => handleToggleBike(bike.barcode)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedBikes.includes(bike.barcode)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedBikes.includes(bike.barcode)}
                        onChange={() => { }}
                        className="w-5 h-5 text-blue-600 rounded"
                      />

                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-gray-900">
                            {bike.model_sku}
                          </h3>
                          {bike.priority && (
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                              PRIORITY
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {bike.barcode}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Form */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Assign to Technician
          </h3>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selected Cycles
            </label>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <span className="text-3xl font-bold text-blue-600">
                {selectedBikes.length}
              </span>
              <p className="text-sm text-gray-600 mt-1">cycles selected</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Technician
            </label>
            <select
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select technician...</option>
              {technicians.map((tech) => (
                <option key={tech.technician_id} value={tech.technician_id}>
                  {tech.technician_name} (
                  {tech.in_progress_count + tech.assigned_count} active)
                </option>
              ))}
            </select>
          </div>

          {selectedTechnician && (
            <div className="mb-6 p-3 bg-blue-50 rounded-lg text-sm">
              {(() => {
                const tech = technicians.find(
                  (t) => t.technician_id === selectedTechnician
                );
                if (!tech) return null;

                return (
                  <div className="space-y-1 text-gray-700">
                    <div>
                      <span className="font-medium">Current load:</span>{' '}
                      {tech.assigned_count} assigned, {tech.in_progress_count}{' '}
                      in progress
                    </div>
                    <div>
                      <span className="font-medium">Completed today:</span>{' '}
                      {tech.completed_today}
                    </div>
                    {tech.qc_pass_rate_percent !== null && (
                      <div>
                        <span className="font-medium">QC pass rate:</span>{' '}
                        {tech.qc_pass_rate_percent}%
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          <button
            onClick={handleAssign}
            disabled={selectedBikes.length === 0 || !selectedTechnician}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Assign {selectedBikes.length > 0 && `(${selectedBikes.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};
