import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Cog6ToothIcon,
  ArrowPathIcon,
  PlayIcon,
  PauseIcon,
  ChartBarIcon,
  EyeIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';

// Modern Components
import { ModernKPICard } from '../components/modern/ModernKPICard';
import { ModernAnalyticsCard } from '../components/modern/ModernAnalyticsCard';
import { ModernStatsCard } from '../components/modern/ModernStatsCard';
import { ModernInsightsCard } from '../components/modern/ModernInsightsCard';
import { ModernProgressCard } from '../components/modern/ModernProgressCard';

// Services
import { financialAnalyticsApi, wasteTargetsApi } from '../services/financialApi';
import { executiveAnalyticsApi } from '../services/executiveAnalyticsApi';
import { formatCurrency } from '../utils/currency';
import { useCurrency } from '../contexts/CurrencyContext';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { format } from 'date-fns';

type DashboardTab = 'overview' | 'analytics' | 'operations';

const ModernExecutiveDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval] = useState(5 * 60 * 1000); // 5 minutes
  const { defaultCurrency } = useCurrency();

  // Data Queries
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading, 
    refetch: refetchDashboard 
  } = useQuery({
    queryKey: ['executiveDashboard'],
    queryFn: financialAnalyticsApi.getExecutiveDashboard,
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 2 * 60 * 1000,
  });

  const { 
    data: businessIntelligence, 
    isLoading: biLoading,
    refetch: refetchBI 
  } = useQuery({
    queryKey: ['executiveBusinessIntelligence'],
    queryFn: executiveAnalyticsApi.getBusinessIntelligence,
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 2 * 60 * 1000,
  });

  const { 
    data: targetsSummary, 
    isLoading: targetsLoading 
  } = useQuery({
    queryKey: ['targetsSummary'],
    queryFn: wasteTargetsApi.getTargetsSummary,
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  const handleManualRefresh = () => {
    refetchDashboard();
    refetchBI();
    toast.success('Dashboard refreshed');
  };

  const isLoading = dashboardLoading || biLoading || targetsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const kpis = dashboardData?.kpis;
  const trends = dashboardData?.daily_trends || [];
  const categories = dashboardData?.category_breakdown || [];

  // Prepare chart data
  const trendChartData = trends.map(trend => ({
    date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    cost: trend.total_cost,
    weight: trend.weight_kg,
    detections: trend.detection_count,
  }));

  const categoryChartData = categories.slice(0, 6).map(cat => ({
    name: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
    value: cat.total_cost,
    weight: cat.weight_kg,
    percentage: cat.percentage_of_total_cost,
    detections: cat.detection_count || 0,
  }));

  // Prepare insights data
  const insights = businessIntelligence?.performance_insights?.slice(0, 4).map(insight => ({
    type: insight.insight_type === 'opportunity' ? 'info' as const :
          insight.insight_type === 'risk' ? 'warning' as const :
          insight.insight_type === 'alert' ? 'alert' as const :
          'success' as const,
    title: insight.title,
    description: insight.description,
    action: insight.recommended_action,
    value: insight.estimated_savings > 0 ? formatCurrency(insight.estimated_savings, defaultCurrency) : undefined
  })) || [];

  // Prepare progress data
  const progressItems = targetsSummary ? [
    {
      title: 'Cost Target',
      current: targetsSummary.total_current_cost,
      target: targetsSummary.total_cost_limit,
      format: 'currency' as const,
      status: kpis?.cost_target_status || 'on_track' as const
    },
    {
      title: 'Weight Target',
      current: targetsSummary.total_current_weight,
      target: targetsSummary.total_weight_limit,
      format: 'number' as const,
      unit: ' kg',
      status: 'on_track' as const
    }
  ] : [];

  const tabs = [
    { id: 'overview' as DashboardTab, name: 'Overview', icon: ChartBarIcon },
    { id: 'analytics' as DashboardTab, name: 'Analytics', icon: EyeIcon },
    { id: 'operations' as DashboardTab, name: 'Operations', icon: ChartPieIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100">
      {/* Modern Header */}
      <div className="bg-white border-b border-gray-200/80 shadow-sm backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Executive Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Real-time food waste analytics and insights
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Live Status */}
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">
                  Live • {format(new Date(), 'HH:mm')}
                </span>
              </div>

              {/* Auto-refresh Toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                  autoRefresh
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                )}
              >
                {autoRefresh ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                Auto-refresh
              </button>

              {/* Manual Refresh */}
              <button
                onClick={handleManualRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:border-gray-400 hover:shadow-md transition-all"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Refresh
              </button>

              {/* Settings */}
              <button className="p-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:border-gray-400 hover:shadow-md transition-all">
                <Cog6ToothIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Tab Navigation */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex items-center gap-3 px-1 py-4 text-sm font-semibold border-b-2 transition-all duration-200',
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  <IconComponent className="w-5 h-5" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ModernKPICard
                title="Total Cost"
                value={formatCurrency(kpis?.total_waste_cost || 0, defaultCurrency)}
                change={{
                  percentage: kpis?.cost_change_percentage || 0,
                  trend: kpis?.cost_trend === 'up' ? 'up' : kpis?.cost_trend === 'down' ? 'down' : 'stable'
                }}
                icon="currency"
                gradient="blue"
                subtitle="Monthly waste cost"
              />
              
              <ModernKPICard
                title="Total Weight"
                value={`${(kpis?.total_waste_weight_kg || 0).toFixed(1)} kg`}
                icon="weight"
                gradient="green"
                subtitle={kpis?.detection_count ? `${kpis.detection_count} detections` : undefined}
              />
              
              <ModernKPICard
                title="Avg Cost/KG"
                value={formatCurrency(kpis?.avg_cost_per_kg || 0, defaultCurrency)}
                icon="chart"
                gradient="purple"
                subtitle="Per kilogram"
              />
              
              <ModernKPICard
                title="Cost/Detection"
                value={formatCurrency(kpis?.cost_per_detection || 0, defaultCurrency)}
                icon="detection"
                gradient="orange"
                subtitle="Per incident"
              />
            </div>

            {/* Analytics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ModernAnalyticsCard
                title="Cost Trends"
                subtitle="Daily waste cost analysis"
                data={trendChartData}
                chartType="area"
                dataKey="cost"
                xAxisKey="date"
                color="#3B82F6"
                valueType="currency"
                trend={{
                  direction: businessIntelligence?.predictive_insights.waste_trend_direction === 'increasing' ? 'up' : 
                           businessIntelligence?.predictive_insights.waste_trend_direction === 'decreasing' ? 'down' : 'stable',
                  percentage: businessIntelligence?.business_impact.yoy_cost_change_percentage || 0
                }}
              />
              
              <ModernAnalyticsCard
                title="Category Breakdown"
                subtitle="Cost by food category"
                data={categoryChartData}
                chartType="bar"
                dataKey="value"
                xAxisKey="name"
                color="#10B981"
                valueType="currency"
              />
            </div>

            {/* Stats and Progress Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {businessIntelligence && (
                <ModernStatsCard
                  title="Business Metrics"
                  subtitle="Key performance indicators"
                  stats={[
                    {
                      label: "Budget vs Actual",
                      value: `${businessIntelligence.business_impact.budget_variance_percentage.toFixed(1)}%`,
                      change: {
                        percentage: businessIntelligence.business_impact.budget_variance_percentage,
                        trend: businessIntelligence.business_impact.budget_variance_percentage > 0 ? 'up' : 'down'
                      },
                      color: businessIntelligence.business_impact.budget_variance_percentage > 0 ? 'red' : 'green'
                    },
                    {
                      label: "YoY Change", 
                      value: `${businessIntelligence.business_impact.yoy_cost_change_percentage.toFixed(1)}%`,
                      change: {
                        percentage: businessIntelligence.business_impact.yoy_cost_change_percentage,
                        trend: businessIntelligence.business_impact.yoy_cost_change_percentage > 0 ? 'up' : 'down'
                      },
                      color: businessIntelligence.business_impact.yoy_cost_change_percentage > 0 ? 'red' : 'green'
                    }
                  ]}
                />
              )}
              
              {progressItems.length > 0 && (
                <ModernProgressCard
                  title="Target Progress"
                  subtitle="Performance against goals"
                  items={progressItems}
                />
              )}
            </div>

            {/* Insights */}
            {insights.length > 0 && (
              <ModernInsightsCard
                title="AI Insights"
                subtitle="Automated recommendations and alerts"
                insights={insights}
              />
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="text-center py-16">
              <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
              <p className="text-gray-600">Detailed analytical views coming soon</p>
            </div>
          </div>
        )}

        {activeTab === 'operations' && (
          <div className="space-y-8">
            <div className="text-center py-16">
              <ChartPieIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Live Operations</h3>
              <p className="text-gray-600">Real-time operational monitoring coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernExecutiveDashboard;