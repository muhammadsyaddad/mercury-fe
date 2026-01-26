import React from 'react';
import {
  CurrencyDollarIcon,
  ScaleIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { ArrowTrendingUpIcon as ArrowUpSolid, ArrowTrendingDownIcon as ArrowDownSolid } from '@heroicons/react/24/solid';
import clsx from 'clsx';

interface CompactKPICardProps {
  totalWasteCost: string;
  totalWasteWeight: string;
  avgCostPerKg: string;
  costPerDetection: string;
  costTrend?: 'up' | 'down' | 'stable';
  costChangePercentage?: number;
  detectionCount?: number;
}

export const CompactKPICard: React.FC<CompactKPICardProps> = ({
  totalWasteCost,
  totalWasteWeight,
  avgCostPerKg,
  costPerDetection,
  costTrend,
  costChangePercentage,
  detectionCount
}) => {
  const getTrendIcon = () => {
    if (costTrend === 'up') {
      return <ArrowUpSolid className="w-4 h-4 text-red-500" />;
    } else if (costTrend === 'down') {
      return <ArrowDownSolid className="w-4 h-4 text-green-500" />;
    }
    return null;
  };

  const getTrendColor = () => {
    if (costTrend === 'up') return 'text-red-600';
    if (costTrend === 'down') return 'text-green-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Key Performance Metrics</h3>
        {costTrend && costChangePercentage && (
          <div className="flex items-center gap-1">
            {getTrendIcon()}
            <span className={clsx('text-sm font-medium', getTrendColor())}>
              {Math.abs(costChangePercentage).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Waste Cost */}
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          <div className="p-2 bg-blue-500 rounded-lg">
            <CurrencyDollarIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-blue-600 font-medium">Total Cost</div>
            <div className="text-lg font-bold text-blue-900 truncate">{totalWasteCost}</div>
          </div>
        </div>

        {/* Total Waste Weight */}
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
          <div className="p-2 bg-green-500 rounded-lg">
            <ScaleIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-green-600 font-medium">Total Weight</div>
            <div className="text-lg font-bold text-green-900 truncate">{totalWasteWeight}</div>
            {detectionCount && (
              <div className="text-xs text-green-600">{detectionCount} detections</div>
            )}
          </div>
        </div>

        {/* Average Cost per KG */}
        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
          <div className="p-2 bg-purple-500 rounded-lg">
            <ChartBarIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-purple-600 font-medium">Avg Cost/KG</div>
            <div className="text-lg font-bold text-purple-900 truncate">{avgCostPerKg}</div>
          </div>
        </div>

        {/* Cost per Detection */}
        <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
          <div className="p-2 bg-indigo-500 rounded-lg">
            <ArrowTrendingUpIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-indigo-600 font-medium">Cost/Detection</div>
            <div className="text-lg font-bold text-indigo-900 truncate">{costPerDetection}</div>
          </div>
        </div>
      </div>
    </div>
  );
};