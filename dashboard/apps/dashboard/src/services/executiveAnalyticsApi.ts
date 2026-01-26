import axios from 'axios';

// Get API base URL
const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`;
  }
  return '';
};

const API_BASE_URL = getApiBaseUrl();

// Create axios instance for executive analytics API
const executiveClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
executiveClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Enhanced Executive Analytics Types
export interface BusinessImpactMetrics {
  // Detection-based metrics
  average_cost_per_detection: number;
  average_weight_per_detection: number; // in kg
  total_detections_this_month: number;
  cost_per_kg_average: number;
  
  // Year-over-year comparison
  yoy_cost_change: number;
  yoy_cost_change_percentage: number;
  yoy_weight_change: number;
  
  // Budget performance
  budget_variance_amount: number;
  budget_variance_percentage: number;
  projected_monthly_waste_cost: number;
  projected_annual_waste_cost: number;
}

export interface OperationalIntelligence {
  // Peak analysis
  peak_waste_hour: number;
  peak_waste_day_of_week: string;
  peak_waste_cost_hour: number;
  
  // Performance ranking
  best_performing_location: string;
  worst_performing_location: string;
  location_performance_variance: number;
  
  // Efficiency metrics
  detection_accuracy_score: number;
  cost_efficiency_score: number;
  operational_efficiency_trend: string; // "improving", "declining", "stable"
}

export interface PredictiveInsights {
  // Forecasting
  next_month_predicted_cost: number;
  next_quarter_predicted_cost: number;
  seasonal_adjustment_factor: number;
  
  // Risk assessment
  target_achievement_probability: number;
  anomaly_risk_score: number;
  
  // Trend analysis
  waste_trend_direction: string; // "increasing", "decreasing", "stable"
  trend_confidence_score: number;
}

export interface PerformanceInsight {
  insight_type: string; // "opportunity", "risk", "achievement", "alert"
  title: string;
  description: string;
  impact_level: string; // "high", "medium", "low"
  recommended_action: string;
  estimated_savings: number;
  confidence_score: number;
}

export interface LocationPerformance {
  location_name: string;
  camera_id: number;
  total_cost: number;
  detection_count: number;
  avg_cost_per_detection: number;
  efficiency_score: number;
  trend: string; // "improving", "declining", "stable"
}

export interface ExecutiveBusinessIntelligence {
  business_impact: BusinessImpactMetrics;
  operational_intelligence: OperationalIntelligence;
  predictive_insights: PredictiveInsights;
  performance_insights: PerformanceInsight[];
  location_performance: LocationPerformance[];
  executive_summary: string;
}

// Executive Analytics API
export const executiveAnalyticsApi = {
  // Get comprehensive business intelligence
  getBusinessIntelligence: (): Promise<ExecutiveBusinessIntelligence> =>
    executiveClient.get('/executive-analytics/business-intelligence').then((res) => res.data),
  
  // Export executive report as PDF
  exportPDFReport: async (): Promise<Blob> => {
    const response = await executiveClient.get('/executive-analytics/export-pdf', {
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf',
      },
    });
    return response.data;
  },
};
