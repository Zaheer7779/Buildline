import React, { useState, useEffect } from 'react';
import { assemblyApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  FaBicycle,
  FaCheckCircle,
  FaClock,
  FaUsers,
  FaExclamationTriangle
} from 'react-icons/fa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import toast from 'react-hot-toast';

export const DashboardPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const { profile, signOut } = useAuth();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await assemblyApi.getDashboard();
      setDashboard(response.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading dashboard...</div>
      </div>
    );
  }

  const daily = dashboard?.daily || {};
  const bottleneck = dashboard?.bottleneck || [];
  const technicians = dashboard?.technicians || [];
  const qcFailures = dashboard?.qc_failures || [];

  // Prepare chart data
  const statusData = [
    { name: 'Inwarded', value: daily.pending_assignment || 0 },
    { name: 'Assigned', value: daily.pending_start || 0 },
    { name: 'In Progress', value: daily.currently_assembling || 0 },
    { name: 'Pending QC', value: daily.pending_qc || 0 },
    { name: 'In QC', value: daily.in_qc_review || 0 },
    { name: 'Ready', value: daily.ready_for_sale || 0 }
  ];

  const COLORS = ['#94a3b8', '#fb923c', '#3b82f6', '#a855f7', '#eab308', '#22c55e'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Assembly Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Welcome, {profile?.full_name} ({profile?.role})
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={loadDashboard}
                className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Refresh
              </button>
              <button
                onClick={signOut}
                className="px-4 py-2 rounded-lg font-medium bg-red-100 text-red-700 hover:bg-red-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<FaBicycle />}
            label="Inwarded Today"
            value={daily.inwarded_today || 0}
            color="bg-blue-500"
          />
          <StatCard
            icon={<FaCheckCircle />}
            label="Assembled Today"
            value={daily.assembled_today || 0}
            color="bg-green-500"
          />
          <StatCard
            icon={<FaCheckCircle />}
            label="QC Passed Today"
            value={daily.qc_passed_today || 0}
            color="bg-green-600"
          />
          <StatCard
            icon={<FaExclamationTriangle />}
            label="Stuck >24h"
            value={daily.stuck_over_24h || 0}
            color="bg-red-500"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Status Distribution */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Current Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bottleneck Analysis */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Bottleneck Analysis
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bottleneck}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="current_status" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bikes_in_stage" fill="#3b82f6" name="Bikes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Technician Performance */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Technician Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Technician
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Assigned
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    In Progress
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Completed Today
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    QC Pass Rate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Avg Time (hrs)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {technicians.map((tech) => (
                  <tr key={tech.technician_id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {tech.technician_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {tech.assigned_count}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {tech.in_progress_count}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {tech.completed_today}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`font-medium ${
                          tech.qc_pass_rate_percent >= 90
                            ? 'text-green-600'
                            : tech.qc_pass_rate_percent >= 70
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {tech.qc_pass_rate_percent !== null
                          ? `${tech.qc_pass_rate_percent}%`
                          : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {tech.avg_assembly_hours
                        ? tech.avg_assembly_hours.toFixed(1)
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* QC Failures */}
        {qcFailures.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Top QC Failure Reasons
            </h3>
            <div className="space-y-2">
              {qcFailures.slice(0, 5).map((failure, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {failure.qc_failure_reason}
                    </div>
                    <div className="text-sm text-gray-600">
                      Model: {failure.model_sku}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {failure.failure_count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-4">
        <div className={`${color} text-white p-4 rounded-lg text-2xl`}>
          {icon}
        </div>
        <div>
          <div className="text-3xl font-bold text-gray-900">{value}</div>
          <div className="text-sm text-gray-600">{label}</div>
        </div>
      </div>
    </div>
  );
};
