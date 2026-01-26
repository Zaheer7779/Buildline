import React, { useState, useEffect } from 'react';
import { assemblyApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { QCReviewPanel } from './QCReviewPanel';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';

export const QCDashboard = () => {
  const { signOut } = useAuth();
  const [pendingBikes, setPendingBikes] = useState([]);
  const [selectedBike, setSelectedBike] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingBikes();
  }, []);

  const loadPendingBikes = async () => {
    try {
      setLoading(true);
      const response = await assemblyApi.getPendingQC();
      setPendingBikes(response.data.data);
    } catch (error) {
      toast.error('Failed to load pending QC bikes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQC = async (bike) => {
    try {
      await assemblyApi.startQC(bike.barcode);
      setSelectedBike(bike);
    } catch (error) {
      toast.error('Failed to start QC');
      console.error(error);
    }
  };

  const handleSubmitQC = async (barcode, result, failureReason, photos) => {
    try {
      await assemblyApi.submitQC(barcode, result, failureReason, photos);
      toast.success(
        result === 'pass'
          ? 'QC Passed - Bike ready for sale!'
          : 'QC Failed - Sent back for rework'
      );
      setSelectedBike(null);
      loadPendingBikes();
    } catch (error) {
      toast.error('Failed to submit QC result');
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

  if (selectedBike) {
    return (
      <QCReviewPanel
        bike={selectedBike}
        onSubmit={handleSubmitQC}
        onBack={() => setSelectedBike(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow sticky top-0 z-10">
        <div className="mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                QC Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {pendingBikes.length} bikes pending QC review
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={loadPendingBikes}
                className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Refresh
              </button>
              <button
                onClick={signOut}
                className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-medium bg-red-100 text-red-700 hover:bg-red-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {pendingBikes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-12 text-center">
            <div className="text-green-400 mb-4">
              <FaCheckCircle className="text-4xl sm:text-6xl mx-auto" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
              All caught up!
            </h3>
            <p className="text-sm sm:text-base text-gray-500 mb-6">
              No bikes pending QC review
            </p>
            <button
              onClick={loadPendingBikes}
              className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm sm:text-base"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {pendingBikes.map((bike) => (
              <BikeQCCard
                key={bike.id}
                bike={bike}
                onStartQC={() => handleStartQC(bike)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const BikeQCCard = ({ bike, onStartQC }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6 hover:shadow-xl transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="text-base sm:text-xl font-bold text-gray-900">
              {bike.model_sku}
            </h3>
            {bike.priority && (
              <span className="px-2 py-0.5 sm:py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                PRIORITY
              </span>
            )}
            {bike.rework_count > 0 && (
              <span className="px-2 py-0.5 sm:py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                REWORK #{bike.rework_count}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
            <div className="truncate">
              <span className="font-medium">Barcode:</span> {bike.barcode}
            </div>
            <div className="truncate">
              <span className="font-medium">Technician:</span>{' '}
              {bike.technician?.full_name || 'N/A'}
            </div>
            <div className="truncate">
              <span className="font-medium">Location:</span>{' '}
              {bike.current_location?.name || 'N/A'}
            </div>
            {bike.completed_at && (
              <div className="truncate">
                <span className="font-medium">Completed:</span>{' '}
                {new Date(bike.completed_at).toLocaleString()}
              </div>
            )}
          </div>

          {/* Checklist Status */}
          <div className="mt-3 sm:mt-4">
            <span className="font-medium text-gray-700 text-xs sm:text-sm block mb-2">Assembly Checklist:</span>
            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              {bike.checklist && (
                <>
                  <span
                    className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs ${
                      bike.checklist.tyres
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    Tyres {bike.checklist.tyres && '✓'}
                  </span>
                  <span
                    className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs ${
                      bike.checklist.brakes
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    Brakes {bike.checklist.brakes && '✓'}
                  </span>
                  <span
                    className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs ${
                      bike.checklist.gears
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    Gears {bike.checklist.gears && '✓'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          <button
            onClick={onStartQC}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-600 transition-colors text-sm sm:text-base"
          >
            Start QC Review
          </button>
        </div>
      </div>
    </div>
  );
};
