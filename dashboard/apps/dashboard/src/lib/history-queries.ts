import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";

const HISTORY_STALE_TIME = 30 * 1000;

type Filters = {
  camera_id: string;
  category: string;
  meal_period: string;
  start_date: string;
  end_date: string;
  page: number;
  page_size: number;
  include_no_waste: boolean;
};

export function useHistoryQueries(filters: Filters) {
  const camerasQuery = useQuery({
    queryKey: ["cameras"],
    queryFn: apiService.getCameras,
    staleTime: 5 * 60 * 1000,
  });

  const detectionsQuery = useQuery({
    queryKey: ["detections", filters],
    queryFn: () =>
      apiService.getDetections({
        page: filters.page,
        page_size: filters.page_size,
        camera_id: filters.camera_id ? Number.parseInt(filters.camera_id) : undefined,
        category: filters.category || undefined,
        meal_period: filters.meal_period || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date ? `${filters.end_date}T23:59:59` : undefined,
        include_no_waste: filters.include_no_waste,
      }),
    staleTime: HISTORY_STALE_TIME,
  });

  return { camerasQuery, detectionsQuery };
}
