import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaEdit, FaTrash, FaTimes, FaCheck } from 'react-icons/fa';
import { assemblyApi } from '../../services/api';
import toast from 'react-hot-toast';

export const ManageLocations = ({ onSuccess }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'warehouse',
    address: ''
  });

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const response = await assemblyApi.getLocations();
      if (response.data.success) {
        setLocations(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
      toast.error('Failed to load locations');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await assemblyApi.createLocation(formData);
      if (response.data.success) {
        toast.success('Location created successfully');
        setFormData({ name: '', code: '', type: 'warehouse', address: '' });
        loadLocations();
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create location');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (loc) => {
    setEditingId(loc.id);
    setEditData({ name: loc.name, code: loc.code, type: loc.type, address: loc.address || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async (id) => {
    try {
      const response = await assemblyApi.updateLocation(id, editData);
      if (response.data.success) {
        toast.success('Location updated');
        setEditingId(null);
        loadLocations();
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update location');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const response = await assemblyApi.deleteLocation(id);
      if (response.data.success) {
        toast.success('Location deleted');
        loadLocations();
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete location');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-2">
          <FaMapMarkerAlt className="text-2xl sm:text-3xl text-green-600" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Manage Locations</h2>
        </div>
        <p className="text-sm text-gray-600">Add, edit, and remove warehouse/store locations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Form */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Location</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Main Warehouse"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="WH002"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="warehouse">Warehouse</option>
                <option value="store">Store</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="123 Street, City"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-colors ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {loading ? 'Creating...' : 'Add Location'}
            </button>
          </form>
        </div>

        {/* Location List */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Current Locations</h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {locations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No locations found.</p>
            ) : (
              locations.map(loc => (
                <div key={loc.id} className="p-4 border border-gray-200 rounded-lg">
                  {editingId === loc.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                        placeholder="Name"
                      />
                      <input
                        type="text"
                        value={editData.code}
                        onChange={(e) => setEditData({ ...editData, code: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                        placeholder="Code"
                      />
                      <select
                        value={editData.type}
                        onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="warehouse">Warehouse</option>
                        <option value="store">Store</option>
                      </select>
                      <input
                        type="text"
                        value={editData.address}
                        onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                        placeholder="Address"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(loc.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                        >
                          <FaCheck /> Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-400 text-white rounded-lg text-sm hover:bg-gray-500"
                        >
                          <FaTimes /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900">{loc.name}</h4>
                        <p className="text-sm text-gray-600">
                          {loc.code} &middot; <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${loc.type === 'warehouse' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                            {loc.type}
                          </span>
                        </p>
                        {loc.address && <p className="text-xs text-gray-400 mt-1">{loc.address}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(loc)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(loc.id, loc.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
