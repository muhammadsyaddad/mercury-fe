import React from 'react';
import { LocationPerformance } from '../services/executiveAnalyticsApi';
import { formatCurrency } from '../utils/currency';
import { useCurrency } from '../contexts/CurrencyContext';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface LocationPerformanceHeatmapProps {
  locations: LocationPerformance[];
}

export const LocationPerformanceHeatmap: React.FC<LocationPerformanceHeatmapProps> = ({ locations }) => {
  const { defaultCurrency } = useCurrency();

  const getEfficiencyColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getEfficiencyTextColor = (score: number) => {
    if (score >= 80) return 'text-green-700';
    if (score >= 60) return 'text-yellow-700';
    if (score >= 40) return 'text-orange-700';
    return 'text-red-700';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />;
      case 'declining':
        return <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />;
      default:
        return <MinusIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const sortedLocations = [...locations].sort((a, b) => b.efficiency_score - a.efficiency_score);

  if (locations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Performance</h3>
        <div className="text-center py-8 text-gray-500">
          No location data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 min-h-[600px] flex flex-col">
      <div className="flex flex-col gap-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Location Performance Heatmap</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="whitespace-nowrap">Excellent (80+)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="whitespace-nowrap">Good (60-79)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="whitespace-nowrap">Fair (40-59)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="whitespace-nowrap">Poor (&lt;40)</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="space-y-3 min-h-full">
          {sortedLocations.map((location, index) => (
            <div
              key={location.camera_id}
              className="relative bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow flex items-center gap-6"
            >
              {/* Rank Badge */}
              <div className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0',
                index === 0 ? 'bg-yellow-500' : 
                index === 1 ? 'bg-gray-400' : 
                index === 2 ? 'bg-orange-600' : 'bg-gray-300'
              )}>
                {index + 1}
              </div>

              {/* Location Name & Trend */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-gray-900 text-base truncate">
                    {location.location_name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    {getTrendIcon(location.trend)}
                    <span className="text-xs text-gray-600 capitalize">{location.trend}</span>
                  </div>
                </div>
              </div>

              {/* Efficiency Score */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <div className="text-xs text-gray-600 mb-1">Efficiency</div>
                  <div className={clsx('text-lg font-bold', getEfficiencyTextColor(location.efficiency_score))}>
                    {location.efficiency_score.toFixed(0)}%
                  </div>
                </div>
                <div className="w-24">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={clsx('h-3 rounded-full transition-all duration-300', getEfficiencyColor(location.efficiency_score))}
                      style={{ width: `${Math.min(100, Math.max(0, location.efficiency_score))}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="flex items-center gap-8 flex-shrink-0">
                <div className="text-center">
                  <div className="text-xs text-gray-600 mb-1">Total Cost</div>
                  <div className="font-semibold text-gray-900 text-sm">
                    {formatCurrency(location.total_cost, defaultCurrency)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-600 mb-1">Detections</div>
                  <div className="font-semibold text-gray-900 text-sm">
                    {location.detection_count}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-600 mb-1">Avg/Detection</div>
                  <div className="font-semibold text-gray-900 text-sm">
                    {formatCurrency(location.avg_cost_per_detection, defaultCurrency)}
                  </div>
                </div>
              </div>

              {/* Performance Status */}
              <div className={clsx(
                'px-3 py-1 rounded-full text-xs font-medium flex-shrink-0',
                location.efficiency_score >= 80 ? 'bg-green-100 text-green-800' :
                location.efficiency_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                location.efficiency_score >= 40 ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              )}>
                {location.efficiency_score >= 80 ? 'Excellent' :
                 location.efficiency_score >= 60 ? 'Good' :
                 location.efficiency_score >= 40 ? 'Needs Work' :
                 'Attention Needed'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-gray-200">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-xs text-blue-600 mb-1">Best Performer</div>
          <div className="font-semibold text-blue-900 text-sm truncate">
            {sortedLocations[0]?.location_name || 'N/A'}
          </div>
          <div className="text-xs text-blue-600">
            {sortedLocations[0]?.efficiency_score.toFixed(0)}% efficiency
          </div>
        </div>
        
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-xs text-green-600 mb-1">Average Score</div>
          <div className="font-semibold text-green-900 text-sm">
            {locations.length > 0 
              ? (locations.reduce((sum, loc) => sum + loc.efficiency_score, 0) / locations.length).toFixed(0)
              : 0
            }%
          </div>
        </div>
        
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-xs text-purple-600 mb-1">Total Locations</div>
          <div className="font-semibold text-purple-900 text-sm">
            {locations.length}
          </div>
          <div className="text-xs text-purple-600">
            {locations.filter(l => l.efficiency_score >= 80).length} excellent
          </div>
        </div>
      </div>
    </div>
  );
};