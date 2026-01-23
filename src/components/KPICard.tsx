import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'indigo';
  size?: 'sm' | 'md' | 'lg';
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  color = 'blue',
  size = 'md'
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600'
  };

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const textSizes = {
    sm: { value: 'text-2xl', title: 'text-sm', subtitle: 'text-xs' },
    md: { value: 'text-3xl', title: 'text-base', subtitle: 'text-sm' },
    lg: { value: 'text-4xl', title: 'text-lg', subtitle: 'text-base' }
  };

  return (
    <div className={clsx(
      'bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300',
      sizeClasses[size]
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {icon && (
              <div className={clsx(
                'p-2 rounded-lg bg-gradient-to-r text-white',
                colorClasses[color]
              )}>
                {icon}
              </div>
            )}
            <h3 className={clsx(
              'font-medium text-gray-600',
              textSizes[size].title
            )}>
              {title}
            </h3>
          </div>
          
          <div className={clsx(
            'font-bold text-gray-900 mb-1',
            textSizes[size].value
          )}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          
          {subtitle && (
            <p className={clsx(
              'text-gray-500',
              textSizes[size].subtitle
            )}>
              {subtitle}
            </p>
          )}
        </div>

        {trend && trendValue && (
          <div className={clsx(
            'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
            {
              'bg-green-100 text-green-800': trend === 'up',
              'bg-red-100 text-red-800': trend === 'down',
              'bg-gray-100 text-gray-800': trend === 'stable'
            }
          )}>
            {trend === 'up' && <ArrowUpIcon className="w-3 h-3" />}
            {trend === 'down' && <ArrowDownIcon className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
};