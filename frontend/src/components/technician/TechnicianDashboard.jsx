import React, { useState, useEffect } from 'react';
import { assemblyApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { BikeScanner } from './BikeScanner';
import { AssemblyChecklist } from './AssemblyChecklist';
import { QueueList } from './QueueList';
import { ReportIssueModal } from './ReportIssueModal';
import toast from 'react-hot-toast';

export const TechnicianDashboard = () => {
  const { signOut } = useAuth();
  const [queue, setQueue] = useState([]);
  const [selectedBike, setSelectedBike] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('queue'); // queue | scan | checklist
  const [showReportIssue, setShowReportIssue] = useState(false);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const response = await assemblyApi.getTechnicianQueue();
      setQueue(response.data.data);
    } catch (error) {
      toast.error('Failed to load queue');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBike = async (bike) => {
    try {
      // If bike is assigned, start assembly first
      if (bike.current_status === 'assigned') {
        const startResponse = await assemblyApi.startAssembly(bike.barcode);

        if (!startResponse.data.success) {
          toast.error(startResponse.data.message || 'Failed to start assembly');
          return;
        }

        toast.success('Assembly started!');
        // Update bike status to in_progress
        setSelectedBike({ ...bike, current_status: 'in_progress' });
        setView('checklist');
        loadQueue();
      } else if (bike.current_status === 'in_progress') {
        // Continue assembly
        setSelectedBike(bike);
        setView('checklist');
      } else {
        toast.error(
          `Bike is in ${bike.current_status} status. Cannot start assembly.`
        );
      }
    } catch (error) {
      toast.error('Failed to start assembly');
      console.error(error);
    }
  };

  const handleScan = async (barcode) => {
    try {
      const response = await assemblyApi.scanBike(barcode);
      const bike = response.data.data;

      // Check if bike is assigned to this technician
      if (bike.current_status === 'assigned') {
        // Start assembly
        const startResponse = await assemblyApi.startAssembly(barcode);

        if (!startResponse.data.success) {
          toast.error(startResponse.data.message || 'Failed to start assembly');
          return;
        }

        toast.success('Assembly started!');
        setSelectedBike({ ...bike, current_status: 'in_progress' });
        setView('checklist');
        loadQueue();
      } else if (bike.current_status === 'in_progress') {
        // Continue assembly
        setSelectedBike(bike);
        setView('checklist');
      } else {
        toast.error(
          `Bike is in ${bike.current_status} status. Cannot start assembly.`
        );
      }
    } catch (error) {
      toast.error('Bike not found or not assigned to you');
      console.error(error);
    }
  };

  const handleChecklistComplete = async (barcode, checklist) => {
    try {
      await assemblyApi.completeAssembly(barcode, checklist);
      toast.success('Assembly completed! Bike is now ready for sale.');
      setSelectedBike(null);
      setView('queue');
      loadQueue();
    } catch (error) {
      toast.error('Failed to complete assembly');
      console.error(error);
    }
  };

  const handleChecklistUpdate = async (barcode, checklist) => {
    try {
      await assemblyApi.updateChecklist(barcode, checklist);
      toast.success('Progress saved');
    } catch (error) {
      console.error('Failed to update checklist:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow sticky top-0 z-10">
        <div className="mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                  Technician Workspace
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {queue.length} bikes in your queue
                </p>
              </div>
              <button
                onClick={signOut}
                className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-medium bg-red-100 text-red-700 hover:bg-red-200"
              >
                Logout
              </button>
            </div>

            {/* Mobile-friendly tab navigation */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setView('queue')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-medium whitespace-nowrap flex-shrink-0 ${view === 'queue'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                My Queue
              </button>
              <button
                onClick={() => setView('scan')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-medium whitespace-nowrap flex-shrink-0 ${view === 'scan'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Scan Bike
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {view === 'queue' && (
          <QueueList
            queue={queue}
            onSelectBike={handleSelectBike}
            onRefresh={loadQueue}
          />
        )}

        {view === 'scan' && <BikeScanner onScan={handleScan} />}

        {view === 'checklist' && selectedBike && (
          <AssemblyChecklist
            bike={selectedBike}
            onComplete={handleChecklistComplete}
            onUpdate={handleChecklistUpdate}
            onReportIssue={() => setShowReportIssue(true)}
            onBack={() => {
              setSelectedBike(null);
              setView('queue');
            }}
          />
        )}

        {/* Report Issue Modal */}
        {showReportIssue && selectedBike && (
          <ReportIssueModal
            bike={selectedBike}
            onClose={() => setShowReportIssue(false)}
            onSuccess={() => {
              loadQueue();
              setSelectedBike(null);
              setView('queue');
            }}
          />
        )}
      </div>
    </div>
  );
};
