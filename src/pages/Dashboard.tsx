import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DetectionStats, Camera, Detection, FoodCategory, UserRole, WeightAnalytics, MealPeriod } from '../types';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
// SSE service is now handled globally in App.tsx
import DetectionDetailsModal from '../components/DetectionDetailsModal';
import { getDisplayValues } from '../utils/detectionDisplay';
import { AnalyticsChart } from '../components/AnalyticsChart';
import { formatCurrency } from '../utils/currency';
import { useCurrency } from '../contexts/CurrencyContext';
import { getTodayLocalDate } from '../utils/dateUtils';
import { TrendingUp, Camera as CameraIcon, Scale, Activity, Target, BarChart3, BarChart2, Settings, Download } from 'lucide-react';
import { CurrencyDollarIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { wasteTargetsApi, WasteTarget, systemSettingsApi, financialAnalyticsApi, restaurantPerformanceApi } from '../services/financialApi';
import PDFExportButton from '../components/PDFExportButton';
import clsx from 'clsx';

type AnalyticsTabType = 'cost' | 'items' | 'weight' | 'performance';

const Dashboard: React.FC = () => {
  const { user, hasAnyRole } = useAuth();
  const canViewOCRResults = hasAnyRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.REVIEWER]);
  const { defaultCurrency } = useCurrency();
  
  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTabType>('cost');
  const [selectedMealPeriod, setSelectedMealPeriod] = useState<MealPeriod | ''>('');

  // Per-chart meal period filters (for charts outside Analytics Dashboard)
  const [chartFilters, setChartFilters] = useState<{
    costWeightCombined: MealPeriod | '';
  }>({
    costWeightCombined: '',
  });

  // Shared filters per Analytics tab (one filter for both charts in each tab)
  const [analyticsFilters, setAnalyticsFilters] = useState<{
    cost: MealPeriod | '';
    items: MealPeriod | '';
    weight: MealPeriod | '';
  }>({
    cost: '',
    items: '',
    weight: '',
  });

  // Existing states
  const [stats, setStats] = useState<DetectionStats | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [recentDetections, setRecentDetections] = useState<Detection[]>([]);
  const [cameraStatuses, setCameraStatuses] = useState<Record<string, any>>({});
  const [categorySummary, setCategorySummary] = useState<any>({});
  const [weightAnalytics, setWeightAnalytics] = useState<WeightAnalytics | null>(null);
  const [yearlyAnalytics, setYearlyAnalytics] = useState<WeightAnalytics | null>(null);
  const [monthlyAnalytics, setMonthlyAnalytics] = useState<WeightAnalytics | null>(null);
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

  // Get default price settings
  const { data: defaultPriceSettings } = useQuery({
    queryKey: ['defaultPriceSettings'],
    queryFn: systemSettingsApi.getDefaultPriceSettings,
    staleTime: 5 * 60 * 1000,
  });

  // Get financial analytics data
  const { data: financialSummary } = useQuery({
    queryKey: ['financialSummary', 30, selectedMealPeriod],
    queryFn: () => financialAnalyticsApi.getCostSummary(30, undefined, selectedMealPeriod || undefined),
    staleTime: 2 * 60 * 1000,
  });

  // Get executive dashboard data for comprehensive cost analysis
  const { data: executiveDashboardData } = useQuery({
    queryKey: ['executiveDashboard'],
    queryFn: financialAnalyticsApi.getExecutiveDashboard,
    staleTime: 2 * 60 * 1000,
  });

  // Get financial cost trends for accurate daily/monthly costs
  const { data: financialTrends } = useQuery({
    queryKey: ['financialTrends', 31, selectedMealPeriod],
    queryFn: () => financialAnalyticsApi.getCostTrends(31, undefined, selectedMealPeriod || undefined),
    staleTime: 2 * 60 * 1000,
  });

  // Get cost trends for Cost tab with shared filter
  const { data: costTabTrendData } = useQuery({
    queryKey: ['financialTrends', 'costTab', 31, analyticsFilters.cost || selectedMealPeriod],
    queryFn: () => financialAnalyticsApi.getCostTrends(31, undefined, analyticsFilters.cost || selectedMealPeriod || undefined),
    staleTime: 2 * 60 * 1000,
  });

  // Get weight trends for Weight tab with shared filter
  const { data: weightTabTrendData } = useQuery({
    queryKey: ['financialTrends', 'weightTab', 31, analyticsFilters.weight || selectedMealPeriod],
    queryFn: () => financialAnalyticsApi.getCostTrends(31, undefined, analyticsFilters.weight || selectedMealPeriod || undefined),
    staleTime: 2 * 60 * 1000,
  });

  // Get combined cost & weight trends for chart with individual filter
  const { data: costWeightCombinedData } = useQuery({
    queryKey: ['financialTrends', 'costWeightCombined', 31, chartFilters.costWeightCombined || selectedMealPeriod],
    queryFn: () => financialAnalyticsApi.getCostTrends(31, undefined, chartFilters.costWeightCombined || selectedMealPeriod || undefined),
    staleTime: 2 * 60 * 1000,
  });

  // Get restaurant performance KPIs
  const { data: restaurantPerformanceKPIs } = useQuery({
    queryKey: ['restaurantPerformanceKPIs', 30],
    queryFn: () => restaurantPerformanceApi.getPerformanceKPIs(30),
    staleTime: 2 * 60 * 1000,
  });

  // Get restaurant performance trends for charts
  const { data: restaurantPerformanceTrends } = useQuery({
    queryKey: ['restaurantPerformanceTrends', 30],
    queryFn: () => restaurantPerformanceApi.getDailyTrends(30),
    staleTime: 2 * 60 * 1000,
  });

  // Get category costs for Analytics tabs with shared filters per tab
  const { data: costTabCategoryCosts } = useQuery({
    queryKey: ['categoryCosts', 'costTab', 30, analyticsFilters.cost || selectedMealPeriod],
    queryFn: () => financialAnalyticsApi.getCategoryCosts(30, analyticsFilters.cost || selectedMealPeriod || undefined),
    staleTime: 2 * 60 * 1000,
  });

  const { data: weightTabCategoryCosts } = useQuery({
    queryKey: ['categoryCosts', 'weightTab', 30, analyticsFilters.weight || selectedMealPeriod],
    queryFn: () => financialAnalyticsApi.getCategoryCosts(30, analyticsFilters.weight || selectedMealPeriod || undefined),
    staleTime: 2 * 60 * 1000,
  });

  const { data: itemsTabCategoryCosts } = useQuery({
    queryKey: ['categoryCosts', 'itemsTab', 30, analyticsFilters.items || selectedMealPeriod],
    queryFn: () => financialAnalyticsApi.getCategoryCosts(30, analyticsFilters.items || selectedMealPeriod || undefined),
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    loadDashboardData();
    
    // Listen to global SSE events via custom events
    const handleNewDetection = (event: any) => {
      setRecentDetections(prev => [event.detail, ...prev.slice(0, 9)]);
      loadDashboardData();
    };
    
    const handleCameraStatus = (event: any) => {
      setCameraStatuses(event.detail);
    };
    
    const handleRecentDetections = (event: any) => {
      setRecentDetections(event.detail);
    };
    
    window.addEventListener('newDetection', handleNewDetection);
    window.addEventListener('cameraStatus', handleCameraStatus);
    window.addEventListener('recentDetections', handleRecentDetections);
    
    return () => {
      window.removeEventListener('newDetection', handleNewDetection);
      window.removeEventListener('cameraStatus', handleCameraStatus);
      window.removeEventListener('recentDetections', handleRecentDetections);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      // Calculate days since January 1st for yearly data and month start for monthly data
      const now = new Date();
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const daysSinceYearStart = Math.ceil((now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
      // For monthly data, calculate actual days since month start + 1 (1 on first day)
      const daysSinceMonthStart = Math.floor((now.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
      // Use days since month start + 1 to get current month data
      const monthlyApiDays = daysSinceMonthStart + 1;
      
      const [statsData, camerasData, detectionsData, statusesData, summaryData, weightAnalyticsData, yearlyAnalyticsData, monthlyTrendsData] = await Promise.all([
        apiService.getDetectionStats(),
        apiService.getCameras({ limit: 50 }),
        apiService.getDetections({ page: 1, page_size: 10 }),
        apiService.getCameraStatuses(),
        apiService.getCategorySummary(7),
        apiService.getWeightAnalytics({ days: 30 }).catch(() => null), // Keep this for other calculations
        apiService.getWeightAnalytics({ days: daysSinceYearStart }).catch(() => null),
        apiService.getWeightTrends({ days: 31, interval: 'daily' }).catch(() => [])
      ]);

      setStats(statsData);
      setCameras(camerasData);
      setRecentDetections(detectionsData.items || []);
      setCameraStatuses(statusesData);
      setCategorySummary(summaryData);
      setWeightAnalytics(weightAnalyticsData);
      setYearlyAnalytics(yearlyAnalyticsData);
      // Calculate monthly analytics from trends data for current month only
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const currentMonthTrends = monthlyTrendsData.filter((trend: any) => {
        const trendDate = new Date(trend.date);
        return trendDate.getMonth() === currentMonth && trendDate.getFullYear() === currentYear;
      });
      
      const monthlyTotal = currentMonthTrends.reduce((sum: number, trend: any) => sum + trend.total_weight, 0);
      const monthlyDetectionCount = currentMonthTrends.reduce((sum: number, trend: any) => sum + trend.count, 0);
      const monthlyAnalyticsCalculated = {
        total_net_weight: monthlyTotal,
        average_net_weight: monthlyDetectionCount > 0 ? monthlyTotal / monthlyDetectionCount : 0,
        weight_by_category: {},
        weight_by_method: {},
        daily_totals: currentMonthTrends.map((trend: any) => ({
          date: trend.date,
          total_weight: trend.total_weight,
          count: trend.count
        })),
        top_waste_categories: []
      };
      
      setMonthlyAnalytics(monthlyAnalyticsCalculated);
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

  const getMealPeriodInfo = (mealPeriod?: string) => {
    switch (mealPeriod) {
      case MealPeriod.BREAKFAST:
        return { label: 'Breakfast', color: 'bg-amber-100 text-amber-800', icon: '🌅' };
      case MealPeriod.LUNCH:
        return { label: 'Lunch', color: 'bg-orange-100 text-orange-800', icon: '☀️' };
      case MealPeriod.DINNER:
        return { label: 'Dinner', color: 'bg-indigo-100 text-indigo-800', icon: '🌙' };
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: '🍽️' };
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
    if (!category || category.trim() === '') {
      return 'Unknown';
    }
    if (category.includes('FoodCategory.')) {
      category = category.split('.')[1].toLowerCase();
    }
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const getNormalizedCategory = (category: string): FoodCategory => {
    if (category.includes('FoodCategory.')) {
      const enumKey = category.split('.')[1];
      return FoodCategory[enumKey as keyof typeof FoodCategory];
    }
    return category as FoodCategory;
  };

  // Use itemsTabCategoryCosts for consistent filtering with meal period
  const chartData = itemsTabCategoryCosts ? itemsTabCategoryCosts
    .filter(cat => cat.category !== 'NO_WASTE')
    .map(cat => {
      const normalizedCategory = cat.category as FoodCategory;
      return {
        category: formatCategoryName(cat.category),
        count: cat.detection_count,
        color: getCategoryColor(normalizedCategory)
      };
    })
    .sort((a, b) => b.count - a.count) : [];

  // Use only financial analytics data - no more confusing estimates
  const actualMonthlyCost = financialSummary?.total_cost || 0;
  const dailyAverage = actualMonthlyCost / 30;

  // Category distribution uses same data as items by category
  const pieData = itemsTabCategoryCosts ? itemsTabCategoryCosts
    .filter(cat => cat.category !== 'NO_WASTE')
    .map(cat => {
      const normalizedCategory = cat.category as FoodCategory;
      return {
        name: formatCategoryName(cat.category),
        value: cat.detection_count,
        color: getCategoryColor(normalizedCategory)
      };
    }) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Food Waste Management
              </h1>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-600">Live Data</span>
                </div>
                <span className="text-gray-500">{format(new Date(), 'MMM dd, yyyy HH:mm')}</span>
              </div>
            </div>
            
            {/* Export Button and Meal Period Filter */}
            <div className="flex items-center gap-4">
              {/* Meal Period Filter */}
              <select
                value={selectedMealPeriod}
                onChange={(e) => setSelectedMealPeriod(e.target.value as MealPeriod | '')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Meals</option>
                <option value="BREAKFAST">🌅 Breakfast</option>
                <option value="LUNCH">☀️ Lunch</option>
                <option value="DINNER">🌙 Dinner</option>
              </select>

              <PDFExportButton
                variant="primary"
                size="md"
                className="shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Time Period Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Current Year Card */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1 font-medium">{new Date().getFullYear()}</div>
                <div className="text-lg font-bold text-gray-900 mb-1">
                  {(() => {
                    // Use financial trends data for consistency
                    if (financialTrends) {
                      const now = new Date();
                      const yearStart = new Date(now.getFullYear(), 0, 1);
                      const yearlyFinancialData = financialTrends.filter(trend => {
                        const trendDate = new Date(trend.date);
                        return trendDate >= yearStart && trendDate <= now;
                      });
                      const yearlyWeight = yearlyFinancialData.reduce((sum, trend) => sum + trend.weight_kg, 0);
                      return yearlyWeight.toFixed(1);
                    }
                    return '0.0';
                  })()}kg
                </div>
                <div className="text-sm font-semibold text-red-600">
                  {(() => {
                    // Use financial trends data for accurate yearly cost
                    if (financialTrends) {
                      const now = new Date();
                      const yearStart = new Date(now.getFullYear(), 0, 1);
                      const yearlyFinancialData = financialTrends.filter(trend => {
                        const trendDate = new Date(trend.date);
                        return trendDate >= yearStart && trendDate <= now;
                      });
                      const yearlyCost = yearlyFinancialData.reduce((sum, trend) => sum + trend.total_cost, 0);
                      return formatCurrency(yearlyCost, defaultCurrency);
                    }
                    return formatCurrency(0, defaultCurrency);
                  })()}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="h-2 bg-blue-500 rounded-full" style={{ 
                    width: `${targetsSummary && targetsSummary.total_weight_limit > 0 ? 
                      Math.min(100, (() => {
                        // Use financial trends data for progress bar consistency
                        if (financialTrends) {
                          const now = new Date();
                          const yearStart = new Date(now.getFullYear(), 0, 1);
                          const yearlyFinancialData = financialTrends.filter(trend => {
                            const trendDate = new Date(trend.date);
                            return trendDate >= yearStart && trendDate <= now;
                          });
                          const yearlyWeight = yearlyFinancialData.reduce((sum, trend) => sum + trend.weight_kg, 0);
                          return (yearlyWeight / (targetsSummary.total_weight_limit * 12)) * 100;
                        }
                        return 0;
                      })()) : 0}%` 
                  }}></div>
                </div>
              </div>
            </div>

            {/* Current Month Card */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1 font-medium">{new Date().toLocaleDateString('en-US', { month: 'long' })}</div>
                <div className="text-lg font-bold text-gray-900 mb-1">
                  {(() => {
                    // Use financial trends data for consistency
                    if (financialTrends) {
                      const now = new Date();
                      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                      const monthlyFinancialData = financialTrends.filter(trend => {
                        const trendDate = new Date(trend.date);
                        return trendDate >= monthStart && trendDate <= now;
                      });
                      const monthlyWeight = monthlyFinancialData.reduce((sum, trend) => sum + trend.weight_kg, 0);
                      return monthlyWeight.toFixed(1);
                    }
                    return '0.0';
                  })()}kg
                </div>
                <div className="text-sm font-semibold text-red-600">
                  {(() => {
                    // Use financial trends data for accurate monthly cost
                    if (financialTrends) {
                      const now = new Date();
                      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                      const monthlyFinancialData = financialTrends.filter(trend => {
                        const trendDate = new Date(trend.date);
                        return trendDate >= monthStart && trendDate <= now;
                      });
                      const monthlyCost = monthlyFinancialData.reduce((sum, trend) => sum + trend.total_cost, 0);
                      return formatCurrency(monthlyCost, defaultCurrency);
                    }
                    return formatCurrency(0, defaultCurrency);
                  })()}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="h-2 bg-green-500 rounded-full" style={{ 
                    width: `${targetsSummary && targetsSummary.total_weight_limit > 0 ? 
                      Math.min(100, (() => {
                        // Use financial trends data for progress bar consistency
                        if (financialTrends) {
                          const now = new Date();
                          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                          const monthlyFinancialData = financialTrends.filter(trend => {
                            const trendDate = new Date(trend.date);
                            return trendDate >= monthStart && trendDate <= now;
                          });
                          const monthlyWeight = monthlyFinancialData.reduce((sum, trend) => sum + trend.weight_kg, 0);
                          return (monthlyWeight / targetsSummary.total_weight_limit) * 100;
                        }
                        return 0;
                      })()) : 0}%` 
                  }}></div>
                </div>
              </div>
            </div>

            {/* Current Week Card */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1 font-medium">Last 7 days</div>
                <div className="text-lg font-bold text-gray-900 mb-1">
                  {(() => {
                    // Use financial trends data for consistency
                    if (financialTrends) {
                      const now = new Date();
                      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                      const weeklyFinancialData = financialTrends.filter(trend => {
                        const trendDate = new Date(trend.date);
                        return trendDate >= weekStart && trendDate <= now;
                      });
                      const weeklyWeight = weeklyFinancialData.reduce((sum, trend) => sum + trend.weight_kg, 0);
                      return weeklyWeight.toFixed(1);
                    }
                    return '0.0';
                  })()}kg
                </div>
                <div className="text-sm font-semibold text-red-600">
                  {(() => {
                    // Use financial trends data for accurate weekly cost
                    if (financialTrends) {
                      const now = new Date();
                      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                      const weeklyFinancialData = financialTrends.filter(trend => {
                        const trendDate = new Date(trend.date);
                        return trendDate >= weekStart && trendDate <= now;
                      });
                      const weeklyCost = weeklyFinancialData.reduce((sum, trend) => sum + trend.total_cost, 0);
                      return formatCurrency(weeklyCost, defaultCurrency);
                    }
                    return formatCurrency(0, defaultCurrency);
                  })()}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="h-2 bg-yellow-500 rounded-full" style={{ 
                    width: `${targetsSummary && targetsSummary.total_weight_limit > 0 ? 
                      Math.min(100, (() => {
                        // Use financial trends data for progress bar consistency
                        if (financialTrends) {
                          const now = new Date();
                          const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                          const weeklyFinancialData = financialTrends.filter(trend => {
                            const trendDate = new Date(trend.date);
                            return trendDate >= weekStart && trendDate <= now;
                          });
                          const weeklyWeight = weeklyFinancialData.reduce((sum, trend) => sum + trend.weight_kg, 0);
                          return (weeklyWeight / (targetsSummary.total_weight_limit / 4)) * 100;
                        }
                        return 0;
                      })()) : 0}%` 
                  }}></div>
                </div>
              </div>
            </div>

            {/* Today Card */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1 font-medium">Today</div>
                <div className="text-lg font-bold text-gray-900 mb-1">
                  {(() => {
                    const today = getTodayLocalDate();
                    // Use financial trends data for consistency with chart
                    if (financialTrends) {
                      const todayFinancialData = financialTrends.find(trend => trend.date === today);
                      return todayFinancialData ? todayFinancialData.weight_kg.toFixed(2) : '0.00';
                    }
                    return '0.00';
                  })()}kg
                </div>
                <div className="text-sm font-semibold text-red-600">
                  {(() => {
                    const today = getTodayLocalDate();
                    // Use financial trends data for today's cost
                    if (financialTrends) {
                      const todayFinancialData = financialTrends.find(trend => trend.date === today);
                      if (todayFinancialData) {
                        return formatCurrency(todayFinancialData.total_cost, defaultCurrency);
                      }
                    }
                    return formatCurrency(0, defaultCurrency);
                  })()}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="h-2 bg-purple-500 rounded-full" style={{ 
                    width: `${targetsSummary && targetsSummary.total_weight_limit > 0 ? 
                      Math.min(100, (() => {
                        const today = getTodayLocalDate();
                        // Use financial trends data for progress bar consistency
                        if (financialTrends) {
                          const todayFinancialData = financialTrends.find(trend => trend.date === today);
                          const todayWeight = todayFinancialData ? todayFinancialData.weight_kg : 0;
                          return (todayWeight / (targetsSummary.total_weight_limit / 30)) * 100;
                        }
                        return 0;
                      })()) : 0}%` 
                  }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Restaurant Performance KPIs */}
          {restaurantPerformanceKPIs?.has_restaurant_data && restaurantPerformanceKPIs?.has_waste_data && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">🍽️ Restaurant Performance</h3>
                  <p className="text-sm text-gray-600">
                    Waste efficiency metrics ({restaurantPerformanceKPIs.data_coverage_percentage.toFixed(0)}% data coverage)
                  </p>
                </div>
                {restaurantPerformanceKPIs.data_coverage_percentage < 80 && (
                  <div className="flex items-center space-x-2 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-xs">
                    <span>⚠️</span>
                    <span>Limited data</span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Waste per Cover (Weight) */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-800">Waste per Cover</span>
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Scale className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {restaurantPerformanceKPIs.waste_per_cover_kg > 0 
                      ? `${restaurantPerformanceKPIs.waste_per_cover_kg.toFixed(3)}kg` 
                      : '0.000kg'
                    }
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {restaurantPerformanceKPIs.total_covers.toLocaleString()} total covers
                  </div>
                </div>

                {/* Waste per Cover (Cost) */}
                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-4 border border-red-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-800">Waste Cost per Cover</span>
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <CurrencyDollarIcon className="w-4 h-4 text-red-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-red-900">
                    {formatCurrency(restaurantPerformanceKPIs.waste_per_cover_cost, defaultCurrency)}
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    Per diner waste cost
                  </div>
                </div>

                {/* Waste vs F&B Revenue */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-4 border border-purple-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-800">Waste vs F&B Revenue</span>
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <ChartBarIcon className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">
                    {restaurantPerformanceKPIs.waste_value_per_fb_revenue_percentage.toFixed(2)}%
                  </div>
                  <div className="text-xs text-purple-600 mt-1">
                    Of total F&B revenue
                  </div>
                </div>

                {/* Revenue per Cover */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-800">Avg Revenue per Cover</span>
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {formatCurrency(restaurantPerformanceKPIs.avg_fb_revenue_per_cover, defaultCurrency)}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {formatCurrency(restaurantPerformanceKPIs.total_fb_revenue, defaultCurrency)} total
                  </div>
                </div>
              </div>

              {/* Additional Insights Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {restaurantPerformanceKPIs.avg_covers_per_day.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-600">Avg covers/day</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {restaurantPerformanceKPIs.avg_waste_per_day_kg.toFixed(2)}kg
                  </div>
                  <div className="text-xs text-gray-600">Avg waste/day</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(restaurantPerformanceKPIs.avg_waste_cost_per_day, defaultCurrency)}
                  </div>
                  <div className="text-xs text-gray-600">Avg waste cost/day</div>
                </div>
              </div>
            </div>
          )}

          {/* Data Setup Prompt */}
          {(!restaurantPerformanceKPIs?.has_restaurant_data || !restaurantPerformanceKPIs?.has_waste_data) && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ChartBarIcon className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Unlock Restaurant Performance Insights</h3>
                  <p className="text-blue-800 mb-4">
                    Get powerful metrics like waste per cover and waste-to-revenue ratios by adding your daily restaurant data.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {!restaurantPerformanceKPIs?.has_restaurant_data && (
                      <button
                        onClick={() => window.location.href = '/restaurant-metrics'}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Add Restaurant Metrics
                      </button>
                    )}
                    {!restaurantPerformanceKPIs?.has_waste_data && (
                      <div className="text-sm text-blue-700">
                        📊 Waiting for waste detection data...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-8 gap-6">
            {/* Live Detection Feed */}
            <div className="lg:col-span-3 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">🔍 Live Feed</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500">Live</span>
                </div>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentDetections.slice(0, 6).map((detection) => (
                  <div 
                    key={detection.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => openDetectionDetails(detection)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={`${import.meta.env.VITE_API_URL || ''}/static/${detection.image_path}`}
                          alt="Detection"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-lg">${getCategoryIcon(detection.category)}</div>`;
                          }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 text-sm capitalize">{(() => {
                            const displayValues = getDisplayValues(detection);
                            return displayValues.category === 'NO_WASTE' ? 'No Waste' : displayValues.category;
                          })()}</p>
                          {detection.meal_period && (() => {
                            const mealInfo = getMealPeriodInfo(detection.meal_period);
                            return (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${mealInfo.color}`}>
                                {mealInfo.icon} {mealInfo.label}
                              </span>
                            );
                          })()}
                        </div>
                        <p className="text-xs text-gray-500">
                          {format(new Date(detection.detected_at), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {(() => {
                        const displayValues = getDisplayValues(detection);
                        return displayValues.net_weight !== undefined && displayValues.net_weight !== null && (
                          <div className="text-center">
                            <p className="text-sm font-bold text-orange-600">
                              {(Math.abs(displayValues.net_weight) / 1000).toFixed(2)}kg
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ))}
                {recentDetections.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🔍</div>
                    <p className="text-sm">No recent detections</p>
                  </div>
                )}
              </div>
            </div>

            {/* Combined Cost & Weight Chart */}
            <div className="lg:col-span-5 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">📈 Cost & Weight Trends</h3>
                  <p className="text-sm text-gray-600">Daily cost and weight analysis in combined view</p>
                </div>
                <select
                  value={chartFilters.costWeightCombined}
                  onChange={(e) => setChartFilters(prev => ({ ...prev, costWeightCombined: e.target.value as MealPeriod | '' }))}
                  className="px-3 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Meals</option>
                  <option value="BREAKFAST">🌅 Breakfast</option>
                  <option value="LUNCH">☀️ Lunch</option>
                  <option value="DINNER">🌙 Dinner</option>
                </select>
              </div>
              <AnalyticsChart
                title=""
                subtitle=""
                type="dual-area"
                data={costWeightCombinedData ? costWeightCombinedData.map(trend => ({
                  date: format(new Date(trend.date), 'MMM dd'),
                  cost: trend.total_cost,
                  weight: trend.weight_kg,
                })) : []}
                dataKey="cost"
                secondaryDataKey="weight"
                xAxisKey="date"
                color="#ef4444"
                secondaryColor="#10b981"
                height={240}
                showGrid={true}
                valueType="currency"
                secondaryValueType="weight"
              />
            </div>
          </div>



          {/* Analytics Section with Tabs */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">📈 Analytics Dashboard</h3>
                <p className="text-sm text-gray-600">Detailed insights and trends</p>
              </div>
              
              {/* Analytics Tabs */}
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setAnalyticsTab('cost')}
                  className={clsx(
                    'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                    analyticsTab === 'cost'
                      ? 'bg-white shadow-sm text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  💰 Cost
                </button>
                <button
                  onClick={() => setAnalyticsTab('items')}
                  className={clsx(
                    'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                    analyticsTab === 'items'
                      ? 'bg-white shadow-sm text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  📊 Items
                </button>
                <button
                  onClick={() => setAnalyticsTab('weight')}
                  className={clsx(
                    'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                    analyticsTab === 'weight'
                      ? 'bg-white shadow-sm text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  ⚖️ Weight
                </button>
                {restaurantPerformanceKPIs?.has_restaurant_data && (
                  <button
                    onClick={() => setAnalyticsTab('performance')}
                    className={clsx(
                      'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                      analyticsTab === 'performance'
                        ? 'bg-white shadow-sm text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    🍽️ Performance
                  </button>
                )}
              </div>
            </div>
            
            {/* Shared Filter for Analytics Tab */}
            <div className="mb-4 flex items-center justify-end">
              <select
                value={analyticsTab === 'cost' ? analyticsFilters.cost : analyticsTab === 'items' ? analyticsFilters.items : analyticsFilters.weight}
                onChange={(e) => {
                  const value = e.target.value as MealPeriod | '';
                  setAnalyticsFilters(prev => ({ ...prev, [analyticsTab]: value }));
                }}
                className="px-3 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Meals</option>
                <option value="BREAKFAST">🌅 Breakfast</option>
                <option value="LUNCH">☀️ Lunch</option>
                <option value="DINNER">🌙 Dinner</option>
              </select>
            </div>

            {/* Analytics Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {analyticsTab === 'cost' && (
                <>
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Cost by Category</h4>
                    <AnalyticsChart
                      title=""
                      subtitle=""
                      type="bar"
                      data={costTabCategoryCosts ? costTabCategoryCosts.slice(0, 6).map((cat: any) => ({
                        name: cat.category.charAt(0).toUpperCase() + cat.category.slice(1).toLowerCase(),
                        value: cat.total_cost,
                        weight: cat.weight_kg,
                        percentage: cat.percentage_of_total_cost,
                        detections: cat.detection_count || 0,
                      })) : []}
                      dataKey="value"
                      xAxisKey="name"
                      color="#10B981"
                      height={280}
                      valueType="currency"
                    />
                  </div>
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Daily Cost Trend</h4>
                    <AnalyticsChart
                      title=""
                      subtitle=""
                      type="line"
                      data={costTabTrendData ? costTabTrendData.map(trend => ({
                        date: format(new Date(trend.date), 'MMM dd'),
                        cost: trend.total_cost,
                      })) : []}
                      dataKey="cost"
                      xAxisKey="date"
                      color="#ef4444"
                      height={280}
                      valueType="currency"
                    />
                  </div>
                </>
              )}
              
              {analyticsTab === 'items' && (
                <>
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Items by Category</h4>
                    <AnalyticsChart
                      title=""
                      subtitle=""
                      type="bar"
                      data={chartData}
                      dataKey="count"
                      xAxisKey="category"
                      color="#3b82f6"
                      height={280}
                      valueType="count"
                    />
                  </div>
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Category Distribution</h4>
                    <AnalyticsChart
                      title=""
                      subtitle=""
                      type="pie"
                      data={pieData}
                      dataKey="value"
                      height={280}
                      valueType="count"
                    />
                  </div>
                </>
              )}
              
              {analyticsTab === 'weight' && (
                <>
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Weight by Category</h4>
                    <AnalyticsChart
                      title=""
                      subtitle=""
                      type="bar"
                      data={weightTabCategoryCosts ? weightTabCategoryCosts.slice(0, 6).map((cat: any) => ({
                        name: cat.category.charAt(0).toUpperCase() + cat.category.slice(1).toLowerCase(),
                        weight: cat.weight_kg,
                        cost: cat.total_cost,
                        detections: cat.detection_count || 0,
                      })).sort((a, b) => (b.weight || 0) - (a.weight || 0)) : []}
                      dataKey="weight"
                      xAxisKey="name"
                      color="#10b981"
                      height={280}
                      valueType="weight"
                      unit="kg"
                    />
                  </div>
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Daily Weight Trend</h4>
                    <AnalyticsChart
                      title=""
                      subtitle=""
                      type="line"
                      data={weightTabTrendData ? weightTabTrendData.map(trend => ({
                        date: format(new Date(trend.date), 'MMM dd'),
                        weight: trend.weight_kg,
                      })) : []}
                      dataKey="weight"
                      xAxisKey="date"
                      color="#10b981"
                      height={280}
                      valueType="weight"
                      unit="kg"
                    />
                  </div>
                </>
              )}

              {analyticsTab === 'performance' && (
                <>
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Waste per Cover Trends</h4>
                    <AnalyticsChart
                      title=""
                      subtitle=""
                      type="line"
                      data={restaurantPerformanceTrends ? restaurantPerformanceTrends.filter(d => d.has_restaurant_data && d.has_waste_data).map(trend => ({
                        date: format(new Date(trend.date), 'MMM dd'),
                        waste_kg: trend.waste_per_cover_kg,
                        waste_cost: trend.waste_per_cover_cost,
                      })) : []}
                      dataKey="waste_kg"
                      xAxisKey="date"
                      color="#3b82f6"
                      height={280}
                      valueType="weight"
                      unit="kg per cover"
                    />
                  </div>
                  
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Waste Cost per Cover</h4>
                    <AnalyticsChart
                      title=""
                      subtitle=""
                      type="line"
                      data={restaurantPerformanceTrends ? restaurantPerformanceTrends.filter(d => d.has_restaurant_data && d.has_waste_data).map(trend => ({
                        date: format(new Date(trend.date), 'MMM dd'),
                        cost: trend.waste_per_cover_cost,
                      })) : []}
                      dataKey="cost"
                      xAxisKey="date"
                      color="#dc2626"
                      height={280}
                      valueType="currency"
                      unit={defaultCurrency}
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Waste vs Revenue Ratio</h4>
                    <AnalyticsChart
                      title=""
                      subtitle=""
                      type="area"
                      data={restaurantPerformanceTrends ? restaurantPerformanceTrends.filter(d => d.has_restaurant_data && d.has_waste_data).map(trend => ({
                        date: format(new Date(trend.date), 'MMM dd'),
                        ratio: trend.waste_value_per_fb_revenue_percentage,
                      })) : []}
                      dataKey="ratio"
                      xAxisKey="date"
                      color="#7c3aed"
                      height={280}
                      valueType="percentage"
                      unit="%"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* System Status - Compact */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Status */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-md font-semibold text-gray-900">🔴 System Status</h3>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
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
                <div className="flex justify-between">
                  <span className="text-gray-600">System Uptime</span>
                  <span className="font-semibold text-green-600">99.2%</span>
                </div>
              </div>
            </div>

            {/* Camera Status */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <h3 className="text-md font-semibold text-gray-900 mb-3">📹 Camera Status</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {cameras.slice(0, 3).map((camera) => {
                  const status = cameraStatuses[camera.id] || { status: 'inactive' };
                  return (
                    <div key={camera.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center mr-2">
                          <CameraIcon className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-xs">{camera.name}</p>
                          <p className="text-xs text-gray-500">{camera.location || 'No location'}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(status.status)}`}>
                        {status.status.toUpperCase()}
                      </span>
                    </div>
                  );
                })}
                {cameras.length > 3 && (
                  <div className="text-center text-xs text-gray-500 mt-1">
                    +{cameras.length - 3} more cameras
                  </div>
                )}
              </div>
            </div>
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