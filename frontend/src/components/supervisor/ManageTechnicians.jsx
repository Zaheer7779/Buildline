import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaUserCog } from 'react-icons/fa';
import { userApi } from '../../services/api';
import toast from 'react-hot-toast';

export const ManageTechnicians = ({ onSuccess }) => {
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        phone: ''
    });

    useEffect(() => {
        loadTechnicians();
    }, []);

    const loadTechnicians = async () => {
        try {
            const response = await userApi.getTechnicians();
            if (response.data.success) {
                setTechnicians(response.data.data);
            }
        } catch (error) {
            console.error('Failed to load technicians:', error);
            toast.error('Failed to load technicians');
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await userApi.createTechnician(formData);
            toast.success('Technician created successfully');
            setFormData({
                full_name: '',
                email: '',
                password: '',
                phone: ''
            });
            loadTechnicians();
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create technician');
            console.error('Create tech error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-2">
                    <FaUserCog className="text-3xl text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Manage Technicians</h2>
                </div>
                <p className="text-sm text-gray-600">
                    Add and view assembly technicians
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add Form */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Technician</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="john@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Details (Password) *</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="******"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="+1 234 567 890"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-colors ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {loading ? 'Creating...' : 'Create Technician'}
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Current Technicians</h3>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {technicians.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No technicians found.</p>
                        ) : (
                            technicians.map(tech => (
                                <div key={tech.id} className="p-4 border border-gray-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-gray-900">{tech.full_name}</h4>
                                            <p className="text-sm text-gray-600">{tech.email}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${tech.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {tech.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
