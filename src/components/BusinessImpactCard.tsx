import React from 'react';
import { CurrencyDollarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { BusinessImpactMetrics } from '../services/executiveAnalyticsApi';
import { formatCurrency } from '../utils/currency';
import { useCurrency } from '../contexts/CurrencyContext';
import clsx from 'clsx';

interface BusinessImpactCardProps {
  metrics: BusinessImpactMetrics;
}

export const BusinessImpactCard: React.FC<BusinessImpactCardProps> = ({ metrics }) => {
  const { defaultCurrency } = useCurrency();

  const getVarianceColor = (percentage: number) => {
    if (Math.abs(percentage) < 5) return 'text-green-600';
    if (Math.abs(percentage) < 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getVarianceIcon = (percentage: number) => {
    if (Math.abs(percentage) < 5) return null;
    if (percentage > 0) return <ArrowTrendingUpIcon className="w-4 h-4" />;
    return <ArrowTrendingDownIcon className="w-4 h-4" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Business Impact Analysis</h3>
          <p className="text-sm text-gray-600 mt-1">Financial impact of food waste on your business</p>
        </div>
        <div className="p-2 bg-blue-100 rounded-lg">
          <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {/* Average Cost per Tray */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-2 font-medium">Avg Cost per Tray</div>
          <div className="text-lg font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
            {formatCurrency(metrics.average_cost_per_detection, defaultCurrency)}
          </div>
        </div>

        {/* Average Weight per Tray */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-2 font-medium">Avg Weight per Tray</div>
          <div className="text-lg font-bold text-gray-900 whitespace-nowrap">
            {metrics.average_weight_per_detection.toFixed(2)} kg
          </div>
        </div>

        {/* Budget Variance */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-2 font-medium">Budget vs Actual</div>
          <div className={clsx('text-lg font-bold flex items-center justify-center gap-1', 
            getVarianceColor(metrics.budget_variance_percentage))}>
            {getVarianceIcon(metrics.budget_variance_percentage)}
            {metrics.budget_variance_percentage > 0 ? '+' : ''}{metrics.budget_variance_percentage.toFixed(1)}%
          </div>
        </div>

        {/* YoY Change */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-2 font-medium">vs Last Year</div>
          <div className={clsx('text-lg font-bold flex items-center justify-center gap-1',
            getVarianceColor(metrics.yoy_cost_change_percentage))}>
            {getVarianceIcon(metrics.yoy_cost_change_percentage)}
            {metrics.yoy_cost_change_percentage > 0 ? '+' : ''}{metrics.yoy_cost_change_percentage.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs font-medium text-green-900">Detections This Month</span>
          </div>
          <div className="text-lg font-bold text-green-900">
            {metrics.total_detections_this_month}
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-xs font-medium text-blue-900">Monthly Projection</span>
          </div>
          <div className="text-lg font-bold text-blue-900 whitespace-nowrap overflow-hidden text-ellipsis">
            {formatCurrency(metrics.projected_monthly_waste_cost, defaultCurrency)}
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-xs font-medium text-purple-900">Annual Projection</span>
          </div>
          <div className="text-lg font-bold text-purple-900 whitespace-nowrap overflow-hidden text-ellipsis">
            {formatCurrency(metrics.projected_annual_waste_cost, defaultCurrency)}
          </div>
        </div>
      </div>

      {/* Budget Alert */}
      {Math.abs(metrics.budget_variance_percentage) > 10 && (
        <div className={clsx('mt-4 p-3 rounded-lg flex items-center gap-2',
          metrics.budget_variance_percentage > 0 ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800')}>
          <ExclamationTriangleIcon className="w-5 h-5" />
          <span className="text-sm font-medium">
            {metrics.budget_variance_percentage > 0 
              ? `Over budget by ${formatCurrency(metrics.budget_variance_amount, defaultCurrency)}` 
              : `Under budget by ${formatCurrency(Math.abs(metrics.budget_variance_amount), defaultCurrency)}`
            }
          </span>
        </div>
      )}
    </div>
  );
};