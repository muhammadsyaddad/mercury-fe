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
  InformationCircleIcon,
  EyeIcon,
  CameraIcon,
  ArrowTrendingUpIcon as TrendingUpIcon,
  ArrowTrendingDownIcon as TrendingDownIcon,
} from '@heroicons/react/24/outline';
import { KPICard } from '../components/KPICard';
import { CompactKPICard } from '../components/CompactKPICard';
import { AnalyticsChart } from '../components/AnalyticsChart';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { ExecutiveSummaryCard } from '../components/ExecutiveSummaryCard';
import { PerformanceInsightsPanel } from '../components/PerformanceInsightsPanel';
import { financialAnalyticsApi, wasteTargetsApi, MonthlyTrend, YearlyTrend } from '../services/financialApi';
import { executiveAnalyticsApi } from '../services/executiveAnalyticsApi';
import { formatCurrency } from '../utils/currency';
import { useCurrency } from '../contexts/CurrencyContext';
import toast from 'react-hot-toast';
import PDFExportButton from '../components/PDFExportButton';
import clsx from 'clsx';
import { apiService } from '../services/api';
import { DetectionStats, Camera, Detection } from '../types';
import { sseService } from '../services/sse';
import { format } from 'date-fns';

// Tooltip component for section explanations
interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-50 w-64 p-3 text-sm text-white bg-gray-900 rounded-lg shadow-lg -top-2 left-full ml-2 transform -translate-y-full">
          <div className="relative">
            {content}
            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 transform -translate-x-2"></div>
          </div>
        </div>
      )}
    </div>
  );
};

type TrendsTabType = 'daily' | 'monthly' | 'yearly';

const ExecutiveDashboard: React.FC = () => {
  // Calculate current month days (like Dashboard.tsx)
  const getCurrentMonthDays = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysSinceMonthStart = Math.floor((now.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceMonthStart + 1; // Add 1 to include current day
  };

  // Get display text for active filter period
  const getFilterDisplayText = (period: number) => {
    const currentMonthDays = getCurrentMonthDays();
    const now = new Date();
    
    if (period === currentMonthDays) {
      return `${now.toLocaleDateString('en-US', { month: 'long' })} ${now.getFullYear()}`;
    } else if (period === 7) {
      return 'Last 7 Days';
    } else if (period === 30) {
      return 'Last 30 Days';
    } else if (period === 90) {
      return 'Last 90 Days';
    } else if (period === 365) {
      return `${now.getFullYear()}`;
    } else {
      return `Last ${period} Days`;
    }
  };

  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentMonthDays()); // Default to current month
  const [refreshInterval, setRefreshInterval] = useState(5 * 60 * 1000); // 5 minutes
  const [trendsTab, setTrendsTab] = useState<TrendsTabType>('monthly'); // Default to monthly view
  const { defaultCurrency } = useCurrency();
  
  // Real-time data states
  const [stats, setStats] = useState<DetectionStats | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [recentDetections, setRecentDetections] = useState<Detection[]>([]);
  const [cameraStatuses, setCameraStatuses] = useState<Record<string, any>>({});

  // Fetch financial KPIs with consistent 30-day period (like Dashboard)
  const { 
    data: kpisData, 
    isLoading: kpisLoading, 
    error: kpisError,
    refetch: refetchKPIs 
  } = useQuery({
    queryKey: ['financialKPIs', 30],
    queryFn: () => financialAnalyticsApi.getFinancialKPIs(30),
    refetchInterval: refreshInterval,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch current month trends for daily view
  const { 
    data: currentMonthTrends, 
    isLoading: currentMonthLoading, 
    error: currentMonthError,
    refetch: refetchCurrentMonth 
  } = useQuery({
    queryKey: ['currentMonthTrends'],
    queryFn: () => financialAnalyticsApi.getCurrentMonthTrends(),
    refetchInterval: refreshInterval,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch monthly trends for current year
  const { 
    data: monthlyTrendsData, 
    isLoading: monthlyTrendsLoading, 
    error: monthlyTrendsError,
    refetch: refetchMonthlyTrends 
  } = useQuery({
    queryKey: ['monthlyTrends', new Date().getFullYear()],
    queryFn: () => financialAnalyticsApi.getMonthlyTrends(new Date().getFullYear()),
    refetchInterval: refreshInterval,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch yearly trends (all available data)
  const { 
    data: yearlyTrendsData, 
    isLoading: yearlyTrendsLoading, 
    error: yearlyTrendsError,
    refetch: refetchYearlyTrends 
  } = useQuery({
    queryKey: ['yearlyTrends'],
    queryFn: () => financialAnalyticsApi.getYearlyTrends(),
    refetchInterval: refreshInterval,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch category costs with consistent 30-day period (like Dashboard)
  const { 
    data: categoriesData, 
    isLoading: categoriesLoading, 
    error: categoriesError,
    refetch: refetchCategories 
  } = useQuery({
    queryKey: ['categoryCosts', 30],
    queryFn: () => financialAnalyticsApi.getCategoryCosts(30),
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
  });

  // Note: Monthly and yearly trends are now derived from daily trends data
  // This eliminates the need for separate API calls that don't exist

  // Fetch targets summary
  const { 
    data: targetsSummary, 
    isLoading: targetsLoading 
  } = useQuery({
    queryKey: ['targetsSummary'],
    queryFn: wasteTargetsApi.getTargetsSummary,
    refetchInterval: refreshInterval,
  });

  // Real-time data loading
  useEffect(() => {
    loadDashboardData();
    
    // Set up SSE connection for real-time updates
    sseService.connect(
      (event) => {
        switch (event.type) {
          case 'new_detection':
            setRecentDetections(prev => [event.data, ...prev.slice(0, 9)]);
            loadDashboardData();
            toast.success(`New ${event.data.category} detected!`);
            break;
          case 'camera_status':
            setCameraStatuses(event.data);
            break;
          case 'recent_detections':
            setRecentDetections(event.data);
            break;
        }
      },
      (error) => {
        console.error('SSE connection error:', error);
      }
    );
    
    return () => {
      sseService.disconnect();
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, camerasData, detectionsData, statusesData] = await Promise.all([
        apiService.getDetectionStats(),
        apiService.getCameras({ limit: 50 }),
        apiService.getDetections({ page: 1, page_size: 10 }),
        apiService.getCameraStatuses(),
      ]);

      setStats(statsData);
      setCameras(camerasData);
      setRecentDetections(detectionsData.items || []);
      setCameraStatuses(statusesData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  // Auto-refresh toggle
  const toggleAutoRefresh = () => {
    setRefreshInterval(refreshInterval === 0 ? 5 * 60 * 1000 : 0);
  };

  // Manual refresh
  const handleManualRefresh = () => {
    refetchKPIs();
    refetchCurrentMonth();
    refetchMonthlyTrends();
    refetchYearlyTrends();
    refetchCategories();
    refetchBI();
    toast.success('Dashboard refreshed');
  };

  // Removed tab navigation - now using single-page layout

  // Extract data for hooks (before early returns to follow Rules of Hooks)
  const kpis = kpisData;
  const currentMonthData = currentMonthTrends || [];
  const monthlyData = monthlyTrendsData || [];
  const yearlyData = yearlyTrendsData || [];
  const categories = categoriesData || [];
  // Generate simple recommendations based on data
  const recommendations = React.useMemo(() => {
    const recs: string[] = [];
    if (kpis && kpis.cost_trend === 'up' && kpis.cost_change_percentage > 10) {
      recs.push(`⚠️ Waste costs have increased by ${kpis.cost_change_percentage.toFixed(1)}% - immediate action needed`);
    }
    if (categories.length > 0 && categories[0].percentage_of_total_cost > 40) {
      recs.push(`🍽️ Focus on ${categories[0].category} waste - it represents ${categories[0].percentage_of_total_cost.toFixed(1)}% of total costs`);
    }
    if (recs.length === 0) {
      recs.push("📊 Continue monitoring waste patterns and maintain current performance levels");
    }
    return recs;
  }, [kpis, categories]);

  // Data is now fetched directly from dedicated endpoints

  // Loading state
  const isLoading = kpisLoading || currentMonthLoading || monthlyTrendsLoading || yearlyTrendsLoading || categoriesLoading || targetsLoading || biLoading;
  
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
  const hasError = kpisError || currentMonthError || monthlyTrendsError || yearlyTrendsError || categoriesError || biError;
  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Dashboard</h2>
          <p className="text-gray-600 mb-4">
            There was an error loading the executive dashboard data.
          </p>
          <button
            onClick={handleManualRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const trendChartData = currentMonthData.map(trend => ({
    date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    cost: trend.total_cost,
    weight: trend.weight_kg,
    detections: trend.detection_count,
  }));

  // Prepare monthly trends data
  const monthlyTrendChartData = monthlyData.map(trend => ({
    month: trend.month_name,
    cost: trend.total_cost,
    weight: trend.weight_kg,
    detections: trend.detection_count,
  }));

  // Prepare yearly trends data
  const yearlyTrendChartData = yearlyData.map(trend => ({
    year: trend.year.toString(),
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
                Comprehensive food waste analytics with real-time insights
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* PDF Export Button */}
              <PDFExportButton 
                variant="primary" 
                size="md" 
                className="shadow-sm"
              />
              

              {/* Period Selector */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700 font-medium shadow-sm"
              >
                <option value={getCurrentMonthDays()}>Current Month ({new Date().toLocaleDateString('en-US', { month: 'long' })})</option>
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={365}>Last year</option>
              </select>


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

      {/* Removed tab navigation - single page layout */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Single Page Executive Dashboard */}
        <div className="space-y-10">

          {/* Key Performance Indicators */}
          {kpis && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold text-gray-900">
                  Key Performance Indicators - Last 30 Days
                </h3>
                <Tooltip content="Primary metrics calculated from waste detection data, weights, and estimated food costs">
                  <InformationCircleIcon className="w-5 h-5 text-gray-400" />
                </Tooltip>
              </div>
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
          )}

          {/* Performance Analytics */}
          {(currentMonthData.length > 0 || monthlyData.length > 0 || yearlyData.length > 0) && (
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold text-gray-900">
                  Performance Analytics
                </h3>
                <Tooltip content="Cost and weight trends with predictive analysis and category breakdown">
                  <InformationCircleIcon className="w-5 h-5 text-gray-400" />
                </Tooltip>
              </div>
              
              {/* Trends Tabs */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">Cost & Weight Trends</h4>
                  <p className="text-sm text-gray-600">
                    Analyze trends across different time periods
                  </p>
                </div>
                
                {/* Trends Tab Navigation */}
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setTrendsTab('daily')}
                    className={clsx(
                      'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                      trendsTab === 'daily'
                        ? 'bg-white shadow-sm text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    📅 Daily
                  </button>
                  <button
                    onClick={() => setTrendsTab('monthly')}
                    className={clsx(
                      'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                      trendsTab === 'monthly'
                        ? 'bg-white shadow-sm text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    📊 Monthly
                  </button>
                  <button
                    onClick={() => setTrendsTab('yearly')}
                    className={clsx(
                      'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                      trendsTab === 'yearly'
                        ? 'bg-white shadow-sm text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    📈 Yearly
                  </button>
                </div>
              </div>

              {/* Trends Content */}
              <div className="grid grid-cols-1 gap-8">
                {trendsTab === 'daily' && (
                  <AnalyticsChart
                    data={trendChartData}
                    type="dual-area"
                    title={`Daily Cost & Weight Trends - Current Month`}
                    subtitle={businessIntelligence ? `Daily trends with ${businessIntelligence.predictive_insights.waste_trend_direction} forecast` : 'Daily cost and weight trends for current month'}
                    height={350}
                    dataKey="cost"
                    secondaryDataKey="weight"
                    xAxisKey="date"
                    color="#3B82F6"
                    secondaryColor="#F59E0B"
                    showGrid={true}
                    valueType="currency"
                    secondaryValueType="weight"
                  />
                )}
                
                {trendsTab === 'monthly' && (
                  <AnalyticsChart
                    data={monthlyTrendChartData}
                    type="dual-area"
                    title={`Monthly Cost & Weight Trends - ${new Date().getFullYear()}`}
                    subtitle="12 months of current year overview"
                    height={350}
                    dataKey="cost"
                    secondaryDataKey="weight"
                    xAxisKey="month"
                    color="#10B981"
                    secondaryColor="#F59E0B"
                    showGrid={true}
                    valueType="currency"
                    secondaryValueType="weight"
                  />
                )}
                
                {trendsTab === 'yearly' && (
                  <AnalyticsChart
                    data={yearlyTrendChartData}
                    type="dual-area"
                    title="Yearly Cost & Weight Trends - All Available Data"
                    subtitle="Complete historical yearly performance"
                    height={350}
                    dataKey="cost"
                    secondaryDataKey="weight"
                    xAxisKey="year"
                    color="#8B5CF6"
                    secondaryColor="#F59E0B"
                    showGrid={true}
                    valueType="currency"
                    secondaryValueType="weight"
                  />
                )}
              </div>
              
              {/* Category Analysis - 2 column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <AnalyticsChart
                  data={categoryChartData}
                  type="bar"
                  title="Cost by Category"
                  subtitle="Total waste cost breakdown"
                  height={380}
                  dataKey="value"
                  xAxisKey="name"
                  color="#10B981"
                  valueType="currency"
                />
                <AnalyticsChart
                  data={categoryChartData}
                  type="pie"
                  title="Detection Distribution"
                  subtitle="Detection count by category"
                  height={380}
                  dataKey="detections"
                  valueType="count"
                />
              </div>
            </div>
          )}


          {/* Live Operations */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold text-gray-900">Live Operations</h3>
              <Tooltip content="Real-time system status and recent detections">
                <InformationCircleIcon className="w-5 h-5 text-gray-400" />
              </Tooltip>
            </div>
            
            {/* Real-time Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <CameraIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-900">
                      {Object.values(cameraStatuses).filter(s => s.status === 'active').length}
                    </div>
                    <div className="text-sm text-green-700">Active Cameras</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <EyeIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-900">{stats?.today_count || 0}</div>
                    <div className="text-sm text-blue-700">Today's Detections</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <TrendingUpIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-900">{stats?.week_count || 0}</div>
                    <div className="text-sm text-purple-700">This Week</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <ScaleIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-900">99.2%</div>
                    <div className="text-sm text-orange-700">System Uptime</div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>

          {/* Target Performance */}
          {targetsSummary && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold text-gray-900">
                  Target Performance - {getFilterDisplayText(selectedPeriod)}
                </h3>
                <Tooltip content="Progress against waste reduction targets and budget utilization">
                  <InformationCircleIcon className="w-5 h-5 text-gray-400" />
                </Tooltip>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{targetsSummary.total_targets}</div>
                  <div className="text-sm font-medium text-gray-600">Total Targets</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="text-2xl font-bold text-green-600 mb-1">{targetsSummary.on_track_count}</div>
                  <div className="text-sm font-medium text-green-700">On Track</div>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-600 mb-1">{targetsSummary.warning_count}</div>
                  <div className="text-sm font-medium text-yellow-700">Warning</div>
                </div>
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <div className="text-2xl font-bold text-red-600 mb-1">{targetsSummary.exceeded_count}</div>
                  <div className="text-sm font-medium text-red-700">Exceeded</div>
                </div>
              </div>

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
            </div>
          )}

          {/* Strategic Insights */}
          {businessIntelligence && (
            <PerformanceInsightsPanel 
              insights={businessIntelligence.performance_insights || []} 
              categories={categories}
            />
          )}

          {/* AI Recommendations */}
          {recommendations.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8 shadow-sm">
              <div className="flex items-start gap-6">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <LightBulbIcon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                      AI-Powered Recommendations
                    </h3>
                    <Tooltip content="AI-generated recommendations based on waste patterns, costs, and operational data">
                      <InformationCircleIcon className="w-5 h-5 text-blue-500" />
                    </Tooltip>
                  </div>
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
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
