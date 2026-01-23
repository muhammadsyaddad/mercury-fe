import React from 'react';
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { PredictiveInsights } from '../services/executiveAnalyticsApi';
import { formatCurrency } from '../utils/currency';
import { useCurrency } from '../contexts/CurrencyContext';
import clsx from 'clsx';

interface PredictiveAnalyticsCardProps {
  insights: PredictiveInsights;
}

export const PredictiveAnalyticsCard: React.FC<PredictiveAnalyticsCardProps> = ({ insights }) => {
  const { defaultCurrency } = useCurrency();

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'increasing':
        return 'text-red-600';
      case 'decreasing':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing':
        return <ArrowTrendingUpIcon className="w-5 h-5" />;
      case 'decreasing':
        return <ArrowTrendingDownIcon className="w-5 h-5" />;
      default:
        return <div className="w-5 h-5 border-2 border-gray-400 rounded-full" />;
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-600 bg-red-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getRiskLevel = (score: number) => {
    if (score >= 70) return 'High Risk';
    if (score >= 40) return 'Medium Risk';
    return 'Low Risk';
  };

  const getAchievementColor = (probability: number) => {
    if (probability >= 80) return 'text-green-600';
    if (probability >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBar = (confidence: number) => {
    const width = Math.min(100, Math.max(0, confidence));
    const color = confidence >= 80 ? 'bg-green-500' : confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500';
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all duration-300`} style={{ width: `${width}%` }}></div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Predictive Analytics</h3>
        <div className="p-2 bg-purple-100 rounded-lg">
          <ChartBarIcon className="w-6 h-6 text-purple-600" />
        </div>
      </div>

      {/* Forecasting Section */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Cost Forecasting</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-700">Next Month</span>
              <div className={clsx('flex items-center gap-1', getTrendColor(insights.waste_trend_direction))}>
                {getTrendIcon(insights.waste_trend_direction)}
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(insights.next_month_predicted_cost, defaultCurrency)}
            </div>
          </div>
          
          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-indigo-700">Next Quarter</span>
              <div className={clsx('flex items-center gap-1', getTrendColor(insights.waste_trend_direction))}>
                {getTrendIcon(insights.waste_trend_direction)}
              </div>
            </div>
            <div className="text-2xl font-bold text-indigo-900">
              {formatCurrency(insights.next_quarter_predicted_cost, defaultCurrency)}
            </div>
          </div>
        </div>
      </div>

      {/* Trend Analysis */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Trend Analysis</h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={clsx('flex items-center gap-1', getTrendColor(insights.waste_trend_direction))}>
                {getTrendIcon(insights.waste_trend_direction)}
                <span className="font-medium capitalize">{insights.waste_trend_direction}</span>
              </div>
            </div>
            <span className="text-sm text-gray-600">
              {insights.trend_confidence_score.toFixed(0)}% confidence
            </span>
          </div>
          {getConfidenceBar(insights.trend_confidence_score)}
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Risk Assessment</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={clsx('rounded-lg p-4', getRiskColor(insights.anomaly_risk_score))}>
            <div className="flex items-center gap-2 mb-2">
              <ExclamationTriangleIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Anomaly Risk</span>
            </div>
            <div className="text-lg font-bold">
              {getRiskLevel(insights.anomaly_risk_score)}
            </div>
            <div className="text-sm opacity-75">
              {insights.anomaly_risk_score.toFixed(0)}% risk score
            </div>
          </div>

          <div className={clsx('rounded-lg p-4', 
            insights.target_achievement_probability >= 80 ? 'text-green-600 bg-green-50' :
            insights.target_achievement_probability >= 60 ? 'text-yellow-600 bg-yellow-50' :
            'text-red-600 bg-red-50'
          )}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircleIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Target Achievement</span>
            </div>
            <div className="text-lg font-bold">
              {insights.target_achievement_probability.toFixed(0)}%
            </div>
            <div className="text-sm opacity-75">
              Probability of success
            </div>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Key Predictions</h4>
        <ul className="space-y-1 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
            Waste trend is {insights.waste_trend_direction} with {insights.trend_confidence_score.toFixed(0)}% confidence
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
            {insights.target_achievement_probability >= 80 ? 'High' : 
             insights.target_achievement_probability >= 60 ? 'Medium' : 'Low'} probability of meeting targets
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
            Anomaly risk level: {getRiskLevel(insights.anomaly_risk_score).toLowerCase()}
          </li>
          {insights.seasonal_adjustment_factor !== 1.0 && (
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
              Seasonal adjustment factor: {insights.seasonal_adjustment_factor.toFixed(2)}x
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};