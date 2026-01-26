import React from 'react';
import { 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface StatItem {
  label: string;
  value: string | number;
  change?: {
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
}

interface ModernStatsCardProps {
  title: string;
  subtitle?: string;
  stats: StatItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

const colorMap = {
  blue: 'text-blue-600 bg-blue-50',
  green: 'text-green-600 bg-green-50',
  purple: 'text-purple-600 bg-purple-50',
  orange: 'text-orange-600 bg-orange-50',
  red: 'text-red-600 bg-red-50',
  gray: 'text-gray-600 bg-gray-50',
};

export const ModernStatsCard: React.FC<ModernStatsCardProps> = ({
  title,
  subtitle,
  stats,
  columns = 2,
  className
}) => {
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="w-3 h-3" />;
      case 'down':
        return <ArrowTrendingDownIcon className="w-3 h-3" />;
      default:
        return <MinusIcon className="w-3 h-3" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-100';
      case 'down':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4'
  };

  return (
    <div className={clsx(
      'bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300',
      className
    )}>
      {/* Header */}
      <div className="p-6 pb-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className={clsx('grid gap-6 p-6', gridCols[columns])}>
        {stats.map((stat, index) => (
          <div key={index} className="space-y-3">
            <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">
              {stat.label}
            </div>
            
            <div className="flex items-end justify-between">
              <div className="flex-1">
                <div className={clsx(
                  'text-2xl font-bold mb-2',
                  stat.color ? colorMap[stat.color].split(' ')[0] : 'text-gray-900'
                )}>
                  {stat.value}
                </div>
                
                {stat.change && (
                  <div className={clsx(
                    'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold',
                    getTrendColor(stat.change.trend)
                  )}>
                    {getTrendIcon(stat.change.trend)}
                    {stat.change.percentage > 0 ? '+' : ''}{stat.change.percentage.toFixed(1)}%
                  </div>
                )}
              </div>
              
              {stat.color && (
                <div className={clsx(
                  'w-3 h-16 rounded-full opacity-60',
                  colorMap[stat.color].split(' ')[1]
                )}></div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};