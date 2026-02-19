import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assemblyApi } from '../../services/api';
import { supabase } from '../../config/supabase';
import { KanbanBoard } from './KanbanBoard';
import { AssignmentPanel } from './AssignmentPanel';
import { InwardBikeForm } from './InwardBikeForm';
import { BulkInwardModal } from './BulkInwardModal';
import { ManageTechnicians } from './ManageTechnicians';
import { ManageLocations } from './ManageLocations';
import toast from 'react-hot-toast';

export const SupervisorDashboard = () => {
  const navigate = useNavigate();
  const [kanban, setKanban] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban'); // kanban | assign | inward | manage
  const [showBulkInwardModal, setShowBulkInwardModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [kanbanRes, dashRes] = await Promise.all([
        assemblyApi.getKanban({}),
        assemblyApi.getDashboard()
      ]);

      setKanban(kanbanRes.data.data);
      setTechnicians(dashRes.data.data.technicians || []);
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (barcodes, technicianId) => {
    try {
      await assemblyApi.bulkAssign(barcodes, technicianId);
      toast.success(`Assigned ${barcodes.length} bike(s)`);
      loadData();
    } catch (error) {
      toast.error('Failed to assign bikes');
      console.error(error);
    }
  };

  const handleSetPriority = async (barcode, priority) => {
    try {
      await assemblyApi.setPriority(barcode, priority);
      toast.success(priority ? 'Marked as priority' : 'Priority removed');
      loadData();
    } catch (error) {
      toast.error('Failed to update priority');
      console.error(error);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      toast.error('Error logging out');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const inwardedBikes = kanban.filter((b) => b.current_status === 'inwarded');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow sticky top-0 z-10">
        <div className="mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                  Supervisor Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {inwardedBikes.length} cycles pending assignment
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-medium bg-red-100 text-red-700 hover:bg-red-200"
              >
                Logout
              </button>
            </div>

            {/* Mobile-friendly tab navigation */}
            <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setView('kanban')}
                className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-medium whitespace-nowrap flex-shrink-0 ${view === 'kanban'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setView('assign')}
                className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-medium whitespace-nowrap flex-shrink-0 ${view === 'assign'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Assign
              </button>
              <button
                onClick={() => setView('inward')}
                className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-medium whitespace-nowrap flex-shrink-0 ${view === 'inward'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Inward
              </button>
              <button
                onClick={() => setView('manage')}
                className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-medium whitespace-nowrap flex-shrink-0 ${view === 'manage'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Manage
              </button>
              <button
                onClick={loadData}
                className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 whitespace-nowrap flex-shrink-0"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {view === 'kanban' && (
          <KanbanBoard
            bikes={kanban}
            onSetPriority={handleSetPriority}
            onRefresh={loadData}
          />
        )}

        {view === 'assign' && (
          <AssignmentPanel
            bikes={inwardedBikes}
            technicians={technicians}
            onAssign={handleAssign}
          />
        )}

        {view === 'inward' && (
          <div className="space-y-6">
            {/* Bulk Inward Button */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Inward Cycles</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Add cycles to the system - single or bulk import
                  </p>
                </div>
                <button
                  onClick={() => setShowBulkInwardModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg hover:shadow-xl"
                >
                  📦 Bulk Inward
                </button>
              </div>
            </div>

            {/* Single Inward Form */}
            <InwardBikeForm onSuccess={loadData} />
          </div>
        )}

        {view === 'manage' && (
          <div className="space-y-8">
            <ManageLocations onSuccess={loadData} />
            <ManageTechnicians onSuccess={loadData} />
          </div>
        )}
      </div>

      {/* Bulk Inward Modal */}
      {showBulkInwardModal && (
        <BulkInwardModal
          onClose={() => setShowBulkInwardModal(false)}
          onSuccess={() => {
            loadData();
            setShowBulkInwardModal(false);
          }}
        />
      )}
    </div>
  );
};
