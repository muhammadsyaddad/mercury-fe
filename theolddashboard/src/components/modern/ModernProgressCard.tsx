import React from 'react';
import { TrophyIcon } from '@heroicons/react/24/outline';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/currency';
import { useCurrency } from '../../contexts/CurrencyContext';
import clsx from 'clsx';

interface ProgressItem {
  title: string;
  current: number;
  target: number;
  format: 'currency' | 'number';
  unit?: string;
  status: 'on_track' | 'warning' | 'exceeded';
}

interface ModernProgressCardProps {
  title: string;
  subtitle?: string;
  items: ProgressItem[];
  className?: string;
}

export const ModernProgressCard: React.FC<ModernProgressCardProps> = ({
  title,
  subtitle,
  items,
  className
}) => {
  const { defaultCurrency } = useCurrency();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track':
        return 'from-green-500 to-green-600';
      case 'warning':
        return 'from-yellow-500 to-yellow-600';
      case 'exceeded':
        return 'from-red-500 to-red-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'on_track':
        return 'bg-green-50';
      case 'warning':
        return 'bg-yellow-50';
      case 'exceeded':
        return 'bg-red-50';
      default:
        return 'bg-gray-50';
    }
  };

  const formatValue = (value: number, format: 'currency' | 'number', unit?: string) => {
    if (format === 'currency') {
      return formatCurrency(value, defaultCurrency);
    }
    return `${value.toFixed(1)}${unit || ''}`;
  };

  return (
    <div className={clsx(
      'bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300',
      className
    )}>
      {/* Header */}
      <div className="p-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg flex items-center justify-center">
            <ChartBarIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* Progress Items */}
      <div className="p-6 space-y-6">
        {items.map((item, index) => {
          const percentage = Math.min(100, (item.current / item.target) * 100);
          const isOverTarget = item.current > item.target;

          return (
            <div key={index} className={clsx('p-4 rounded-xl', getStatusBg(item.status))}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{item.title}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-700">
                    {formatValue(item.current, item.format, item.unit)}
                  </span>
                  <span className="text-sm text-gray-500">of</span>
                  <span className="text-sm font-bold text-gray-700">
                    {formatValue(item.target, item.format, item.unit)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="w-full bg-white/60 rounded-full h-3 overflow-hidden">
                  <div 
                    className={clsx(
                      'h-full bg-gradient-to-r transition-all duration-500 rounded-full',
                      getStatusColor(item.status)
                    )}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className={clsx(
                    'font-semibold px-2 py-1 rounded-lg',
                    item.status === 'on_track' ? 'bg-green-100 text-green-700' :
                    item.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  )}>
                    {percentage.toFixed(1)}% {isOverTarget ? 'over target' : 'complete'}
                  </span>
                  
                  <div className="flex items-center gap-1 text-gray-600">
                    <TrophyIcon className="w-3 h-3" />
                    <span className="capitalize">{item.status.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};