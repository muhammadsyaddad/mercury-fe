import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import {
  financialAnalyticsApi,
  restaurantPerformanceApi,
  wasteTargetsApi,
} from "@/services/financialApi";

export const DASHBOARD_PERIOD_DAYS = 30;
export const DASHBOARD_TRENDS_DAYS = 31;

export function useDashboardQueries(params: {
  selectedMealPeriod: string;
  chartMealFilter: string;
  analyticsTab: "cost" | "items" | "weight" | "performance";
  hasRestaurantData: boolean;
}) {
  const {
    selectedMealPeriod,
    chartMealFilter,
    analyticsTab,
    hasRestaurantData,
  } = params;

  const financeEnabled =
    analyticsTab === "cost" || analyticsTab === "items" || analyticsTab === "weight";
  const performanceEnabled = analyticsTab === "performance";

  const statsQuery = useQuery({
    queryKey: ["detectionStats"],
    queryFn: apiService.getDetectionStats,
    staleTime: 60 * 1000,
  });

  const camerasQuery = useQuery({
    queryKey: ["cameras"],
    queryFn: () => apiService.getCameras({ limit: 50 }),
    staleTime: 2 * 60 * 1000,
  });

  const recentDetectionsQuery = useQuery({
    queryKey: ["recentDetections"],
    queryFn: () => apiService.getDetections({ page: 1, page_size: 10 }),
    staleTime: 30 * 1000,
  });

  const cameraStatusesQuery = useQuery({
    queryKey: ["cameraStatuses"],
    queryFn: apiService.getCameraStatuses,
    staleTime: 30 * 1000,
  });

  const targetsSummaryQuery = useQuery({
    queryKey: ["targetsSummary"],
    queryFn: wasteTargetsApi.getTargetsSummary,
    staleTime: 2 * 60 * 1000,
    enabled: financeEnabled,
  });


  const financialTrendsQuery = useQuery({
    queryKey: ["financialTrends", DASHBOARD_TRENDS_DAYS, selectedMealPeriod],
    queryFn: () =>
      financialAnalyticsApi.getCostTrends(
        DASHBOARD_TRENDS_DAYS,
        undefined,
        selectedMealPeriod !== "all" ? selectedMealPeriod : undefined
      ),
    staleTime: 2 * 60 * 1000,
    enabled: financeEnabled,
  });

  const costWeightCombinedQuery = useQuery({
    queryKey: [
      "financialTrends",
      "costWeightCombined",
      DASHBOARD_TRENDS_DAYS,
      chartMealFilter,
    ],
    queryFn: () =>
      financialAnalyticsApi.getCostTrends(
        DASHBOARD_TRENDS_DAYS,
        undefined,
        chartMealFilter !== "all" ? chartMealFilter : undefined
      ),
    staleTime: 2 * 60 * 1000,
    enabled: financeEnabled,
  });

  const categoryCostsQuery = useQuery({
    queryKey: ["categoryCosts", DASHBOARD_PERIOD_DAYS, selectedMealPeriod],
    queryFn: () =>
      financialAnalyticsApi.getCategoryCosts(
        DASHBOARD_PERIOD_DAYS,
        selectedMealPeriod !== "all" ? selectedMealPeriod : undefined
      ),
    staleTime: 2 * 60 * 1000,
    enabled: analyticsTab === "cost" || analyticsTab === "items" || analyticsTab === "weight",
  });

  const restaurantPerformanceKPIsQuery = useQuery({
    queryKey: ["restaurantPerformanceKPIs", DASHBOARD_PERIOD_DAYS],
    queryFn: () => restaurantPerformanceApi.getPerformanceKPIs(DASHBOARD_PERIOD_DAYS),
    staleTime: 2 * 60 * 1000,
    enabled: hasRestaurantData && (financeEnabled || performanceEnabled),
  });

  const restaurantPerformanceTrendsQuery = useQuery({
    queryKey: ["restaurantPerformanceTrends", DASHBOARD_PERIOD_DAYS],
    queryFn: () => restaurantPerformanceApi.getDailyTrends(DASHBOARD_PERIOD_DAYS),
    staleTime: 2 * 60 * 1000,
    enabled:
      performanceEnabled &&
      !!restaurantPerformanceKPIsQuery.data?.has_restaurant_data &&
      !!restaurantPerformanceKPIsQuery.data?.has_waste_data,
  });

  return {
    statsQuery,
    camerasQuery,
    recentDetectionsQuery,
    cameraStatusesQuery,
    targetsSummaryQuery,
    financialTrendsQuery,
    costWeightCombinedQuery,
    categoryCostsQuery,
    restaurantPerformanceKPIsQuery,
    restaurantPerformanceTrendsQuery,
  };
}
