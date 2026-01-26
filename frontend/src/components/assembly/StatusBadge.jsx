import React from 'react';
import { getStatusLabel, getStatusColor, getProgressPercentage } from '../../constants/assemblyConstants';

/**
 * Status Badge Component
 * Displays assembly status with proper label and color
 */
const StatusBadge = ({ status, showProgress = false, size = 'md' }) => {
  const label = getStatusLabel(status);
  const color = getStatusColor(status);
  const progress = getProgressPercentage(status);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <span
        className={`inline-flex items-center font-medium rounded-full text-white ${sizeClasses[size]}`}
        style={{ backgroundColor: color }}
      >
        {label}
      </span>
      {showProgress && (
        <div className="w-full">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{ width: `${progress}%`, backgroundColor: color }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusBadge;
