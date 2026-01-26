import React, { useState } from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { PhotoUpload } from '../shared/PhotoUpload';

export const QCReviewPanel = ({ bike, onSubmit, onBack }) => {
  const [result, setResult] = useState(null); // 'pass' | 'fail'
  const [failureReason, setFailureReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [photos, setPhotos] = useState([]);

  const failureReasons = [
    'Brake adjustment required',
    'Gear shifting issues',
    'Tyre pressure incorrect',
    'Loose components',
    'Paint/cosmetic damage',
    'Missing accessories',
    'Other (specify below)'
  ];

  const handleSubmit = () => {
    if (!result) {
      toast.error('Please select Pass or Fail');
      return;
    }

    if (result === 'fail') {
      if (!failureReason) {
        toast.error('Please select a failure reason');
        return;
      }
      if (failureReason === 'Other (specify below)' && !customReason.trim()) {
        toast.error('Please specify the failure reason');
        return;
      }
      if (photos.length === 0) {
        toast.error('Please add at least one photo documenting the QC failure');
        return;
      }
    }

    const finalReason =
      result === 'fail'
        ? failureReason === 'Other (specify below)'
          ? customReason
          : failureReason
        : null;

    if (
      window.confirm(
        result === 'pass'
          ? 'Mark this bike as QC PASSED and ready for sale?'
          : 'FAIL this bike and send back for rework?'
      )
    ) {
      // Pass photos as base64 strings when failing
      const photoData = result === 'fail' ? photos.map(p => p.data) : null;
      onSubmit(bike.barcode, result, finalReason, photoData);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 font-medium mb-2"
          >
            ← Back to QC Queue
          </button>
          <h1 className="text-2xl font-bold text-gray-900">QC Review</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bike Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {bike.model_sku}
          </h2>

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Barcode:</span> {bike.barcode}
            </div>
            <div>
              <span className="font-medium">Frame:</span>{' '}
              {bike.frame_number || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Technician:</span>{' '}
              {bike.technician?.full_name || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Rework Count:</span>{' '}
              {bike.rework_count}
            </div>
          </div>

          {/* Assembly Checklist */}
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h3 className="font-bold text-green-900 mb-3">
              Assembly Checklist (Completed)
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center gap-2 text-green-800">
                <FaCheckCircle />
                <span>Tyres</span>
              </div>
              <div className="flex items-center gap-2 text-green-800">
                <FaCheckCircle />
                <span>Brakes</span>
              </div>
              <div className="flex items-center gap-2 text-green-800">
                <FaCheckCircle />
                <span>Gears</span>
              </div>
            </div>
          </div>
        </div>

        {/* QC Decision */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            QC Decision
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Pass Button */}
            <button
              onClick={() => setResult('pass')}
              className={`p-6 rounded-lg border-4 transition-all ${
                result === 'pass'
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <FaCheckCircle
                  className={`text-5xl ${
                    result === 'pass' ? 'text-green-600' : 'text-gray-400'
                  }`}
                />
                <div className="font-bold text-xl">PASS</div>
                <div className="text-sm text-gray-600 text-center">
                  Ready for sale
                </div>
              </div>
            </button>

            {/* Fail Button */}
            <button
              onClick={() => setResult('fail')}
              className={`p-6 rounded-lg border-4 transition-all ${
                result === 'fail'
                  ? 'border-red-600 bg-red-50'
                  : 'border-gray-200 hover:border-red-300'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <FaTimesCircle
                  className={`text-5xl ${
                    result === 'fail' ? 'text-red-600' : 'text-gray-400'
                  }`}
                />
                <div className="font-bold text-xl">FAIL</div>
                <div className="text-sm text-gray-600 text-center">
                  Send for rework
                </div>
              </div>
            </button>
          </div>

          {/* Failure Reason (only shown if fail selected) */}
          {result === 'fail' && (
            <div className="space-y-4 p-4 bg-red-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Failure Reason *
                </label>
                <select
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select reason...</option>
                  {failureReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              {failureReason === 'Other (specify below)' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specify Reason *
                  </label>
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Describe the issue..."
                  />
                </div>
              )}

              {/* Photo Upload for QC Failure Documentation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo Evidence *
                </label>
                <p className="text-xs text-gray-600 mb-2">
                  Add photos documenting the quality issues found during inspection
                </p>
                <PhotoUpload photos={photos} onPhotosChange={setPhotos} />
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <button
            onClick={handleSubmit}
            disabled={!result}
            className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-colors ${
              result === 'pass'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : result === 'fail'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {result === 'pass'
              ? 'Submit QC PASS ✓'
              : result === 'fail'
              ? 'Submit QC FAIL & Send for Rework'
              : 'Select Pass or Fail'}
          </button>
        </div>
      </div>
    </div>
  );
};
