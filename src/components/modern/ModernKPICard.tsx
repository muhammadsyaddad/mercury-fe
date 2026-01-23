import React from 'react';
import { 
  CurrencyDollarIcon, 
  ScaleIcon, 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface ModernKPICardProps {
  title: string;
  value: string;
  change?: {
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  };
  icon: 'currency' | 'weight' | 'chart' | 'detection';
  gradient: 'blue' | 'green' | 'purple' | 'orange' | 'pink';
  subtitle?: string;
}

const iconMap = {
  currency: CurrencyDollarIcon,
  weight: ScaleIcon,
  chart: ChartBarIcon,
  detection: ChartBarIcon,
};

const gradientMap = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  purple: 'from-purple-500 to-purple-600',
  orange: 'from-orange-500 to-orange-600',
  pink: 'from-pink-500 to-pink-600',
};

const bgMap = {
  blue: 'bg-blue-50',
  green: 'bg-green-50',
  purple: 'bg-purple-50',
  orange: 'bg-orange-50',
  pink: 'bg-pink-50',
};

export const ModernKPICard: React.FC<ModernKPICardProps> = ({
  title,
  value,
  change,
  icon,
  gradient,
  subtitle
}) => {
  const IconComponent = iconMap[icon];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 overflow-hidden">
      <div className={clsx('p-6 relative', bgMap[gradient])}>
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
        
        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className={clsx(
                'w-12 h-12 rounded-xl bg-gradient-to-br shadow-lg flex items-center justify-center',
                `bg-gradient-to-br ${gradientMap[gradient]}`
              )}>
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {value}
                </div>
                
                {change && (
                  <div className="flex items-center gap-2">
                    <div className={clsx(
                      'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold',
                      change.trend === 'up' 
                        ? 'bg-green-100 text-green-700'
                        : change.trend === 'down'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    )}>
                      {change.trend === 'up' && <ArrowTrendingUpIcon className="w-3 h-3" />}
                      {change.trend === 'down' && <ArrowTrendingDownIcon className="w-3 h-3" />}
                      {change.percentage > 0 ? '+' : ''}{change.percentage.toFixed(1)}%
                    </div>
                    <span className="text-xs text-gray-500">vs last period</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};