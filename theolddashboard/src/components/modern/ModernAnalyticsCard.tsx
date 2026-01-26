import React from 'react';
import { ChartBarIcon, ArrowTrendingUpIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { AnalyticsChart } from '../AnalyticsChart';
import clsx from 'clsx';

interface ModernAnalyticsCardProps {
  title: string;
  subtitle?: string;
  data: any[];
  chartType: 'line' | 'bar' | 'area' | 'dual-area';
  height?: number;
  dataKey: string;
  secondaryDataKey?: string;
  xAxisKey: string;
  color: string;
  secondaryColor?: string;
  valueType: 'currency' | 'weight' | 'count';
  secondaryValueType?: 'currency' | 'weight' | 'count';
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
  showGrid?: boolean;
  className?: string;
}

export const ModernAnalyticsCard: React.FC<ModernAnalyticsCardProps> = ({
  title,
  subtitle,
  data,
  chartType,
  height = 240,
  dataKey,
  secondaryDataKey,
  xAxisKey,
  color,
  secondaryColor,
  valueType,
  secondaryValueType,
  trend,
  showGrid = true,
  className
}) => {
  return (
    <div className={clsx(
      'bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="p-6 pb-2">
        <div className="flex items-start justify-between mb-4">
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

          {trend && (
            <div className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold',
              trend.direction === 'up' 
                ? 'bg-green-50 text-green-700'
                : trend.direction === 'down'
                ? 'bg-red-50 text-red-700'
                : 'bg-gray-50 text-gray-700'
            )}>
              <ArrowTrendingUpIcon className={clsx(
                'w-4 h-4',
                trend.direction === 'down' && 'rotate-180'
              )} />
              {trend.percentage > 0 ? '+' : ''}{trend.percentage.toFixed(1)}%
            </div>
          )}
        </div>
      </div>

      {/* Chart Container */}
      <div className="px-6 pb-6">
        <div className="bg-gray-50/50 rounded-xl p-4">
          <AnalyticsChart
            data={data}
            type={chartType}
            title=""
            subtitle=""
            height={height}
            dataKey={dataKey}
            secondaryDataKey={secondaryDataKey}
            xAxisKey={xAxisKey}
            color={color}
            secondaryColor={secondaryColor}
            valueType={valueType}
            secondaryValueType={secondaryValueType}
            showGrid={showGrid}
          />
        </div>
      </div>
    </div>
  );
};