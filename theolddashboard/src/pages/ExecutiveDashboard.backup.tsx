import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CurrencyDollarIcon,
  ScaleIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  CalendarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { KPICard } from '../components/KPICard';
import { CompactKPICard } from '../components/CompactKPICard';
import { AnalyticsChart } from '../components/AnalyticsChart';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { BusinessImpactCard } from '../components/BusinessImpactCard';
import { PerformanceInsightsPanel } from '../components/PerformanceInsightsPanel';
import { LocationPerformanceHeatmap } from '../components/LocationPerformanceHeatmap';
import { PredictiveAnalyticsCard } from '../components/PredictiveAnalyticsCard';
import { ExecutiveSummaryCard } from '../components/ExecutiveSummaryCard';
import { financialAnalyticsApi, wasteTargetsApi } from '../services/financialApi';
import { executiveAnalyticsApi } from '../services/executiveAnalyticsApi';
import { formatCurrency } from '../utils/currency';
import { useCurrency } from '../contexts/CurrencyContext';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const ExecutiveDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [refreshInterval, setRefreshInterval] = useState(5 * 60 * 1000); // 5 minutes
  const [viewMode, setViewMode] = useState<'enhanced' | 'classic'>('enhanced');
  const { defaultCurrency } = useCurrency();

  // Fetch executive dashboard data
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading, 
    error: dashboardError,
    refetch: refetchDashboard 
  } = useQuery({
    queryKey: ['executiveDashboard'],
    queryFn: financialAnalyticsApi.getExecutiveDashboard,
    refetchInterval: refreshInterval,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch enhanced business intelligence
  const { 
    data: businessIntelligence, 
    isLoading: biLoading, 
    error: biError,
    refetch: refetchBI 
  } = useQuery({
    queryKey: ['executiveBusinessIntelligence'],
    queryFn: executiveAnalyticsApi.getBusinessIntelligence,
    refetchInterval: refreshInterval,
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: viewMode === 'enhanced',
  });

  // Fetch targets summary
  const { 
    data: targetsSummary, 
    isLoading: targetsLoading 
  } = useQuery({
    queryKey: ['targetsSummary'],
    queryFn: wasteTargetsApi.getTargetsSummary,
    refetchInterval: refreshInterval,
  });

  // Auto-refresh toggle
  const toggleAutoRefresh = () => {
    setRefreshInterval(refreshInterval === 0 ? 5 * 60 * 1000 : 0);
  };

  // Manual refresh
  const handleManualRefresh = () => {
    refetchDashboard();
    if (viewMode === 'enhanced') {
      refetchBI();
    }
    toast.success('Dashboard refreshed');
  };

  // Toggle view mode
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'enhanced' ? 'classic' : 'enhanced');
  };

  // Loading state
  const isLoading = dashboardLoading || targetsLoading || (viewMode === 'enhanced' && biLoading);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading executive dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (dashboardError || (viewMode === 'enhanced' && biError)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Dashboard</h2>
          <p className="text-gray-600 mb-4">
            There was an error loading the executive dashboard data.
          </p>
          <div className="space-x-2">
            <button
              onClick={handleManualRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => setViewMode('classic')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Classic View
            </button>
          </div>
        </div>
      </div>
    );
  }

  const kpis = dashboardData?.kpis;
  const trends = dashboardData?.daily_trends || [];
  const categories = dashboardData?.category_breakdown || [];
  const recommendations = dashboardData?.recommendations || [];

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
  }));


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                Executive Dashboard
              </h1>
              <p className="text-gray-600 text-lg font-medium">
                Real-time food waste cost analytics and performance insights
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <button
                onClick={toggleViewMode}
                className={clsx(
                  'px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-sm',
                  viewMode === 'enhanced'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-purple-200'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400 hover:shadow-md'
                )}
              >
                <SparklesIcon className="w-4 h-4" />
                {viewMode === 'enhanced' ? 'Enhanced View' : 'Classic View'}
              </button>

              {/* Period Selector */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700 font-medium shadow-sm"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={365}>Last year</option>
              </select>

              {/* Auto-refresh toggle */}
              <button
                onClick={toggleAutoRefresh}
                className={clsx(
                  'px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm',
                  refreshInterval > 0
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-green-200'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400 hover:shadow-md'
                )}
              >
                Auto-refresh {refreshInterval > 0 ? 'ON' : 'OFF'}
              </button>

              {/* Manual refresh */}
              <button
                onClick={handleManualRefresh}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-sm shadow-blue-200"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'enhanced' && businessIntelligence ? (
          /* Enhanced Executive Dashboard */
          <div className="space-y-10">
            {/* Executive Summary */}
            <ExecutiveSummaryCard 
              summary={businessIntelligence.executive_summary}
              lastUpdated={new Date()}
            />

            {/* Business Impact and Predictive Analytics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <BusinessImpactCard metrics={businessIntelligence.business_impact} />
              <PredictiveAnalyticsCard insights={businessIntelligence.predictive_insights} />
            </div>

            {/* Performance Insights and Location Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2">
                <PerformanceInsightsPanel insights={businessIntelligence.performance_insights} />
              </div>
              <div>
                <LocationPerformanceHeatmap locations={businessIntelligence.location_performance} />
              </div>
            </div>

            {/* Classic Dashboard Data Integration */}
            {dashboardData && (
              <>
                {/* Enhanced Analytics Charts */}
                <div className="space-y-10">
                  {/* Cost and Weight Trends - Full Width */}
                  <AnalyticsChart
                    data={trendChartData}
                    type="dual-area"
                    title="Cost Trends with Weight Analysis"
                    subtitle={`Daily cost and weight trends with ${businessIntelligence.predictive_insights.waste_trend_direction} forecast`}
                    height={400}
                    dataKey="cost"
                    secondaryDataKey="weight"
                    xAxisKey="date"
                    color="#3B82F6"
                    secondaryColor="#F59E0B"
                    showGrid={true}
                    valueType="currency"
                    secondaryValueType="weight"
                  />
                  
                  {/* Category Performance Analysis - Below with Weight */}
                  <AnalyticsChart
                    data={categoryChartData}
                    type="dual-bar"
                    title="Category Performance Analysis"
                    subtitle="Cost and weight breakdown by food category"
                    height={350}
                    dataKey="value"
                    secondaryDataKey="weight"
                    xAxisKey="name"
                    color="#10B981"
                    secondaryColor="#F59E0B"
                    valueType="currency"
                    secondaryValueType="weight"
                  />
                </div>

                {/* Target Performance Integration */}
                {targetsSummary && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ProgressIndicator
                      title="Cost Target Achievement"
                      current={targetsSummary.total_current_cost}
                      target={targetsSummary.total_cost_limit}
                      format="currency"
                      status={kpis?.cost_target_status}
                    />
                    <ProgressIndicator
                      title="Weight Target Achievement"
                      current={targetsSummary.total_current_weight}
                      target={targetsSummary.total_weight_limit}
                      unit="kg"
                      format="number"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* Classic Dashboard View */
          <div className="space-y-10">
        {/* Key Performance Indicators - Compact View */}
        <div>
          <CompactKPICard
            totalWasteCost={formatCurrency(kpis?.total_waste_cost || 0, defaultCurrency)}
            totalWasteWeight={`${(kpis?.total_waste_weight_kg || 0).toFixed(1)} kg`}
            avgCostPerKg={formatCurrency(kpis?.avg_cost_per_kg || 0, defaultCurrency)}
            costPerDetection={formatCurrency(kpis?.cost_per_detection || 0, defaultCurrency)}
            costTrend={kpis?.cost_trend}
            costChangePercentage={kpis?.cost_change_percentage}
            detectionCount={kpis?.detection_count}
          />
        </div>

        {/* Target Performance Overview */}
        {targetsSummary && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">Target Performance Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl font-bold text-gray-900 mb-2">{targetsSummary.total_targets}</div>
                <div className="text-sm font-medium text-gray-600">Total Targets</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl font-bold text-green-600 mb-2">{targetsSummary.on_track_count}</div>
                <div className="text-sm font-medium text-gray-600">On Track</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl font-bold text-yellow-600 mb-2">{targetsSummary.warning_count}</div>
                <div className="text-sm font-medium text-gray-600">Warning</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl font-bold text-red-600 mb-2">{targetsSummary.exceeded_count}</div>
                <div className="text-sm font-medium text-gray-600">Exceeded</div>
              </div>
            </div>
          </div>
        )}

        {/* Main Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Cost Trends Chart */}
          <div className="lg:col-span-2">
            <AnalyticsChart
              data={trendChartData}
              type="area"
              title="Waste Cost Trends"
              subtitle={`Daily cost trends over the last ${selectedPeriod} days`}
              height={400}
              dataKey="cost"
              xAxisKey="date"
              color="#3B82F6"
              showGrid={true}
              valueType="currency"
            />
          </div>

          {/* Category Breakdown */}
          <div>
            <AnalyticsChart
              data={categoryChartData}
              type="pie"
              title="Cost by Category"
              subtitle="Breakdown of waste costs by food category"
              height={400}
              dataKey="value"
              showLegend={false}
              valueType="currency"
            />
          </div>
        </div>

        {/* Target Progress Indicators */}
        {targetsSummary && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">Budget Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ProgressIndicator
                title="Overall Cost Target"
                current={targetsSummary.total_current_cost}
                target={targetsSummary.total_cost_limit}
                format="currency"
                status={kpis?.cost_target_status}
              />
              <ProgressIndicator
                title="Overall Weight Target"
                current={targetsSummary.total_current_weight}
                target={targetsSummary.total_weight_limit}
                unit="kg"
                format="number"
              />
            </div>
          </div>
        )}

        {/* Secondary Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Category Performance Bar Chart */}
          <AnalyticsChart
            data={categoryChartData}
            type="bar"
            title="Cost by Category (Detailed)"
            subtitle="Compare waste costs across food categories"
            height={350}
            dataKey="value"
            xAxisKey="name"
            color="#10B981"
            valueType="currency"
          />

          {/* Weight Trends */}
          <AnalyticsChart
            data={trendChartData}
            type="line"
            title="Weight Trends"
            subtitle="Daily waste weight patterns"
            height={350}
            dataKey="weight"
            xAxisKey="date"
            color="#F59E0B"
            valueType="weight"
          />
        </div>

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-start gap-6">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <LightBulbIcon className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">
                  AI-Powered Recommendations
                </h3>
                <ul className="space-y-3">
                  {recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-2.5 flex-shrink-0"></div>
                      <span className="text-gray-700 text-lg leading-relaxed">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats Footer */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm font-medium text-gray-600 mb-2">Avg Detection Weight</div>
            <div className="text-2xl font-bold text-gray-900">
              {(kpis?.avg_detection_weight_kg || 0).toFixed(2)} kg
            </div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm font-medium text-gray-600 mb-2">Previous Period</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(kpis?.previous_period_cost || 0, defaultCurrency)}
            </div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm font-medium text-gray-600 mb-2">Target Budget</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(kpis?.total_cost_target || 0, defaultCurrency)}
            </div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm font-medium text-gray-600 mb-2">Budget Usage</div>
            <div className={clsx(
              'text-2xl font-bold',
              (kpis?.cost_target_percentage_used || 0) > 100 ? 'text-red-600' :
              (kpis?.cost_target_percentage_used || 0) > 80 ? 'text-yellow-600' : 'text-green-600'
            )}>
              {(kpis?.cost_target_percentage_used || 0).toFixed(1)}%
            </div>
          </div>
        </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutiveDashboard;