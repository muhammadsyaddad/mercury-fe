import { useQuery } from "@tanstack/react-query";
import { executiveAnalyticsApi } from "@/services/executiveAnalyticsApi";
import { financialAnalyticsApi, wasteTargetsApi } from "@/services/financialApi";

const EXECUTIVE_REFRESH_INTERVAL = 5 * 60 * 1000;
const EXECUTIVE_STALE_TIME = 2 * 60 * 1000;

export function useExecutiveQueries(autoRefresh: boolean) {
  const refreshInterval = autoRefresh ? EXECUTIVE_REFRESH_INTERVAL : false;

  const dashboardQuery = useQuery({
    queryKey: ["executiveDashboard"],
    queryFn: financialAnalyticsApi.getExecutiveDashboard,
    refetchInterval: refreshInterval,
    staleTime: EXECUTIVE_STALE_TIME,
  });

  const intelligenceQuery = useQuery({
    queryKey: ["executiveBusinessIntelligence"],
    queryFn: executiveAnalyticsApi.getBusinessIntelligence,
    refetchInterval: refreshInterval,
    staleTime: EXECUTIVE_STALE_TIME,
  });

  const targetsSummaryQuery = useQuery({
    queryKey: ["targetsSummary"],
    queryFn: wasteTargetsApi.getTargetsSummary,
    refetchInterval: refreshInterval,
  });

  return {
    refreshInterval,
    dashboardQuery,
    intelligenceQuery,
    targetsSummaryQuery,
  };
}
