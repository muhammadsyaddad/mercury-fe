export { apiService, settingsApi, default as api } from './api';
export { 
  financialAnalyticsApi, 
  foodPricesApi, 
  systemSettingsApi, 
  wasteTargetsApi, 
  restaurantMetricsApi, 
  restaurantPerformanceApi 
} from './financialApi';
export { executiveAnalyticsApi } from './executiveAnalyticsApi';
export { sseService } from './sse';
export { trayService } from './trayService';

// Re-export types from financial API
export type {
  CostSummary,
  CostTrend,
  MonthlyTrend,
  YearlyTrend,
  CategoryCost,
  FinancialKPIs,
  ExecutiveDashboard,
  FoodPrice,
  CreateFoodPrice,
  WasteTarget,
  CreateWasteTarget,
  TargetSummary,
  DefaultPriceSettings,
  RestaurantMetrics,
  CreateRestaurantMetrics,
  UpdateRestaurantMetrics,
  RestaurantPerformanceKPIs,
  RestaurantPerformanceTrend,
} from './financialApi';

// Re-export types from executive analytics API
export type {
  BusinessImpactMetrics,
  OperationalIntelligence,
  PredictiveInsights,
  PerformanceInsight,
  LocationPerformance,
  ExecutiveBusinessIntelligence,
} from './executiveAnalyticsApi';
