import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DetectionStats, Camera, Detection, FoodCategory, UserRole, WeightAnalytics, WeightTrend } from '../types';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { format } from 'date-fns';
import { sseService } from '../services/sse';
import DetectionDetailsModal from '../components/DetectionDetailsModal';
import { getDisplayValues } from '../utils/detectionDisplay';
import { KPICard } from '../components/KPICard';
import { AnalyticsChart } from '../components/AnalyticsChart';
import { formatCurrency } from '../utils/currency';
import { useCurrency } from '../contexts/CurrencyContext';
import { TrendingUp, Camera as CameraIcon, Scale, Activity, Target, BarChart3, BarChart2, Flag, Settings } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wasteTargetsApi, WasteTarget } from '../services/financialApi';
import clsx from 'clsx';

type TabType = 'overview' | 'operations' | 'targets' | 'analytics';

const Dashboard: React.FC = () => {
  const { user, hasAnyRole } = useAuth();
  const canViewOCRResults = hasAnyRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.REVIEWER]);
  const queryClient = useQueryClient();
  const { defaultCurrency } = useCurrency();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Existing states
  const [stats, setStats] = useState<DetectionStats | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [recentDetections, setRecentDetections] = useState<Detection[]>([]);
  const [cameraStatuses, setCameraStatuses] = useState<Record<string, any>>({});
  const [categorySummary, setCategorySummary] = useState<any>({});
  const [weightAnalytics, setWeightAnalytics] = useState<WeightAnalytics | null>(null);
  const [weightTrends, setWeightTrends] = useState<WeightTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Targets data using React Query
  const { data: targetsData } = useQuery({
    queryKey: ['wasteTargets'],
    queryFn: () => wasteTargetsApi.getWasteTargets({ limit: 10 }),
    staleTime: 2 * 60 * 1000,
  });
  
  const { data: targetsSummary } = useQuery({
    queryKey: ['targetsSummary'],
    queryFn: wasteTargetsApi.getTargetsSummary,
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    loadDashboardData();
    
    // Set up SSE connection for real-time updates
    sseService.connect(
      (event) => {
        switch (event.type) {
          case 'new_detection':
            // Add new detection to the list
            setRecentDetections(prev => [event.data, ...prev.slice(0, 9)]);
            // Refresh stats
            loadDashboardData();
            toast.success(`New ${event.data.category} detected!`);
            break;
          case 'camera_status':
            setCameraStatuses(event.data);
            break;
          case 'recent_detections':
            setRecentDetections(event.data);
            break;
          case 'system_alert':
            if (event.data.severity === 'error') {
              toast.error(event.data.message);
            } else {
              toast.success(event.data.message);
            }
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
      const [statsData, camerasData, detectionsData, statusesData, summaryData, weightAnalyticsData, weightTrendsData] = await Promise.all([
        apiService.getDetectionStats(),
        apiService.getCameras({ limit: 50 }),
        apiService.getDetections({ page: 1, page_size: 10 }),
        apiService.getCameraStatuses(),
        apiService.getCategorySummary(7),
        apiService.getWeightAnalytics({ days: 30 }).catch(() => null),
        apiService.getWeightTrends({ days: 7, interval: 'daily' }).catch(() => [])
      ]);

      setStats(statsData);
      setCameras(camerasData);
      setRecentDetections(detectionsData.items || []);
      setCameraStatuses(statusesData);
      setCategorySummary(summaryData);
      setWeightAnalytics(weightAnalyticsData);
      setWeightTrends(weightTrendsData);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: FoodCategory) => {
    const colors = {
      [FoodCategory.PROTEIN]: '#ef4444',
      [FoodCategory.CARBOHYDRATE]: '#f59e0b',
      [FoodCategory.VEGETABLES]: '#10b981',
      [FoodCategory.FRUITS]: '#8b5cf6',
      [FoodCategory.PASTRY]: '#ec4899',
      [FoodCategory.OTHERS]: '#6b7280',
      [FoodCategory.NO_WASTE]: '#9ca3af'
    };
    return colors[category] || '#6b7280';
  };

  const getCategoryIcon = (category: FoodCategory) => {
    const icons = {
      [FoodCategory.PROTEIN]: '🥩',
      [FoodCategory.CARBOHYDRATE]: '🍞',
      [FoodCategory.VEGETABLES]: '🥬',
      [FoodCategory.FRUITS]: '🍎',
      [FoodCategory.PASTRY]: '🧁',
      [FoodCategory.OTHERS]: '🍽️',
      [FoodCategory.NO_WASTE]: '✅'
    };
    return icons[category] || '🍽️';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'stopping': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const openDetectionDetails = (detection: Detection) => {
    setSelectedDetection(detection);
    setShowDetailsModal(true);
  };

  const closeDetectionDetails = () => {
    setSelectedDetection(null);
    setShowDetailsModal(false);
  };

  const formatWeight = (weight?: number) => {
    if (weight === undefined || weight === null) {
      return 'N/A';
    }
    return `${(weight / 1000).toFixed(2)}kg`;
  };

  const formatCategoryName = (category: string): string => {
    // Handle enum keys like "FoodCategory.VEGETABLES" 
    if (category.includes('FoodCategory.')) {
      category = category.split('.')[1].toLowerCase();
    }
    // Convert to proper case
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const getNormalizedCategory = (category: string): FoodCategory => {
    // Handle enum keys like "FoodCategory.VEGETABLES" 
    if (category.includes('FoodCategory.')) {
      const enumKey = category.split('.')[1];
      return FoodCategory[enumKey as keyof typeof FoodCategory];
    }
    return category as FoodCategory;
  };

  const chartData = stats ? Object.entries(stats.category_breakdown)
    .filter(([category]) => category !== 'no_waste' && !category.includes('NO_WASTE'))
    .map(([category, count]) => {
      const normalizedCategory = getNormalizedCategory(category);
      return {
        category: formatCategoryName(category),
        count,
        color: getCategoryColor(normalizedCategory)
      };
    })
    .sort((a, b) => b.count - a.count) : [];

  // Calculate financial impact estimates
  const estimatedCostPerKg = 12000; // Average food cost per kg in IDR
  const totalWasteKg = weightAnalytics ? weightAnalytics.total_net_weight / 1000 : 0;
  const estimatedMonthlyCost = totalWasteKg * estimatedCostPerKg;
  const dailyAverage = totalWasteKg / 30;
  const yesterdayTrend = weightTrends.length > 1 ? 
    ((weightTrends[weightTrends.length - 1]?.total_weight || 0) - 
     (weightTrends[weightTrends.length - 2]?.total_weight || 0)) / 1000 : 0;

  const pieData = chartData.map(item => ({
    name: item.category,
    value: item.count,
    color: item.color
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const tabs: { id: TabType; name: string; icon: React.ReactNode; description: string }[] = [
    {
      id: 'overview',
      name: 'Dashboard',
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'Complete overview with targets and analytics'
    },
    {
      id: 'operations',
      name: 'Live Feed',
      icon: <Settings className="w-5 h-5" />,
      description: 'Real-time cameras and recent detections'
    }
  ];
  
    
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'on_track':
        return { color: 'text-green-600', bg: 'bg-green-100', label: 'On Track' };
      case 'warning':
        return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Warning' };
      case 'exceeded':
        return { color: 'text-red-600', bg: 'bg-red-100', label: 'Exceeded' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Unknown' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Executive Summary Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Waste Management Dashboard
              </h1>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-600">Live Data</span>
                </div>
                <span className="text-gray-500">{format(new Date(), 'MMM dd, yyyy HH:mm')}</span>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 min-w-64">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">💸</div>
                <div>
                  <p className="text-gray-600 font-medium text-sm">Monthly Cost</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(estimatedMonthlyCost, defaultCurrency)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {yesterdayTrend >= 0 ? '↑' : '↓'} {Math.abs(yesterdayTrend).toFixed(1)}kg vs yesterday
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200',
                  activeTab === tab.id
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                )}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Money Lost This Month */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-2xl">💸</div>
                    <div className="text-gray-500 text-xs font-medium">30 DAYS</div>
                  </div>
                  <div className="text-xl font-bold mb-1 text-gray-900">
                    {formatCurrency(estimatedMonthlyCost, defaultCurrency)}
                  </div>
                  <div className="text-gray-600 text-sm">Waste Cost</div>
                  <div className="mt-2 text-xs text-gray-500">
                    Daily: {formatCurrency(estimatedMonthlyCost / 30, defaultCurrency)}
                  </div>
                </div>

                {/* Waste Volume */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-2xl">⚖️</div>
                    <div className="text-gray-500 text-xs font-medium">VOLUME</div>
                  </div>
                  <div className="text-xl font-bold mb-1 text-gray-900">
                    {totalWasteKg.toFixed(1)}kg
                  </div>
                  <div className="text-gray-600 text-sm">Total Waste</div>
                  <div className="mt-2 text-xs text-gray-500">
                    Avg: {dailyAverage.toFixed(1)}kg/day
                  </div>
                </div>

                {/* Today's Incidents */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-2xl">📊</div>
                    <div className="text-gray-500 text-xs font-medium">TODAY</div>
                  </div>
                  <div className="text-xl font-bold mb-1 text-gray-900">
                    {stats?.today_count || 0}
                  </div>
                  <div className="text-gray-600 text-sm">Detections</div>
                  <div className="mt-2 text-xs text-gray-500">
                    {targetsSummary?.exceeded_count || 0} targets exceeded
                  </div>
                </div>

                {/* Target Performance */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-2xl">🎯</div>
                    <div className="text-gray-500 text-xs font-medium">TARGETS</div>
                  </div>
                  <div className="text-xl font-bold mb-1 text-gray-900">
                    {targetsSummary?.on_track_count || 0}/{targetsSummary?.total_targets || 0}
                  </div>
                  <div className="text-gray-600 text-sm">On Track</div>
                  <div className="mt-2 text-xs text-gray-500">
                    {Math.round(((targetsSummary?.on_track_count || 0) / (targetsSummary?.total_targets || 1)) * 100)}% success
                  </div>
                </div>
              </div>
              
              {/* Executive Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Biggest Waste Category */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-red-500">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">🔥 BIGGEST WASTE</h3>
                    <span className="text-2xl">{chartData[0] ? getCategoryIcon(getNormalizedCategory(chartData[0].category.toLowerCase())) : '📊'}</span>
                  </div>
                  <div className="text-3xl font-bold text-red-600 mb-1">
                    {chartData[0]?.category || 'No Data'}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {chartData[0]?.count || 0} incidents this month
                  </div>
                  <div className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full inline-block">
                    Costs ~{formatCurrency((chartData[0]?.count || 0) * 2.5, defaultCurrency)}/month
                  </div>
                </div>

                {/* Quick Status */}
                {targetsSummary && (
                  <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-blue-500">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-900">📊 STATUS</h3>
                      <div className={`w-4 h-4 rounded-full ${
                        targetsSummary.exceeded_count > 0 ? 'bg-red-500 animate-pulse' :
                        targetsSummary.warning_count > 0 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">✅ On Track</span>
                        <span className="font-bold text-green-600">{targetsSummary.on_track_count}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">⚠️ Warning</span>
                        <span className="font-bold text-yellow-600">{targetsSummary.warning_count}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">🚨 Exceeded</span>
                        <span className="font-bold text-red-600">{targetsSummary.exceeded_count}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Required */}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 shadow-lg border-l-4 border-purple-500">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">⚡ ACTIONS</h3>
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-gray-700">Review {chartData[0]?.category || 'top'} waste</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-gray-700">Check {Object.values(cameraStatuses).filter(s => s.status !== 'active').length} cameras</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-gray-700">Update {targetsSummary?.exceeded_count || 0} targets</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Executive Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">🏆 WORST PERFORMERS</h3>
                      <p className="text-sm text-gray-600">Sorted by waste volume</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(chartData.reduce((sum, item) => sum + (item.count * 2.5), 0), defaultCurrency)}
                      </div>
                      <div className="text-xs text-gray-500">Est. monthly cost</div>
                    </div>
                  </div>
                  <AnalyticsChart
                    title=""
                    subtitle=""
                    type="bar"
                    data={chartData}
                    dataKey="count"
                    xAxisKey="category"
                    color="#ef4444"
                    height={280}
                  />
                </div>
                
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">📈 TREND ALERT</h3>
                      <p className="text-sm text-gray-600">Daily waste patterns</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        yesterdayTrend > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {yesterdayTrend >= 0 ? '↗️' : '↘️'} {Math.abs(yesterdayTrend).toFixed(1)}kg
                      </div>
                      <div className="text-xs text-gray-500">vs yesterday</div>
                    </div>
                  </div>
                  <AnalyticsChart
                    title=""
                    subtitle=""
                    type="line"
                    data={weightTrends.map(trend => ({
                      date: format(new Date(trend.date), 'dd'),
                      weight: trend.total_weight / 1000,
                    }))}
                    dataKey="weight"
                    xAxisKey="date"
                    color={yesterdayTrend > 0 ? "#ef4444" : "#10b981"}
                    height={280}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'targets' && (
            <div className="space-y-6">
              {/* Priority Targets */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">🎯 CRITICAL TARGETS</h3>
                    <p className="text-sm text-gray-600">Sorted by urgency - focus here first</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">{targetsSummary?.exceeded_count || 0}</div>
                    <div className="text-xs text-gray-500">Need action now</div>
                  </div>
                </div>
                
                {targetsData?.items && targetsData.items.length > 0 ? (
                  <div className="space-y-4">
                    {targetsData.items
                      .sort((a: WasteTarget, b: WasteTarget) => {
                        const statusPriority = { 'exceeded': 3, 'warning': 2, 'on_track': 1 };
                        return (statusPriority[b.status as keyof typeof statusPriority] || 0) - 
                               (statusPriority[a.status as keyof typeof statusPriority] || 0);
                      })
                      .slice(0, 6)
                      .map((target: WasteTarget) => {
                      const statusConfig = getStatusConfig(target.status);
                      const isUrgent = target.status === 'exceeded';
                      const isWarning = target.status === 'warning';
                      
                      return (
                        <div key={target.id} className={`
                          rounded-2xl p-5 border-2 transition-all duration-300
                          ${isUrgent ? 'bg-red-50 border-red-200 shadow-lg' : 
                            isWarning ? 'bg-yellow-50 border-yellow-200' : 
                            'bg-green-50 border-green-200'}
                        `}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className={`text-2xl ${
                                isUrgent ? '🚨' : isWarning ? '⚠️' : '✅'
                              }`}></div>
                              <div>
                                <h4 className="font-bold text-gray-900 text-lg">{target.name}</h4>
                                <p className="text-sm text-gray-600">{target.category || 'All Categories'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={clsx(
                                'px-4 py-2 rounded-full text-sm font-bold',
                                statusConfig.bg,
                                statusConfig.color
                              )}>
                                {statusConfig.label}
                              </span>
                            </div>
                          </div>
                          
                          {/* Combined Weight & Cost Display */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {target.weight_limit_kg && (
                              <div className="bg-white rounded-xl p-4 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <Scale className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-700">Weight</span>
                                  </div>
                                  <span className="text-lg font-bold text-gray-900">
                                    {target.current_weight.toFixed(1)} / {target.weight_limit_kg.toFixed(1)} kg
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                                  <div
                                    className={clsx(
                                      'h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2',
                                      target.weight_percentage_used >= 100 ? 'bg-red-500' :
                                      target.weight_percentage_used >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                                    )}
                                    style={{ width: `${Math.min(target.weight_percentage_used, 100)}%` }}
                                  >
                                    <span className="text-xs font-bold text-white">
                                      {target.weight_percentage_used.toFixed(0)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {target.cost_limit && (
                              <div className="bg-white rounded-xl p-4 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-lg">💰</span>
                                    <span className="text-sm font-medium text-gray-700">Cost</span>
                                  </div>
                                  <span className="text-lg font-bold text-gray-900">
                                    {formatCurrency(target.current_cost, defaultCurrency)} / {formatCurrency(target.cost_limit, defaultCurrency)}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                                  <div
                                    className={clsx(
                                      'h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2',
                                      target.cost_percentage_used >= 100 ? 'bg-red-500' :
                                      target.cost_percentage_used >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                                    )}
                                    style={{ width: `${Math.min(target.cost_percentage_used, 100)}%` }}
                                  >
                                    <span className="text-xs font-bold text-white">
                                      {target.cost_percentage_used.toFixed(0)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎯</div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">No Active Targets</h4>
                    <p className="text-gray-600">Set up waste reduction targets to track your progress</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && weightAnalytics && (
            <div className="space-y-8">
              {/* Analytics Header */}
              <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-white/30 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Detailed Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{formatWeight(weightAnalytics.total_net_weight)}</div>
                    <div className="text-gray-600">Total Waste (30d)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{formatWeight(weightAnalytics.average_net_weight)}</div>
                    <div className="text-gray-600">Average per Detection</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{stats?.total_detections || 0}</div>
                    <div className="text-gray-600">Total Detections</div>
                  </div>
                </div>
              </div>
              
              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <AnalyticsChart
                  title="Weight by Category"
                  subtitle="30 days total weight (kg)"
                  type="bar"
                  data={Object.entries(weightAnalytics.weight_by_category).map(([category, data]) => ({
                    category: formatCategoryName(category),
                    weight: data.total_weight / 1000,
                    count: data.count,
                    average: data.average_weight / 1000
                  }))}
                  dataKey="weight"
                  xAxisKey="category"
                  color="#ef4444"
                  height={350}
                />
                
                <AnalyticsChart
                  title="Category Distribution"
                  subtitle="Proportional breakdown"
                  type="pie"
                  data={pieData}
                  dataKey="value"
                  height={350}
                />
                
                <AnalyticsChart
                  title="Detection by Category"
                  subtitle="Last 30 days breakdown"
                  type="bar"
                  data={chartData}
                  dataKey="count"
                  xAxisKey="category"
                  color="#3b82f6"
                  height={350}
                />
                
                <AnalyticsChart
                  title="Daily Weight Trends"
                  subtitle="7 days overview"
                  type="line"
                  data={weightTrends.map(trend => ({
                    date: format(new Date(trend.date), 'MMM dd'),
                    weight: trend.total_weight / 1000,
                    average: trend.average_weight / 1000
                  }))}
                  dataKey="weight"
                  xAxisKey="date"
                  color="#ef4444"
                  height={350}
                />
              </div>
            </div>
          )}

          {activeTab === 'operations' && (
            <div className="space-y-8">
              {/* Operations Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Cameras</span>
                      <span className="font-semibold text-green-600">
                        {Object.values(cameraStatuses).filter(s => s.status === 'active').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Cameras</span>
                      <span className="font-semibold">{cameras.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Today's Detections</span>
                      <span className="font-semibold text-blue-600">{stats?.today_count || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Detections</span>
                      <span className="font-semibold text-purple-600">{stats?.week_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg per Day</span>
                      <span className="font-semibold">{Math.round((stats?.week_count || 0) / 7)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Weight</span>
                      <span className="font-semibold text-orange-600">
                        {weightAnalytics ? formatWeight(weightAnalytics.average_net_weight) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">System Uptime</span>
                      <span className="font-semibold text-green-600">99.2%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Camera Status and Recent Detections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Camera Status */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-white/30 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Camera Status</h3>
                  <div className="space-y-4">
                    {cameras.map((camera) => {
                      const status = cameraStatuses[camera.id] || { status: 'inactive' };
                      return (
                        <div key={camera.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                              <CameraIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{camera.name}</p>
                              <p className="text-sm text-gray-500">{camera.location || 'No location set'}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(status.status)}`}>
                            {status.status.toUpperCase()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
  
                {/* Recent Detections */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-white/30 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Detections</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {recentDetections.slice(0, 10).map((detection) => (
                      <div 
                        key={detection.id} 
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
                        onClick={() => openDetectionDetails(detection)}
                      >
                      <div className="flex items-center">
                        {/* Detection Image Thumbnail */}
                        <div className="w-14 h-14 bg-gray-200 rounded-2xl overflow-hidden mr-4 flex-shrink-0 shadow-md">
                          <img
                            src={`${import.meta.env.VITE_API_URL || ''}/static/${detection.image_path}`}
                            alt="Detection"
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-2xl">${getCategoryIcon(detection.category)}</div>`;
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 capitalize">{(() => {
                            const displayValues = getDisplayValues(detection);
                            return displayValues.category === 'NO_WASTE' ? 'No Waste' : displayValues.category;
                          })()}</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(detection.detected_at), 'MMM dd, HH:mm')}
                          </p>
                          {detection.net_weight_calculation_method === 'subtract_tray' && detection.tray_name && (
                            <p className="text-xs text-purple-600 flex items-center mt-1">
                              <span className="mr-1">🍽️</span>
                              {detection.tray_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-3">
                          {/* Net Weight */}
                          {(() => {
                            const displayValues = getDisplayValues(detection);
                            return displayValues.net_weight !== undefined && displayValues.net_weight !== null && (
                              <div className="text-center">
                                <p className={`text-lg font-bold ${displayValues.net_weight < 0 ? 'text-red-600' : 'text-orange-600'}`}>
                                  {(Math.abs(displayValues.net_weight) / 1000).toFixed(2)}kg
                                </p>
                                <p className="text-xs text-gray-500">net waste</p>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    ))}
                    {recentDetections.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-6xl mb-4">🔍</div>
                        <p className="text-lg font-medium">No recent detections</p>
                        <p className="text-sm">New detections will appear here automatically</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Weight Analytics Details */}
              {weightAnalytics && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Top Waste Categories by Weight */}
                  <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-white/30 p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Top Waste Categories</h3>
                    <div className="space-y-4">
                      {weightAnalytics.top_waste_categories.slice(0, 5).map((category, index) => (
                        <div key={category.category} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl">
                          <div className="flex items-center">
                            <div className="w-10 h-10 flex items-center justify-center text-2xl mr-4">
                              {getCategoryIcon(getNormalizedCategory(category.category))}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{formatCategoryName(category.category)}</p>
                              <p className="text-sm text-gray-500">{category.percentage.toFixed(1)}% of total</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-gray-900">{formatWeight(category.total_weight)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
    
                  {/* Weight by Calculation Method */}
                  <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-white/30 p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Weight by Method</h3>
                    <div className="space-y-4">
                      {Object.entries(weightAnalytics.weight_by_method).map(([method, data]) => (
                        <div key={method} className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-semibold text-gray-900">
                              {method === 'difference' ? 'Weight Difference' : 'Subtract Tray Weight'}
                            </p>
                            <p className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">{data.count} detections</p>
                          </div>
                          <p className="text-3xl font-bold text-blue-600 mb-2">{formatWeight(data.total_weight)}</p>
                          <p className="text-sm text-gray-600">
                            Average: {formatWeight(data.total_weight / data.count)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
    
                  {/* Daily Weight Summary */}
                  <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-white/30 p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Daily Totals</h3>
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                      {weightAnalytics.daily_totals.slice(-7).reverse().map((day, index) => (
                        <div key={day.date} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {format(new Date(day.date), 'MMM dd, yyyy')}
                            </p>
                            <p className="text-sm text-gray-500">{day.count} detections</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-orange-600">{formatWeight(day.total_weight)}</p>
                            <p className="text-sm text-gray-500">
                              Avg: {formatWeight(day.total_weight / day.count)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
        
        {/* Quick Actions - Always Visible */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <button 
              onClick={() => window.location.href = '/cameras'}
              className="group p-6 text-left bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border border-blue-200/50"
            >
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <CameraIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Cameras</p>
                  <p className="text-sm text-gray-600">Manage system</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => window.location.href = '/targets'}
              className="group p-6 text-left bg-gradient-to-br from-green-50 to-green-100 rounded-3xl hover:from-green-100 hover:to-green-200 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border border-green-200/50"
            >
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Targets</p>
                  <p className="text-sm text-gray-600">Waste goals</p>
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => window.location.href = '/executive'}
              className="group p-6 text-left bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl hover:from-purple-100 hover:to-purple-200 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border border-purple-200/50"
            >
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Executive</p>
                  <p className="text-sm text-gray-600">Full analytics</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => window.location.href = '/history'}
              className="group p-6 text-left bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl hover:from-orange-100 hover:to-orange-200 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border border-orange-200/50"
            >
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <Activity className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">History</p>
                  <p className="text-sm text-gray-600">View logs</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Detection Details Modal */}
        <DetectionDetailsModal
          detection={selectedDetection}
          isOpen={showDetailsModal}
          onClose={closeDetectionDetails}
          showFullDetails={false}
        />
      </div>
    </div>
  );
};

export default Dashboard;