import React from 'react';
import clsx from 'clsx';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../utils/currency';

interface ProgressIndicatorProps {
  title: string;
  current: number;
  target: number;
  unit?: string;
  format?: 'number' | 'currency' | 'percentage';
  status?: 'on_track' | 'warning' | 'exceeded';
  showDetails?: boolean;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  title,
  current,
  target,
  unit = '',
  format = 'number',
  status,
  showDetails = true,
  className
}) => {
  const percentage = Math.min((current / target) * 100, 100);
  
  // Determine status if not provided
  const calculatedStatus = status || (() => {
    if (percentage >= 100) return 'exceeded';
    if (percentage >= 80) return 'warning';
    return 'on_track';
  })();

  const formatValue = (value: number) => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  };

  const statusConfig = {
    on_track: {
      color: 'bg-green-500',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      icon: CheckCircleIcon,
      label: 'On Track'
    },
    warning: {
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      icon: ExclamationTriangleIcon,
      label: 'Warning'
    },
    exceeded: {
      color: 'bg-red-500',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      icon: XCircleIcon,
      label: 'Exceeded'
    }
  };

  const config = statusConfig[calculatedStatus];
  const Icon = config.icon;

  return (
    <div className={clsx(
      'bg-white rounded-xl shadow-lg border border-gray-100 p-6',
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {title}
          </h3>
          {showDetails && (
            <div className="text-sm text-gray-600">
              {formatValue(current)} of {formatValue(target)} {unit}
            </div>
          )}
        </div>
        
        <div className={clsx(
          'flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium',
          config.bgColor,
          config.textColor
        )}>
          <Icon className="w-4 h-4" />
          {config.label}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div 
            className={clsx(
              'h-3 rounded-full transition-all duration-500 ease-out',
              config.color
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        
        {/* Percentage Label */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            {percentage.toFixed(1)}% used
          </span>
          <span className="font-medium text-gray-900">
            {Math.max(target - current, 0) > 0 ? (
              <>
                {formatValue(Math.max(target - current, 0))} {unit} remaining
              </>
            ) : (
              <>
                {formatValue(current - target)} {unit} over target
              </>
            )}
          </span>
        </div>
      </div>

      {/* Additional Details */}
      {showDetails && percentage > 100 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <XCircleIcon className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-red-800">
              Target exceeded by {formatValue(current - target)} {unit}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};