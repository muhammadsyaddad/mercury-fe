import React from 'react';
import { 
  LightBulbIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  BellIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { PerformanceInsight } from '../services/executiveAnalyticsApi';
import { formatCurrency } from '../utils/currency';
import { useCurrency } from '../contexts/CurrencyContext';
import clsx from 'clsx';

interface CategoryData {
  category: string;
  total_cost: number;
  weight_kg: number;
  percentage_of_total_cost: number;
  detection_count: number;
}

interface PerformanceInsightsPanelProps {
  insights: PerformanceInsight[];
  categories?: CategoryData[];
}

export const PerformanceInsightsPanel: React.FC<PerformanceInsightsPanelProps> = ({ insights, categories = [] }) => {
  const { defaultCurrency } = useCurrency();

  // Generate category performance insights
  const generateCategoryInsights = (): PerformanceInsight[] => {
    const categoryInsights: PerformanceInsight[] = [];
    
    if (categories.length === 0) return categoryInsights;

    // High-cost category insight
    const topCategory = categories[0];
    if (topCategory.percentage_of_total_cost > 40) {
      categoryInsights.push({
        insight_type: 'alert',
        title: `${topCategory.category.charAt(0).toUpperCase() + topCategory.category.slice(1)} Dominates Waste Costs`,
        description: `${topCategory.category} represents ${topCategory.percentage_of_total_cost.toFixed(1)}% of total waste costs (${formatCurrency(topCategory.total_cost, defaultCurrency)})`,
        impact_level: 'high',
        recommended_action: `Implement targeted reduction strategies for ${topCategory.category} waste, focusing on portion control and inventory management`,
        estimated_savings: topCategory.total_cost * 0.25, // 25% potential reduction
        confidence_score: 85
      });
    }

    // Category efficiency comparison
    if (categories.length >= 3) {
      const avgCostPerDetection = categories.reduce((sum, cat) => sum + (cat.total_cost / Math.max(cat.detection_count, 1)), 0) / categories.length;
      const highCostCategories = categories.filter(cat => (cat.total_cost / Math.max(cat.detection_count, 1)) > avgCostPerDetection * 1.5);
      
      if (highCostCategories.length > 0) {
        categoryInsights.push({
          insight_type: 'opportunity',
          title: 'High-Value Waste Categories Identified',
          description: `${highCostCategories.map(cat => cat.category).join(', ')} show high cost per incident, averaging ${formatCurrency(avgCostPerDetection * 1.5, defaultCurrency)} per detection`,
          impact_level: 'medium',
          recommended_action: 'Focus quality control and staff training on these high-value categories to prevent costly waste incidents',
          estimated_savings: highCostCategories.reduce((sum, cat) => sum + cat.total_cost * 0.15, 0),
          confidence_score: 75
        });
      }
    }

    // Low-performing categories with many incidents
    const frequentLowCostCategories = categories.filter(cat => 
      cat.percentage_of_total_cost < 10 && cat.detection_count > 15
    );
    
    if (frequentLowCostCategories.length > 0) {
      categoryInsights.push({
        insight_type: 'opportunity',
        title: 'Frequent Small Waste Events',
        description: `${frequentLowCostCategories.map(cat => cat.category).join(', ')} categories show frequent incidents (${frequentLowCostCategories.reduce((sum, cat) => sum + cat.detection_count, 0)} detections) but low individual costs`,
        impact_level: 'low',
        recommended_action: 'Review portion sizes and serving practices to reduce frequency of small waste incidents',
        estimated_savings: frequentLowCostCategories.reduce((sum, cat) => sum + cat.total_cost * 0.1, 0),
        confidence_score: 65
      });
    }

    return categoryInsights;
  };

  // Combine original insights with category insights
  const allInsights = [...insights, ...generateCategoryInsights()];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <LightBulbIcon className="w-5 h-5" />;
      case 'risk':
        return <ExclamationTriangleIcon className="w-5 h-5" />;
      case 'achievement':
        return <CheckCircleIcon className="w-5 h-5" />;
      case 'alert':
        return <BellIcon className="w-5 h-5" />;
      default:
        return <LightBulbIcon className="w-5 h-5" />;
    }
  };

  const getInsightColor = (type: string, impactLevel: string) => {
    const baseColors = {
      opportunity: 'blue',
      risk: 'red',
      achievement: 'green',
      alert: 'yellow'
    };
    
    const color = baseColors[type as keyof typeof baseColors] || 'blue';
    const intensity = impactLevel === 'high' ? '600' : impactLevel === 'medium' ? '500' : '400';
    
    return {
      bg: `bg-${color}-50`,
      text: `text-${color}-${intensity === '600' ? '800' : '700'}`,
      icon: `text-${color}-${intensity}`,
      border: `border-${color}-200`
    };
  };

  const getPriorityBadge = (impactLevel: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    
    return colors[impactLevel as keyof typeof colors] || colors.medium;
  };

  const getConfidenceBar = (confidence: number) => {
    const width = Math.min(100, Math.max(0, confidence));
    const color = confidence >= 80 ? 'bg-green-500' : confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500';
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
        <div className={`${color} h-1.5 rounded-full transition-all duration-300`} style={{ width: `${width}%` }}></div>
      </div>
    );
  };

  if (allInsights.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategic Insights</h3>
        <div className="text-center py-8">
          <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">All systems operating within normal parameters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Strategic Insights</h3>
        <div className="text-sm text-gray-500">
          {allInsights.length} insight{allInsights.length !== 1 ? 's' : ''} detected
        </div>
      </div>

      <div className="space-y-4">
        {allInsights.map((insight, index) => {
          const colors = getInsightColor(insight.insight_type, insight.impact_level);
          
          return (
            <div
              key={index}
              className={clsx(
                'rounded-lg border p-4 transition-all hover:shadow-sm',
                colors.bg,
                colors.border
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={clsx('p-1.5 rounded-lg bg-white', colors.icon)}>
                    {getInsightIcon(insight.insight_type)}
                  </div>
                  <div>
                    <h4 className={clsx('font-semibold', colors.text)}>
                      {insight.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', 
                        getPriorityBadge(insight.impact_level))}>
                        {insight.impact_level.toUpperCase()}
                      </span>
                      {insight.estimated_savings > 0 && (
                        <span className="text-xs text-gray-600">
                          Potential: {formatCurrency(insight.estimated_savings, defaultCurrency)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <p className={clsx('text-sm mb-3', colors.text)}>
                {insight.description}
              </p>

              <div className="bg-white rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Recommended Action</span>
                </div>
                <p className="text-sm text-gray-600 ml-6">
                  {insight.recommended_action}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Confidence: {insight.confidence_score.toFixed(0)}%
                </div>
                <div className="w-16">
                  {getConfidenceBar(insight.confidence_score)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {allInsights.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <LightBulbIcon className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Total Improvement Potential</span>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {formatCurrency(
              allInsights.reduce((sum, insight) => sum + insight.estimated_savings, 0),
              defaultCurrency
            )}
          </div>
        </div>
      )}
    </div>
  );
};