import axios from 'axios';

// Get API base URL
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }
  return `${window.location.protocol}//${window.location.host}`;
};

const API_BASE_URL = getApiBaseUrl();

// Create axios instance for financial API
const financialClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
financialClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Types for financial analytics
export interface CostSummary {
  period_days: number;
  total_cost: number;
  total_weight_kg: number;
  detection_count: number;
  avg_cost_per_kg: number;
  avg_cost_per_detection: number;
  category_breakdown: Record<string, {
    cost: number;
    weight_kg: number;
    count: number;
    avg_cost_per_kg: number;
  }>;
}

export interface CostTrend {
  date: string;
  total_cost: number;
  weight_kg: number;
  detection_count: number;
  avg_cost_per_kg: number;
}

export interface MonthlyTrend {
  month: number;
  month_name: string;
  year: number;
  total_cost: number;
  weight_kg: number;
  detection_count: number;
  avg_cost_per_kg: number;
}

export interface YearlyTrend {
  year: number;
  total_cost: number;
  weight_kg: number;
  detection_count: number;
  avg_cost_per_kg: number;
}

export interface CategoryCost {
  category: string;
  total_cost: number;
  weight_kg: number;
  detection_count: number;
  avg_cost_per_kg: number;
  percentage_of_total_cost: number;
}

export interface FinancialKPIs {
  total_waste_cost: number;
  total_waste_weight_kg: number;
  avg_cost_per_kg: number;
  detection_count: number;
  previous_period_cost: number;
  cost_change_percentage: number;
  cost_trend: 'up' | 'down' | 'stable';
  total_cost_target: number;
  cost_target_percentage_used: number;
  cost_target_status: 'on_track' | 'warning' | 'exceeded';
  top_cost_categories: CategoryCost[];
  cost_per_detection: number;
  avg_detection_weight_kg: number;
}

export interface ExecutiveDashboard {
  kpis: FinancialKPIs;
  daily_trends: CostTrend[];
  monthly_trends: MonthlyTrend[];
  yearly_trends: YearlyTrend[];
  category_breakdown: CategoryCost[];
  targets_summary: {
    total_targets: number;
    on_track: number;
    warning: number;
    exceeded: number;
  };
  recommendations: string[];
}

// Food Price Management
export interface FoodPrice {
  id: number;
  price_type: 'CATEGORY' | 'ITEM';
  category?: string;
  item_name?: string;
  price_per_kg: number;
  currency: string;
  effective_from: string;
  effective_to?: string;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at?: string;
}

export interface CreateFoodPrice {
  price_type: 'category' | 'item';
  category?: string;
  item_name?: string;
  price_per_kg: number;
  currency?: string;
  effective_from?: string;
  effective_to?: string;
  is_active?: boolean;
}

// Waste Target Management
export interface WasteTarget {
  id: number;
  name: string;
  category?: string;
  target_type: 'weight' | 'cost' | 'both';
  weight_limit_kg?: number;
  cost_limit?: number;
  currency: string;
  period_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  target_period_start: string;
  target_period_end?: string;
  current_weight: number;
  current_cost: number;
  last_reset_date?: string;
  weight_percentage_used: number;
  cost_percentage_used: number;
  is_weight_exceeded: boolean;
  is_cost_exceeded: boolean;
  status: 'on_track' | 'warning' | 'exceeded';
  created_by: number;
  created_at: string;
  updated_at?: string;
  is_active: boolean;
}

export interface CreateWasteTarget {
  name: string;
  category?: string;
  target_type: 'weight' | 'cost' | 'both';
  weight_limit_kg?: number;
  cost_limit?: number;
  currency?: string;
  period_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  target_period_start: string;
  target_period_end?: string;
  is_active?: boolean;
}

export interface TargetSummary {
  total_targets: number;
  on_track_count: number;
  warning_count: number;
  exceeded_count: number;
  total_current_weight: number;
  total_current_cost: number;
  total_weight_limit: number;
  total_cost_limit: number;
  best_performing: WasteTarget[];
  worst_performing: WasteTarget[];
}

// Financial Analytics API
export const financialAnalyticsApi = {
  // Executive Dashboard
  getExecutiveDashboard: (): Promise<ExecutiveDashboard> =>
    financialClient.get('/financial-analytics/executive-dashboard').then((res: any) => res.data),

  // Cost Analytics
  getCostSummary: (days: number, category?: string, meal_period?: string): Promise<CostSummary> =>
    financialClient.get(`/financial-analytics/summary/${days}`, {
      params: {
        ...(category && { category }),
        ...(meal_period && { meal_period })
      }
    }).then((res: any) => res.data),

  getCostTrends: (days: number, category?: string, meal_period?: string): Promise<CostTrend[]> =>
    financialClient.get(`/financial-analytics/trends/${days}`, {
      params: {
        ...(category && { category }),
        ...(meal_period && { meal_period })
      }
    }).then((res: any) => res.data),

  getCategoryCosts: (days: number, meal_period?: string): Promise<CategoryCost[]> =>
    financialClient.get(`/financial-analytics/categories/${days}`, {
      params: meal_period ? { meal_period } : {}
    }).then((res: any) => res.data),

  getFinancialKPIs: (days: number = 30): Promise<FinancialKPIs> =>
    financialClient.get(`/financial-analytics/kpis/${days}`).then((res: any) => res.data),

  // Unified Time-Based Analytics
  getDailyAnalytics: (period: 'current_month' | 'last_30_days' | 'custom' = 'current_month', startDate?: string, endDate?: string, category?: string): Promise<CostTrend[]> =>
    financialClient.get('/financial-analytics/analytics/daily', {
      params: {
        period,
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
        ...(category && { category })
      }
    }).then((res: any) => res.data),

  getMonthlyAnalytics: (period: 'current_year' | 'last_12_months' | 'custom' = 'current_year', startDate?: string, endDate?: string, category?: string): Promise<MonthlyTrend[]> =>
    financialClient.get('/financial-analytics/analytics/monthly', {
      params: {
        period,
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
        ...(category && { category })
      }
    }).then((res: any) => res.data),

  getYearlyAnalytics: (period: 'all_time' | 'last_5_years' | 'custom' = 'all_time', startDate?: string, endDate?: string, category?: string): Promise<YearlyTrend[]> =>
    financialClient.get('/financial-analytics/analytics/yearly', {
      params: {
        period,
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
        ...(category && { category })
      }
    }).then((res: any) => res.data),

  getDateRangeAnalytics: (startDate: string, endDate: string, category?: string): Promise<CostSummary> =>
    financialClient.get('/financial-analytics/analytics/date-range', {
      params: {
        start_date: startDate,
        end_date: endDate,
        ...(category && { category })
      }
    }).then((res: any) => res.data),

  // Legacy endpoints (for backward compatibility)
  getMonthlyTrends: (year?: number): Promise<MonthlyTrend[]> =>
    financialClient.get('/financial-analytics/monthly-trends', {
      params: year ? { year } : {}
    }).then((res: any) => res.data),

  getYearlyTrends: (): Promise<YearlyTrend[]> =>
    financialClient.get('/financial-analytics/yearly-trends').then((res: any) => res.data),

  getCurrentMonthTrends: (): Promise<CostTrend[]> =>
    financialClient.get('/financial-analytics/current-month-trends').then((res: any) => res.data),

  // Utility
  recalculateAllCosts: (category?: string): Promise<{ message: string; updated_count: number }> =>
    financialClient.post('/financial-analytics/recalculate-costs', {}, { 
      params: category ? { category } : {} 
    }).then((res: any) => res.data),
};

// Food Prices API
export const foodPricesApi = {
  // Get all food prices
  getFoodPrices: (params?: {
    skip?: number;
    limit?: number;
    price_type?: 'CATEGORY' | 'ITEM';
    category?: string;
    active_only?: boolean;
  }): Promise<{ items: FoodPrice[]; total_count: number }> =>
    financialClient.get('/food-prices', { params }).then((res: any) => res.data),

  // Get effective price for category/item
  getEffectivePrice: (category: string, itemName?: string): Promise<{
    category: string;
    item_name?: string;
    price_per_kg: number;
    currency: string;
    source: 'item' | 'category' | 'default';
    effective_from: string;
  }> =>
    financialClient.get(`/food-prices/categories/${category}/effective`, {
      params: itemName ? { item_name: itemName } : {}
    }).then((res: any) => res.data),

  // Create new food price
  createFoodPrice: (data: CreateFoodPrice): Promise<FoodPrice> =>
    financialClient.post('/food-prices', data).then((res: any) => res.data),

  // Update food price
  updateFoodPrice: (id: number, data: Partial<CreateFoodPrice>): Promise<FoodPrice> =>
    financialClient.put(`/food-prices/${id}`, data).then((res: any) => res.data),

  // Delete food price
  deleteFoodPrice: (id: number): Promise<{ message: string }> =>
    financialClient.delete(`/food-prices/${id}`).then((res: any) => res.data),

  // Get available categories
  getCategories: (): Promise<string[]> =>
    financialClient.get('/food-prices/categories').then((res: any) => res.data),
};

// System Settings API
export interface DefaultPriceSettings {
  default_price_per_kg: number;
  default_currency: string;
}

export const systemSettingsApi = {
  // Get default price settings
  getDefaultPriceSettings: (): Promise<DefaultPriceSettings> =>
    financialClient.get('/settings/default-price').then((res: any) => res.data),

  // Update default price settings
  updateDefaultPriceSettings: (data: DefaultPriceSettings): Promise<DefaultPriceSettings> =>
    financialClient.put('/settings/default-price', data).then((res: any) => res.data),
};

// Waste Targets API
export const wasteTargetsApi = {
  // Get all targets
  getWasteTargets: (params?: {
    skip?: number;
    limit?: number;
    category?: string;
    target_type?: 'weight' | 'cost' | 'both';
    period_type?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    active_only?: boolean;
  }): Promise<{ items: WasteTarget[]; total_count: number }> =>
    financialClient.get('/waste-targets', { params }).then((res: any) => res.data),

  // Get targets summary
  getTargetsSummary: (): Promise<TargetSummary> =>
    financialClient.get('/waste-targets/summary').then((res: any) => res.data),

  // Get target performance
  getTargetPerformance: (targetId: number): Promise<{
    target_id: number;
    target_name: string;
    category?: string;
    period_type: string;
    current_weight: number;
    current_cost: number;
    weight_limit_kg?: number;
    cost_limit?: number;
    weight_percentage_used: number;
    cost_percentage_used: number;
    days_remaining: number;
    status: string;
    historical_performance: any[];
  }> =>
    financialClient.get(`/waste-targets/${targetId}/performance`).then((res: any) => res.data),

  // Create new target
  createWasteTarget: (data: CreateWasteTarget): Promise<WasteTarget> =>
    financialClient.post('/waste-targets', data).then((res: any) => res.data),

  // Update target
  updateWasteTarget: (id: number, data: Partial<CreateWasteTarget>): Promise<WasteTarget> =>
    financialClient.put(`/waste-targets/${id}`, data).then((res: any) => res.data),

  // Delete target
  deleteWasteTarget: (id: number): Promise<{ message: string }> =>
    financialClient.delete(`/waste-targets/${id}`).then((res: any) => res.data),

  // Reset target progress
  resetTargetProgress: (id: number): Promise<{ message: string }> =>
    financialClient.post(`/waste-targets/${id}/reset`).then((res: any) => res.data),
};

// Restaurant Metrics Types
export interface RestaurantMetrics {
  id: number;
  date: string;
  occupancy_percentage: number;
  number_of_covers: number;
  fb_revenue: number;
  currency: string;
  created_by: number;
  created_at: string;
  updated_at?: string;
}

export interface CreateRestaurantMetrics {
  date: string;
  occupancy_percentage: number;
  number_of_covers: number;
  fb_revenue: number;
  currency?: string;
}

export interface UpdateRestaurantMetrics {
  occupancy_percentage?: number;
  number_of_covers?: number;
  fb_revenue?: number;
  currency?: string;
}

// Restaurant Metrics API
export const restaurantMetricsApi = {
  // Get all restaurant metrics
  getRestaurantMetrics: (params?: {
    skip?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<{ items: RestaurantMetrics[]; total_count: number }> =>
    financialClient.get('/restaurant-metrics', { params }).then((res: any) => res.data),

  // Get restaurant metric by ID
  getRestaurantMetric: (id: number): Promise<RestaurantMetrics> =>
    financialClient.get(`/restaurant-metrics/${id}`).then((res: any) => res.data),

  // Get restaurant metric by date
  getRestaurantMetricByDate: (date: string): Promise<RestaurantMetrics> =>
    financialClient.get(`/restaurant-metrics/by-date/${date}`).then((res: any) => res.data),

  // Create new restaurant metric
  createRestaurantMetrics: (data: CreateRestaurantMetrics): Promise<RestaurantMetrics> =>
    financialClient.post('/restaurant-metrics', data).then((res: any) => res.data),

  // Update restaurant metric
  updateRestaurantMetrics: (id: number, data: UpdateRestaurantMetrics): Promise<RestaurantMetrics> =>
    financialClient.put(`/restaurant-metrics/${id}`, data).then((res: any) => res.data),

  // Delete restaurant metric
  deleteRestaurantMetrics: (id: number): Promise<{ detail: string }> =>
    financialClient.delete(`/restaurant-metrics/${id}`).then((res: any) => res.data),
};

// Restaurant Performance Types
export interface RestaurantPerformanceKPIs {
  period_days: number;
  date_range: {
    start_date: string;
    end_date: string;
  };
  
  // Basic waste metrics
  total_waste_weight_kg: number;
  total_waste_cost: number;
  waste_detection_count: number;
  
  // Basic restaurant metrics
  total_covers: number;
  total_fb_revenue: number;
  restaurant_metrics_days: number;
  
  // Performance ratios
  waste_per_cover_kg: number;
  waste_per_cover_cost: number;
  waste_value_per_fb_revenue_percentage: number;
  waste_cost_per_fb_revenue_ratio: number;
  
  // Additional insights
  avg_covers_per_day: number;
  avg_fb_revenue_per_day: number;
  avg_fb_revenue_per_cover: number;
  avg_waste_per_day_kg: number;
  avg_waste_cost_per_day: number;
  
  // Data availability indicators
  has_restaurant_data: boolean;
  has_waste_data: boolean;
  data_coverage_percentage: number;
}

export interface RestaurantPerformanceTrend {
  date: string;
  waste_weight_kg: number;
  waste_cost: number;
  covers: number;
  fb_revenue: number;
  waste_per_cover_kg: number;
  waste_per_cover_cost: number;
  waste_value_per_fb_revenue_percentage: number;
  has_restaurant_data: boolean;
  has_waste_data: boolean;
}

// Restaurant Performance API
export const restaurantPerformanceApi = {
  // Get restaurant performance KPIs
  getPerformanceKPIs: (period_days: number = 30): Promise<RestaurantPerformanceKPIs> =>
    financialClient.get('/restaurant-performance/kpis', { 
      params: { period_days } 
    }).then((res: any) => res.data),

  // Get daily performance trends
  getDailyTrends: (period_days: number = 30): Promise<RestaurantPerformanceTrend[]> =>
    financialClient.get('/restaurant-performance/daily-trends', { 
      params: { period_days } 
    }).then((res: any) => res.data),

  // Get performance by date range
  getPerformanceByDateRange: (start_date: string, end_date: string): Promise<RestaurantPerformanceKPIs> =>
    financialClient.get('/restaurant-performance/date-range', { 
      params: { start_date, end_date } 
    }).then((res: any) => res.data),
};