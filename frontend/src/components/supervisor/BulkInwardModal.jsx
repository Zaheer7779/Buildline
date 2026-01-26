import React, { useState, useEffect } from 'react';
import { FaTimes, FaFileUpload, FaPlus, FaTrash, FaDownload, FaCheckCircle } from 'react-icons/fa';
import { assemblyApi } from '../../services/api';
import toast from 'react-hot-toast';

export const BulkInwardModal = ({ onClose, onSuccess }) => {
  const [mode, setMode] = useState('csv'); // 'csv' | 'manual'
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [bins, setBins] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [manualEntries, setManualEntries] = useState([
    { barcode: '', model_sku: '', frame_number: '', grn_reference: '', bin_location_id: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' });
  const [showAutoSerial, setShowAutoSerial] = useState(false);
  const [autoSerialPrefix, setAutoSerialPrefix] = useState('');
  const [autoSerialStart, setAutoSerialStart] = useState(1);

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      loadBins(selectedLocation);
    } else {
      setBins([]);
    }
  }, [selectedLocation]);

  const loadLocations = async () => {
    try {
      const response = await assemblyApi.getLocations();
      if (response.data.success) {
        setLocations(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedLocation(response.data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
      toast.error('Failed to load locations');
    }
  };

  const loadBins = async (locationId) => {
    try {
      const response = await assemblyApi.getAvailableBins(locationId);
      if (response.data.success) {
        setBins(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load bins:', error);
      setBins([]);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'barcode,model_sku,frame_number,grn_reference,bin_code\n' +
      'BIKE-001,HERO-SPRINT-24-RED,FRAME001,GRN-001,A1-01\n' +
      'BIKE-002,HERO-SPRINT-24-BLUE,FRAME002,GRN-001,A1-02';

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_inward_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          toast.error('CSV file is empty');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const entry = {
            barcode: values[0] || '',
            model_sku: values[1] || '',
            frame_number: values[2] || '',
            grn_reference: values[3] || '',
            bin_code: values[4] || ''
          };

          if (entry.barcode && entry.model_sku) {
            data.push(entry);
          }
        }

        if (data.length === 0) {
          toast.error('No valid entries found in CSV');
          return;
        }

        setParsedData(data);
        toast.success(`Parsed ${data.length} cycles from CSV`);
      } catch (error) {
        console.error('Failed to parse CSV:', error);
        toast.error('Failed to parse CSV file');
      }
    };

    reader.readAsText(file);
  };

  const addManualEntry = () => {
    setManualEntries([
      ...manualEntries,
      { barcode: '', model_sku: '', frame_number: '', grn_reference: '', bin_location_id: '' }
    ]);
  };

  const removeManualEntry = (index) => {
    setManualEntries(manualEntries.filter((_, i) => i !== index));
  };

  const updateManualEntry = (index, field, value) => {
    const updated = [...manualEntries];
    updated[index][field] = value;
    setManualEntries(updated);
  };

  const generateAutoSerialNumbers = () => {
    if (!autoSerialPrefix.trim()) {
      toast.error('Please enter a serial number prefix');
      return;
    }

    const updated = manualEntries.map((entry, index) => ({
      ...entry,
      barcode: `${autoSerialPrefix}${String(autoSerialStart + index).padStart(4, '0')}`
    }));
    setManualEntries(updated);
    setShowAutoSerial(false);
    toast.success(`Generated ${updated.length} serial numbers`);
  };

  const handleSubmit = async () => {
    if (!selectedLocation) {
      toast.error('Please select a location');
      return;
    }

    let dataToSubmit = [];

    if (mode === 'csv') {
      if (parsedData.length === 0) {
        toast.error('Please upload and parse a CSV file first');
        return;
      }

      // Map bin codes to bin IDs
      dataToSubmit = parsedData.map(entry => {
        const bin = bins.find(b => b.bin_code === entry.bin_code);
        return {
          barcode: entry.barcode,
          model_sku: entry.model_sku,
          frame_number: entry.frame_number,
          grn_reference: entry.grn_reference,
          location_id: selectedLocation,
          bin_location_id: bin?.id || null
        };
      });
    } else {
      // Manual mode
      const validEntries = manualEntries.filter(e => e.barcode && e.model_sku);

      if (validEntries.length === 0) {
        toast.error('Please add at least one valid entry');
        return;
      }

      dataToSubmit = validEntries.map(entry => ({
        ...entry,
        location_id: selectedLocation,
        bin_location_id: entry.bin_location_id || null
      }));
    }

    try {
      setLoading(true);
      setProgress({ current: 0, total: dataToSubmit.length, status: 'Starting...' });

      const response = await assemblyApi.bulkInward(dataToSubmit);

      if (response.data.success) {
        const { successful, failed } = response.data.data;

        if (failed.length === 0) {
          toast.success(`Successfully inwarded ${successful.length} cycles`);
          onSuccess();
          onClose();
        } else {
          toast.success(`Inwarded ${successful.length} cycles`);
          toast.error(`Failed to inward ${failed.length} cycles`);

          // Show failed entries
          const failedBarcodes = failed.map(f => f.barcode).join(', ');
          console.error('Failed entries:', failedBarcodes);
        }
      }
    } catch (error) {
      console.error('Bulk inward error:', error);
      toast.error('Failed to process bulk inward');
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0, status: '' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Bulk Inward Cycles</h2>
            <p className="text-xs sm:text-sm text-gray-600">Import multiple cycles at once</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <FaTimes className="text-lg sm:text-xl text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Mode Selection */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6">
            <button
              onClick={() => setMode('csv')}
              className={`flex-1 p-3 sm:p-4 rounded-lg border-2 transition-all ${
                mode === 'csv'
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <FaFileUpload className="text-xl sm:text-2xl mx-auto mb-2" />
              <div className="font-bold text-sm sm:text-base">CSV Upload</div>
              <div className="text-xs sm:text-sm mt-1">Upload a CSV file with cycle data</div>
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 p-3 sm:p-4 rounded-lg border-2 transition-all ${
                mode === 'manual'
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <FaPlus className="text-xl sm:text-2xl mx-auto mb-2" />
              <div className="font-bold text-sm sm:text-base">Manual Entry</div>
              <div className="text-xs sm:text-sm mt-1">Enter cycles manually one by one</div>
            </button>
          </div>

          {/* Location Selection */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">Select location...</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.code})
                </option>
              ))}
            </select>
          </div>

          {/* CSV Mode */}
          {mode === 'csv' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Upload CSV File</h3>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  <FaDownload />
                  Download Template
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                  disabled={loading}
                />
                <label
                  htmlFor="csv-upload"
                  className="flex flex-col items-center cursor-pointer"
                >
                  <FaFileUpload className="text-4xl text-gray-400 mb-2" />
                  <p className="text-gray-600 font-medium">
                    Click to upload CSV file
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {csvFile ? csvFile.name : 'or drag and drop'}
                  </p>
                </label>
              </div>

              {parsedData.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">
                    Preview ({parsedData.length} cycles)
                  </h4>
                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left">Barcode</th>
                          <th className="px-4 py-2 text-left">Model SKU</th>
                          <th className="px-4 py-2 text-left">Frame #</th>
                          <th className="px-4 py-2 text-left">GRN Ref</th>
                          <th className="px-4 py-2 text-left">Bin Code</th>
                          <th className="px-4 py-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.map((entry, index) => {
                          const bin = bins.find(b => b.bin_code === entry.bin_code);
                          return (
                            <tr key={index} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-2 font-mono">{entry.barcode}</td>
                              <td className="px-4 py-2">{entry.model_sku}</td>
                              <td className="px-4 py-2">{entry.frame_number || '-'}</td>
                              <td className="px-4 py-2">{entry.grn_reference || '-'}</td>
                              <td className="px-4 py-2">{entry.bin_code || '-'}</td>
                              <td className="px-4 py-2 text-center">
                                {entry.bin_code && !bin ? (
                                  <span className="text-xs text-red-600">Bin not found</span>
                                ) : (
                                  <FaCheckCircle className="text-green-600 mx-auto" />
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual Mode */}
          {mode === 'manual' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Manual Entry</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAutoSerial(!showAutoSerial)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                    disabled={loading}
                  >
                    <FaCheckCircle />
                    Auto Serial
                  </button>
                  <button
                    onClick={addManualEntry}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                    disabled={loading}
                  >
                    <FaPlus />
                    Add Row
                  </button>
                </div>
              </div>

              {/* Auto Serial Number Generator */}
              {showAutoSerial && (
                <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-3 text-sm">Auto Generate Serial Numbers</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Prefix (e.g., BIKE-)
                      </label>
                      <input
                        type="text"
                        value={autoSerialPrefix}
                        onChange={(e) => setAutoSerialPrefix(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 text-sm border rounded-lg"
                        placeholder="BIKE-"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Start Number
                      </label>
                      <input
                        type="number"
                        value={autoSerialStart}
                        onChange={(e) => setAutoSerialStart(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 text-sm border rounded-lg"
                        min="1"
                        disabled={loading}
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={generateAutoSerialNumbers}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                        disabled={loading}
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Preview: {autoSerialPrefix}{String(autoSerialStart).padStart(4, '0')}, {autoSerialPrefix}{String(autoSerialStart + 1).padStart(4, '0')}, ...
                  </p>
                </div>
              )}

              {/* Mobile: Card view */}
              <div className="block sm:hidden space-y-3 max-h-[500px] overflow-y-auto">
                {manualEntries.map((entry, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-white space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-gray-700">Entry #{index + 1}</span>
                      {manualEntries.length > 1 && (
                        <button
                          onClick={() => removeManualEntry(index)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          disabled={loading}
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 font-medium">Serial Number *</label>
                      <input
                        type="text"
                        value={entry.barcode}
                        onChange={(e) => updateManualEntry(index, 'barcode', e.target.value.toUpperCase())}
                        className="w-full px-2 py-1.5 text-sm border rounded mt-1 font-mono"
                        placeholder="BIKE-0001"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 font-medium">Model SKU *</label>
                      <input
                        type="text"
                        value={entry.model_sku}
                        onChange={(e) => updateManualEntry(index, 'model_sku', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border rounded mt-1"
                        placeholder="HERO-SPRINT-24"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 font-medium">Frame # (Optional)</label>
                      <input
                        type="text"
                        value={entry.frame_number}
                        onChange={(e) => updateManualEntry(index, 'frame_number', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border rounded mt-1"
                        placeholder="Optional"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 font-medium">GRN Ref (Optional)</label>
                      <input
                        type="text"
                        value={entry.grn_reference}
                        onChange={(e) => updateManualEntry(index, 'grn_reference', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border rounded mt-1"
                        placeholder="Optional"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 font-medium">Bin Location (Optional)</label>
                      <select
                        value={entry.bin_location_id}
                        onChange={(e) => updateManualEntry(index, 'bin_location_id', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border rounded mt-1"
                        disabled={loading}
                      >
                        <option value="">Optional</option>
                        {bins.map((bin) => (
                          <option key={bin.id} value={bin.id}>
                            {bin.bin_code} - {bin.bin_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: Table view */}
              <div className="hidden sm:block max-h-[500px] overflow-x-auto overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left">#</th>
                      <th className="px-2 py-2 text-left">Serial Number *</th>
                      <th className="px-2 py-2 text-left">Model SKU *</th>
                      <th className="px-2 py-2 text-left">Frame #</th>
                      <th className="px-2 py-2 text-left">GRN Ref</th>
                      <th className="px-2 py-2 text-left">Bin Location</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {manualEntries.map((entry, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-2 py-2 text-gray-500">{index + 1}</td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={entry.barcode}
                            onChange={(e) => updateManualEntry(index, 'barcode', e.target.value.toUpperCase())}
                            className="w-full px-2 py-1 border rounded min-w-[120px] font-mono"
                            placeholder="BIKE-0001"
                            disabled={loading}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={entry.model_sku}
                            onChange={(e) => updateManualEntry(index, 'model_sku', e.target.value)}
                            className="w-full px-2 py-1 border rounded min-w-[150px]"
                            placeholder="HERO-SPRINT-24"
                            disabled={loading}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={entry.frame_number}
                            onChange={(e) => updateManualEntry(index, 'frame_number', e.target.value)}
                            className="w-full px-2 py-1 border rounded min-w-[100px]"
                            placeholder="Optional"
                            disabled={loading}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={entry.grn_reference}
                            onChange={(e) => updateManualEntry(index, 'grn_reference', e.target.value)}
                            className="w-full px-2 py-1 border rounded min-w-[100px]"
                            placeholder="Optional"
                            disabled={loading}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={entry.bin_location_id}
                            onChange={(e) => updateManualEntry(index, 'bin_location_id', e.target.value)}
                            className="w-full px-2 py-1 border rounded min-w-[120px]"
                            disabled={loading}
                          >
                            <option value="">Optional</option>
                            {bins.map((bin) => (
                              <option key={bin.id} value={bin.id}>
                                {bin.bin_code} - {bin.bin_name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          {manualEntries.length > 1 && (
                            <button
                              onClick={() => removeManualEntry(index)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              disabled={loading}
                            >
                              <FaTrash />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Progress */}
          {loading && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-blue-900">Processing...</span>
                <span className="text-sm text-blue-700">
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-blue-700 mt-2">{progress.status}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
            {mode === 'csv' && parsedData.length > 0 && (
              <span>{parsedData.length} cycles ready to inward</span>
            )}
            {mode === 'manual' && (
              <span>{manualEntries.filter(e => e.barcode && e.model_sku).length} valid entries</span>
            )}
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || (mode === 'csv' && parsedData.length === 0)}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Inward All Cycles'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
