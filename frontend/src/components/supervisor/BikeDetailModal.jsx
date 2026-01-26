import React, { useState, useEffect } from 'react';
import { FaTimes, FaFlag, FaExclamationTriangle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { PhotoGallery } from '../shared/PhotoGallery';
import { assemblyApi } from '../../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export const BikeDetailModal = ({ bike, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);

  useEffect(() => {
    loadBikeDetails();
  }, [bike.barcode]);

  const loadBikeDetails = async () => {
    try {
      setLoading(true);
      const response = await assemblyApi.getBikeDetails(bike.barcode);
      if (response.data.success) {
        setDetails(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load bike details:', error);
      toast.error('Failed to load bike details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  const allPhotos = [];

  // Collect damage report photos
  if (details?.damage_photos && Array.isArray(details.damage_photos)) {
    details.damage_photos.forEach(photo => {
      allPhotos.push({
        src: photo,
        caption: 'Damage Report',
        timestamp: details.damage_reported_at
      });
    });
  }

  // Collect QC failure photos
  if (details?.qc_photos && Array.isArray(details.qc_photos)) {
    details.qc_photos.forEach(photo => {
      allPhotos.push({
        src: photo,
        caption: `QC Failure: ${details.qc_failure_reason || 'Unknown'}`,
        timestamp: details.qc_reviewed_at
      });
    });
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{bike.model_sku}</h2>
              <p className="text-sm text-gray-600">{bike.barcode}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaTimes className="text-xl text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <p className="text-lg font-bold text-gray-900 capitalize">
                  {bike.current_status?.replace('_', ' ')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Frame Number</label>
                <p className="text-lg text-gray-900">{details?.frame_number || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">GRN Reference</label>
                <p className="text-lg text-gray-900">{details?.grn_reference || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Rework Count</label>
                <p className="text-lg text-gray-900">{details?.rework_count || 0}</p>
              </div>
            </div>

            {/* Priority */}
            {bike.priority && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <FaFlag className="text-red-600 text-xl" />
                <div>
                  <h4 className="font-bold text-red-900">Priority Bike</h4>
                  <p className="text-sm text-red-700">This bike is marked for priority assembly</p>
                </div>
              </div>
            )}

            {/* Technician Info */}
            {details?.technician_name && (
              <div>
                <label className="text-sm font-medium text-gray-600">Assigned Technician</label>
                <p className="text-lg text-gray-900">{details.technician_name}</p>
                {details.assigned_at && (
                  <p className="text-sm text-gray-500">
                    Assigned {formatDistanceToNow(new Date(details.assigned_at), { addSuffix: true })}
                  </p>
                )}
              </div>
            )}

            {/* Assembly Checklist */}
            {details?.checklist && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Assembly Checklist</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className={`p-3 rounded-lg border-2 ${
                    details.checklist.tyres ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {details.checklist.tyres ? (
                        <FaCheckCircle className="text-green-600" />
                      ) : (
                        <FaTimesCircle className="text-gray-400" />
                      )}
                      <span className="font-medium">Tyres</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border-2 ${
                    details.checklist.brakes ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {details.checklist.brakes ? (
                        <FaCheckCircle className="text-green-600" />
                      ) : (
                        <FaTimesCircle className="text-gray-400" />
                      )}
                      <span className="font-medium">Brakes</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border-2 ${
                    details.checklist.gears ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {details.checklist.gears ? (
                        <FaCheckCircle className="text-green-600" />
                      ) : (
                        <FaTimesCircle className="text-gray-400" />
                      )}
                      <span className="font-medium">Gears</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Damage Report */}
            {details?.damage_reported && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <FaExclamationTriangle className="text-red-600 text-xl mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-bold text-red-900 mb-1">Damage Reported</h4>
                    {details.damage_notes && (
                      <p className="text-sm text-red-800 mb-2">{details.damage_notes}</p>
                    )}
                    {details.damage_reported_at && (
                      <p className="text-xs text-red-700">
                        Reported {formatDistanceToNow(new Date(details.damage_reported_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Damage Photos */}
                {details.damage_photos && details.damage_photos.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-red-900 mb-2 block">
                      Photos ({details.damage_photos.length})
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {details.damage_photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Damage ${index + 1}`}
                          className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedPhotoIndex(index)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Parts Missing */}
            {details?.parts_missing && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <FaExclamationTriangle className="text-orange-600 text-xl mt-0.5" />
                  <div>
                    <h4 className="font-bold text-orange-900 mb-1">Parts Missing</h4>
                    {details.parts_missing_notes && (
                      <p className="text-sm text-orange-800">{details.parts_missing_notes}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* QC Status */}
            {details?.qc_status && (
              <div className={`p-4 rounded-lg border-2 ${
                details.qc_status === 'pass'
                  ? 'bg-green-50 border-green-200'
                  : details.qc_status === 'fail'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-start gap-3 mb-3">
                  {details.qc_status === 'pass' ? (
                    <FaCheckCircle className="text-green-600 text-xl mt-0.5" />
                  ) : (
                    <FaTimesCircle className="text-red-600 text-xl mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className={`font-bold mb-1 ${
                      details.qc_status === 'pass' ? 'text-green-900' : 'text-red-900'
                    }`}>
                      QC {details.qc_status.toUpperCase()}
                    </h4>
                    {details.qc_failure_reason && (
                      <p className="text-sm text-red-800 mb-2">
                        <span className="font-medium">Reason:</span> {details.qc_failure_reason}
                      </p>
                    )}
                    {details.qc_reviewed_at && (
                      <p className="text-xs text-gray-700">
                        Reviewed {formatDistanceToNow(new Date(details.qc_reviewed_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>

                {/* QC Failure Photos */}
                {details.qc_status === 'fail' && details.qc_photos && details.qc_photos.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-red-900 mb-2 block">
                      QC Failure Photos ({details.qc_photos.length})
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {details.qc_photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`QC Issue ${index + 1}`}
                          className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            const damagePhotoCount = details.damage_photos?.length || 0;
                            setSelectedPhotoIndex(damagePhotoCount + index);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Timeline */}
            {details?.timeline && details.timeline.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Timeline</h3>
                <div className="space-y-3">
                  {details.timeline.map((event, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                        {index < details.timeline.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-300 my-1"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-gray-900">{event.status}</p>
                        <p className="text-sm text-gray-600">
                          {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Photo Gallery */}
      {selectedPhotoIndex !== null && allPhotos.length > 0 && (
        <PhotoGallery
          photos={allPhotos.map(p => p.src)}
          initialIndex={selectedPhotoIndex}
          onClose={() => setSelectedPhotoIndex(null)}
        />
      )}
    </>
  );
};
