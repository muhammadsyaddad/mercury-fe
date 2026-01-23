import React from 'react';
import { 
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface Insight {
  type: 'success' | 'warning' | 'info' | 'alert';
  title: string;
  description: string;
  action?: string;
  value?: string;
}

interface ModernInsightsCardProps {
  title: string;
  subtitle?: string;
  insights: Insight[];
  className?: string;
}

const insightConfig = {
  success: {
    icon: CheckCircleIcon,
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    titleColor: 'text-green-900',
    borderColor: 'border-green-200'
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bgColor: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
    titleColor: 'text-yellow-900',
    borderColor: 'border-yellow-200'
  },
  info: {
    icon: InformationCircleIcon,
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-900',
    borderColor: 'border-blue-200'
  },
  alert: {
    icon: ExclamationTriangleIcon,
    bgColor: 'bg-red-50',
    iconColor: 'text-red-600',
    titleColor: 'text-red-900',
    borderColor: 'border-red-200'
  }
};

export const ModernInsightsCard: React.FC<ModernInsightsCardProps> = ({
  title,
  subtitle,
  insights,
  className
}) => {
  return (
    <div className={clsx(
      'bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300',
      className
    )}>
      {/* Header */}
      <div className="p-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* Insights List */}
      <div className="p-6 space-y-4">
        {insights.map((insight, index) => {
          const config = insightConfig[insight.type];
          const IconComponent = config.icon;

          return (
            <div 
              key={index}
              className={clsx(
                'p-4 rounded-xl border transition-all duration-200 hover:shadow-sm',
                config.bgColor,
                config.borderColor
              )}
            >
              <div className="flex items-start gap-4">
                <div className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                  config.bgColor === 'bg-green-50' ? 'bg-green-100' :
                  config.bgColor === 'bg-yellow-50' ? 'bg-yellow-100' :
                  config.bgColor === 'bg-blue-50' ? 'bg-blue-100' :
                  'bg-red-100'
                )}>
                  <IconComponent className={clsx('w-4 h-4', config.iconColor)} />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className={clsx('font-semibold text-sm', config.titleColor)}>
                      {insight.title}
                    </h4>
                    {insight.value && (
                      <span className={clsx(
                        'text-sm font-bold px-2 py-1 rounded-lg',
                        config.bgColor === 'bg-green-50' ? 'bg-green-100 text-green-700' :
                        config.bgColor === 'bg-yellow-50' ? 'bg-yellow-100 text-yellow-700' :
                        config.bgColor === 'bg-blue-50' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      )}>
                        {insight.value}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {insight.description}
                  </p>
                  
                  {insight.action && (
                    <div className="pt-2">
                      <button className={clsx(
                        'text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
                        config.bgColor === 'bg-green-50' ? 'bg-green-600 hover:bg-green-700 text-white' :
                        config.bgColor === 'bg-yellow-50' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                        config.bgColor === 'bg-blue-50' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                        'bg-red-600 hover:bg-red-700 text-white'
                      )}>
                        {insight.action}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};