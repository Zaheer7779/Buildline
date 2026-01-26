import { useState } from 'react';
import { FaTimes, FaExclamationTriangle, FaTools } from 'react-icons/fa';
import { PhotoUpload } from '../shared/PhotoUpload';
import { assemblyApi } from '../../services/api';
import toast from 'react-hot-toast';

export const ReportIssueModal = ({ bike, onClose, onSuccess }) => {
  const [issueType, setIssueType] = useState('damage'); // 'damage' or 'parts_missing'
  const [notes, setNotes] = useState('');
  const [partsList, setPartsList] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!notes.trim()) {
      toast.error('Please add description');
      return;
    }

    setLoading(true);

    try {
      if (issueType === 'damage') {
        // Report damage
        await assemblyApi.reportDamage(
          bike.barcode,
          notes,
          photos.map(p => p.data) // Send base64 strings
        );
        toast.success('Damage reported successfully');
      } else {
        // Report missing parts
        const parts = partsList.split(',').map(p => p.trim()).filter(Boolean);
        if (parts.length === 0) {
          toast.error('Please list missing parts');
          setLoading(false);
          return;
        }

        await assemblyApi.flagPartsMissing(bike.barcode, parts, notes);
        toast.success('Missing parts reported');
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to report issue');
      console.error('Report issue error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <FaExclamationTriangle className="text-orange-600 text-2xl" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Report Issue</h2>
              <p className="text-sm text-gray-600">{bike.model_sku} • {bike.barcode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            <FaTimes />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Issue Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setIssueType('damage')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  issueType === 'damage'
                    ? 'border-orange-500 bg-orange-50 text-orange-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <FaExclamationTriangle className="text-2xl mx-auto mb-2" />
                <div className="font-bold">Damage Reported</div>
                <div className="text-xs mt-1">Physical damage found</div>
              </button>

              <button
                type="button"
                onClick={() => setIssueType('parts_missing')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  issueType === 'parts_missing'
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <FaTools className="text-2xl mx-auto mb-2" />
                <div className="font-bold">Parts Missing</div>
                <div className="text-xs mt-1">Missing components</div>
              </button>
            </div>
          </div>

          {/* Missing Parts List (only for parts_missing) */}
          {issueType === 'parts_missing' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Missing Parts <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={partsList}
                onChange={(e) => setPartsList(e.target.value)}
                placeholder="e.g., Front Brake, Pedals, Seat"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required={issueType === 'parts_missing'}
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate parts with commas
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                issueType === 'damage'
                  ? 'Describe the damage in detail...'
                  : 'Additional notes about missing parts...'
              }
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Photos {issueType === 'damage' && <span className="text-red-500">*</span>}
            </label>
            <PhotoUpload
              photos={photos}
              onPhotosChange={setPhotos}
              maxPhotos={5}
            />
            {issueType === 'damage' && photos.length === 0 && (
              <p className="text-xs text-orange-600 mt-2">
                Please upload at least one photo of the damage
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 disabled:bg-gray-400"
              disabled={loading || (issueType === 'damage' && photos.length === 0)}
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
