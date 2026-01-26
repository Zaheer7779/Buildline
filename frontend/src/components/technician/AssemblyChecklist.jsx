import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import toast from 'react-hot-toast';

export const AssemblyChecklist = ({ bike, onComplete, onUpdate, onReportIssue, onBack }) => {
  const [checklist, setChecklist] = useState({
    tyres: false,
    brakes: false,
    gears: false
  });

  useEffect(() => {
    if (bike.checklist) {
      setChecklist(bike.checklist);
    }
  }, [bike]);

  const handleToggle = async (item) => {
    const newChecklist = {
      ...checklist,
      [item]: !checklist[item]
    };
    setChecklist(newChecklist);

    // Auto-save progress
    try {
      await onUpdate(bike.barcode, newChecklist);
    } catch (error) {
      console.error('Failed to save progress:', error);
      toast.error('Failed to save progress. Please try again.');
      // Revert state? Maybe too jarring. Let user retry.
    }
  };

  const isComplete = checklist.tyres && checklist.brakes && checklist.gears;

  const handleComplete = () => {
    if (!isComplete) {
      toast.error('Please complete all checklist items');
      return;
    }

    if (window.confirm('Mark assembly as complete and ready for sale?')) {
      onComplete(bike.barcode, checklist);
    }
  };

  const checklistItems = [
    {
      key: 'tyres',
      label: 'Tyres',
      description: 'Check tyre pressure, alignment, and condition'
    },
    {
      key: 'brakes',
      label: 'Brakes',
      description: 'Test brake functionality and adjustment'
    },
    {
      key: 'gears',
      label: 'Gears',
      description: 'Check gear shifting and derailleur alignment'
    }
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Back to Queue
          </button>

          <div className="flex items-center gap-2 text-blue-600">
            <FaClock />
            <span className="text-sm font-medium">Assembly In Progress</span>
          </div>
        </div>

        <div className="border-t pt-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {bike.model_sku}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Barcode:</span> {bike.barcode}
            </div>
            {bike.frame_number && (
              <div>
                <span className="font-medium">Frame:</span> {bike.frame_number}
              </div>
            )}
            {bike.priority && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Priority
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Assembly Checklist
        </h2>

        <div className="space-y-4">
          {checklistItems.map((item) => (
            <div
              key={item.key}
              onClick={() => handleToggle(item.key)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${checklist[item.key]
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {checklist[item.key] ? (
                    <FaCheckCircle className="text-3xl text-green-600" />
                  ) : (
                    <FaCircle className="text-3xl text-gray-300" />
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900">
                    {item.label}
                  </h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress
            </span>
            <span className="text-sm font-bold text-gray-900">
              {Object.values(checklist).filter(Boolean).length} / 3
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(Object.values(checklist).filter(Boolean).length / 3) * 100
                  }%`
              }}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <button
          onClick={handleComplete}
          disabled={!isComplete}
          className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-colors ${isComplete
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
        >
          {isComplete ? 'Mark as Ready to Sale' : 'Complete All Items First'}
        </button>

        {/* Report Issue Button */}
        {onReportIssue && (
          <button
            onClick={onReportIssue}
            className="w-full mt-3 py-3 px-6 rounded-lg font-bold border-2 border-orange-500 text-orange-600 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
          >
            <FaExclamationTriangle />
            Report Issue (Damage/Missing Parts)
          </button>
        )}

        <div className="mt-4 text-center">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            Save Progress & Continue Later
          </button>
        </div>
      </div>
    </div>
  );
};
