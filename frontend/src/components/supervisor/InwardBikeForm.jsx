import React, { useState, useEffect } from 'react';
import { FaBoxOpen, FaBarcode, FaBicycle } from 'react-icons/fa';
import { assemblyApi } from '../../services/api';
import toast from 'react-hot-toast';

export const InwardBikeForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    barcode: '',
    model_sku: '',
    frame_number: '',
    grn_reference: '',
    location_id: '',
    bin_location_id: ''
  });
  const [locations, setLocations] = useState([]);
  const [bins, setBins] = useState([]);
  const [filteredBins, setFilteredBins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentBikes, setRecentBikes] = useState([]);

  useEffect(() => {
    loadLocations();
    loadRecentBikes();
  }, []);

  // Load bins when location changes
  useEffect(() => {
    if (formData.location_id) {
      loadBinsByLocation(formData.location_id);
    } else {
      setFilteredBins([]);
    }
  }, [formData.location_id]);

  const loadLocations = async () => {
    try {
      const response = await assemblyApi.getLocations();
      if (response.data.success) {
        setLocations(response.data.data);
        if (response.data.data.length > 0) {
          setFormData(prev => ({
            ...prev,
            location_id: response.data.data[0].id
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
      toast.error('Failed to load locations');
    }
  };

  const loadBinsByLocation = async (locationId) => {
    // Don't make API call if locationId is empty or invalid
    if (!locationId || locationId === '') {
      setFilteredBins([]);
      setBins([]);
      return;
    }

    try {
      const response = await assemblyApi.getAvailableBins(locationId);
      if (response.data.success) {
        setFilteredBins(response.data.data);
        setBins(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load bins:', error);
      setFilteredBins([]);
      setBins([]);
      // Only show error if it's not a "no bins" situation
      if (error.response?.status !== 404) {
        toast.error('Failed to load bins');
      }
    }
  };

  const loadRecentBikes = async () => {
    try {
      const response = await assemblyApi.getKanban();
      // Get recent inwarded bikes
      const inwarded = response.data.data.filter(b => b.current_status === 'inwarded');
      setRecentBikes(inwarded.slice(0, 5));
    } catch (error) {
      console.error('Failed to load recent bikes:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // If location changes, reset bin selection
    if (name === 'location_id') {
      setFormData({
        ...formData,
        location_id: value,
        bin_location_id: ''
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const generateBarcode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setFormData({
      ...formData,
      barcode: `CYCLE-${timestamp}-${random}`
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.barcode || !formData.model_sku) {
      toast.error('Barcode and Model SKU are required');
      return;
    }

    setLoading(true);
    try {
      // Convert empty strings to null for UUID fields
      const submitData = {
        ...formData,
        bin_location_id: formData.bin_location_id || null
      };

      await assemblyApi.inwardBike(submitData);
      toast.success(`Cycle ${formData.barcode} inwarded successfully!`);

      // Reset form
      setFormData({
        barcode: '',
        model_sku: '',
        frame_number: '',
        grn_reference: '',
        location_id: formData.location_id,
        bin_location_id: ''
      });

      // Reload recent bikes
      loadRecentBikes();

      // Notify parent component
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to inward cycle');
      console.error('Inward bike error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-2">
          <FaBoxOpen className="text-3xl text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Inward New Cycles</h2>
        </div>
        <p className="text-sm text-gray-600">
          Register new cycles into the assembly tracking system
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Cycle Details</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Barcode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Barcode / Serial Number *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  placeholder="CYCLE-001234-567"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={generateBarcode}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                  title="Generate Barcode"
                >
                  <FaBarcode />
                </button>
              </div>
            </div>

            {/* Model SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model / SKU *
              </label>
              <input
                type="text"
                name="model_sku"
                value={formData.model_sku}
                onChange={handleChange}
                placeholder="HERO-SPRINT-24-RED"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Frame Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frame Number
              </label>
              <input
                type="text"
                name="frame_number"
                value={formData.frame_number}
                onChange={handleChange}
                placeholder="FRAME-001234"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* GRN Reference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GRN / Purchase Order Reference
              </label>
              <input
                type="text"
                name="grn_reference"
                value={formData.grn_reference}
                onChange={handleChange}
                placeholder="GRN-2024-001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <select
                name="location_id"
                value={formData.location_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Location</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Bin Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bin Location
              </label>
              <select
                name="bin_location_id"
                value={formData.bin_location_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!formData.location_id || filteredBins.length === 0}
              >
                <option value="">Select Bin (Optional)</option>
                {filteredBins.map(bin => (
                  <option key={bin.id} value={bin.id}>
                    {bin.bin_code} - {bin.bin_name || 'Available'} ({bin.current_occupancy}/{bin.capacity})
                  </option>
                ))}
              </select>
              {formData.location_id && filteredBins.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  No bins available at this location
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-colors ${loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
              {loading ? 'Adding Cycle...' : 'Inward Cycle'}
            </button>
          </form>
        </div>

        {/* Recent Bikes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Recently Inwarded Cycles
          </h3>

          {recentBikes.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FaBicycle className="text-6xl mx-auto mb-4" />
              <p>No cycles inwarded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBikes.map((bike) => (
                <div
                  key={bike.barcode}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-gray-900">{bike.model_sku}</h4>
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                      Inwarded
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      <span className="font-medium">Barcode:</span> {bike.barcode}
                    </div>
                    {bike.frame_number && (
                      <div>
                        <span className="font-medium">Frame:</span> {bike.frame_number}
                      </div>
                    )}
                    {bike.grn_reference && (
                      <div>
                        <span className="font-medium">GRN:</span> {bike.grn_reference}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
