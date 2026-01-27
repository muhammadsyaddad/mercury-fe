"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@vision_dashboard/ui/card";
import { Badge } from "@vision_dashboard/ui/badge";
import { Progress } from "@vision_dashboard/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@vision_dashboard/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@vision_dashboard/ui/select";
import { Skeleton } from "@vision_dashboard/ui/skeleton";
import { ScrollArea } from "@vision_dashboard/ui/scroll-area";
import {
  TrendingUp,
  Camera as CameraIcon,
  Scale,
  DollarSign,
  BarChart3,
  Activity,
  Utensils,
} from "lucide-react";
import { apiService } from "@/services/api";
import { financialAnalyticsApi, wasteTargetsApi, restaurantPerformanceApi } from "@/services/financialApi";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/utils/currency";
import { getTodayLocalDate } from "@/utils/dateUtils";
import { getDisplayValues } from "@/utils/detectionDisplay";
import {
  AnalyticsChart,
  DetectionImage,
  DetectionDetailsModal,
} from "@/components/dashboard";
import type { Detection, Camera} from "@/types";

type AnalyticsTabType = "cost" | "items" | "weight" | "performance";

const getMealPeriodInfo = (mealPeriod?: string) => {
  switch (mealPeriod) {
    case "BREAKFAST":
      return { label: "Breakfast", variant: "secondary" as const, icon: "sunrise" };
    case "LUNCH":
      return { label: "Lunch", variant: "default" as const, icon: "sun" };
    case "DINNER":
      return { label: "Dinner", variant: "outline" as const, icon: "moon" };
    default:
      return { label: "Unknown", variant: "secondary" as const, icon: "utensils" };
  }
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    PROTEIN: "#ef4444",
    CARBOHYDRATE: "#f59e0b",
    VEGETABLES: "#10b981",
    FRUITS: "#8b5cf6",
    PASTRY: "#ec4899",
    OTHERS: "#6b7280",
    NO_WASTE: "#9ca3af",
  };
  return colors[category] || "#6b7280";
};

const formatCategoryName = (category: string): string => {
  if (!category || category.trim() === "") return "Unknown";
  let categoryName = category;
  if (categoryName.includes("FoodCategory.")) {
    const parts = categoryName.split(".");
    categoryName = (parts[1] ?? "").toLowerCase();
  }
  return categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase();
};

export default function DashboardPage() {
  const { defaultCurrency } = useCurrency();

  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTabType>("cost");
  const [selectedMealPeriod, setSelectedMealPeriod] = useState<string>("all");
  const [chartMealFilter, setChartMealFilter] = useState<string>("all");
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [recentDetections, setRecentDetections] = useState<Detection[]>([]);
  const [cameraStatuses, setCameraStatuses] = useState<Record<string, { status: string }>>({});

  // Fetch detection stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["detectionStats"],
    queryFn: () => apiService.getDetectionStats(),
    staleTime: 60 * 1000,
  });

  // Fetch cameras
  const { data: cameras = [], isLoading: camerasLoading } = useQuery({
    queryKey: ["cameras"],
    queryFn: () => apiService.getCameras({ limit: 50 }),
    staleTime: 2 * 60 * 1000,
  });

  // Fetch recent detections
  const { data: detectionsData } = useQuery({
    queryKey: ["recentDetections"],
    queryFn: () => apiService.getDetections({ page: 1, page_size: 10 }),
    staleTime: 30 * 1000,
  });

  // Fetch camera statuses
  const { data: statusesData } = useQuery({
    queryKey: ["cameraStatuses"],
    queryFn: () => apiService.getCameraStatuses(),
    staleTime: 30 * 1000,
  });

  // Fetch targets summary
  const { data: targetsSummary } = useQuery({
    queryKey: ["targetsSummary"],
    queryFn: wasteTargetsApi.getTargetsSummary,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch financial summary
  const { data: financialSummary } = useQuery({
    queryKey: ["financialSummary", 30, selectedMealPeriod],
    queryFn: () => financialAnalyticsApi.getCostSummary(30, undefined, selectedMealPeriod !== "all" ? selectedMealPeriod : undefined),
    staleTime: 2 * 60 * 1000,
  });

  // Fetch financial trends
  const { data: financialTrends } = useQuery({
    queryKey: ["financialTrends", 31, selectedMealPeriod],
    queryFn: () => financialAnalyticsApi.getCostTrends(31, undefined, selectedMealPeriod !== "all" ? selectedMealPeriod : undefined),
    staleTime: 2 * 60 * 1000,
  });

  // Fetch cost & weight combined trends
  const { data: costWeightCombinedData } = useQuery({
    queryKey: ["financialTrends", "costWeightCombined", 31, chartMealFilter],
    queryFn: () => financialAnalyticsApi.getCostTrends(31, undefined, chartMealFilter !== "all" ? chartMealFilter : undefined),
    staleTime: 2 * 60 * 1000,
  });

  // Fetch restaurant performance KPIs
  const { data: restaurantPerformanceKPIs } = useQuery({
    queryKey: ["restaurantPerformanceKPIs", 30],
    queryFn: () => restaurantPerformanceApi.getPerformanceKPIs(30),
    staleTime: 2 * 60 * 1000,
  });

  // Fetch restaurant performance trends
  const { data: restaurantPerformanceTrends } = useQuery({
    queryKey: ["restaurantPerformanceTrends", 30],
    queryFn: () => restaurantPerformanceApi.getDailyTrends(30),
    staleTime: 2 * 60 * 1000,
  });

  // Fetch category costs for analytics tabs
  const { data: categoryCosts } = useQuery({
    queryKey: ["categoryCosts", 30, selectedMealPeriod],
    queryFn: () => financialAnalyticsApi.getCategoryCosts(30, selectedMealPeriod !== "all" ? selectedMealPeriod : undefined),
    staleTime: 2 * 60 * 1000,
  });

  // Update recent detections when data changes
  useEffect(() => {
    if (detectionsData?.items) {
      setRecentDetections(detectionsData.items);
    }
  }, [detectionsData]);

  // Update camera statuses when data changes
  useEffect(() => {
    if (statusesData) {
      setCameraStatuses(statusesData);
    }
  }, [statusesData]);

  // Listen for SSE events
  useEffect(() => {
    const handleNewDetection = (event: CustomEvent<Detection>) => {
      setRecentDetections((prev) => [event.detail, ...prev.slice(0, 9)]);
    };

    const handleCameraStatus = (event: CustomEvent<Record<string, { status: string }>>) => {
      setCameraStatuses(event.detail);
    };

    const handleRecentDetections = (event: CustomEvent<Detection[]>) => {
      setRecentDetections(event.detail);
    };

    window.addEventListener("newDetection", handleNewDetection as EventListener);
    window.addEventListener("cameraStatus", handleCameraStatus as EventListener);
    window.addEventListener("recentDetections", handleRecentDetections as EventListener);

    return () => {
      window.removeEventListener("newDetection", handleNewDetection as EventListener);
      window.removeEventListener("cameraStatus", handleCameraStatus as EventListener);
      window.removeEventListener("recentDetections", handleRecentDetections as EventListener);
    };
  }, []);

  // Calculate time period data from financial trends
  const calculatePeriodData = (startDate: Date, endDate: Date) => {
    if (!financialTrends) return { weight: 0, cost: 0 };

    const periodData = financialTrends.filter((trend) => {
      const trendDate = new Date(trend.date);
      return trendDate >= startDate && trendDate <= endDate;
    });

    return {
      weight: periodData.reduce((sum, trend) => sum + trend.weight_kg, 0),
      cost: periodData.reduce((sum, trend) => sum + trend.total_cost, 0),
    };
  };

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const today = getTodayLocalDate();

  const yearlyData = calculatePeriodData(yearStart, now);
  const monthlyData = calculatePeriodData(monthStart, now);
  const weeklyData = calculatePeriodData(weekStart, now);
  const todayData = financialTrends?.find((t) => t.date === today) || { weight_kg: 0, total_cost: 0 };

  // Prepare chart data
  const chartData = categoryCosts
    ? categoryCosts
        .filter((cat) => cat.category !== "NO_WASTE")
        .map((cat) => ({
          category: formatCategoryName(cat.category),
          count: cat.detection_count,
          value: cat.total_cost,
          weight: cat.weight_kg,
          color: getCategoryColor(cat.category),
        }))
        .sort((a, b) => b.count - a.count)
    : [];

  const pieData = categoryCosts
    ? categoryCosts
        .filter((cat) => cat.category !== "NO_WASTE")
        .map((cat) => ({
          name: formatCategoryName(cat.category),
          value: cat.detection_count,
          color: getCategoryColor(cat.category),
        }))
    : [];

  const openDetectionDetails = (detection: Detection) => {
    setSelectedDetection(detection);
    setShowDetailsModal(true);
  };

  const isLoading = statsLoading || camerasLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-8 gap-6">
          <Skeleton className="lg:col-span-3 h-96" />
          <Skeleton className="lg:col-span-5 h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Food Waste Management</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  <span>Live Data</span>
                </div>
                <span>{format(new Date(), "MMM dd, yyyy HH:mm")}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Select value={selectedMealPeriod} onValueChange={setSelectedMealPeriod}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Meals" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Meals</SelectItem>
                  <SelectItem value="BREAKFAST">Breakfast</SelectItem>
                  <SelectItem value="LUNCH">Lunch</SelectItem>
                  <SelectItem value="DINNER">Dinner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Period Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Year Card */}
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-muted-foreground font-medium mb-1">
              {new Date().getFullYear()}
            </div>
            <div className="text-lg font-bold mb-1">{yearlyData.weight.toFixed(1)}kg</div>
            <div className="text-sm font-semibold text-red-600">
              {formatCurrency(yearlyData.cost, defaultCurrency)}
            </div>
            <Progress
              value={
                targetsSummary && targetsSummary.total_weight_limit > 0
                  ? Math.min(100, (yearlyData.weight / (targetsSummary.total_weight_limit * 12)) * 100)
                  : 0
              }
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        {/* Month Card */}
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-muted-foreground font-medium mb-1">
              {format(now, "MMMM")}
            </div>
            <div className="text-lg font-bold mb-1">{monthlyData.weight.toFixed(1)}kg</div>
            <div className="text-sm font-semibold text-red-600">
              {formatCurrency(monthlyData.cost, defaultCurrency)}
            </div>
            <Progress
              value={
                targetsSummary && targetsSummary.total_weight_limit > 0
                  ? Math.min(100, (monthlyData.weight / targetsSummary.total_weight_limit) * 100)
                  : 0
              }
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        {/* Week Card */}
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-muted-foreground font-medium mb-1">Last 7 days</div>
            <div className="text-lg font-bold mb-1">{weeklyData.weight.toFixed(1)}kg</div>
            <div className="text-sm font-semibold text-red-600">
              {formatCurrency(weeklyData.cost, defaultCurrency)}
            </div>
            <Progress
              value={
                targetsSummary && targetsSummary.total_weight_limit > 0
                  ? Math.min(100, (weeklyData.weight / (targetsSummary.total_weight_limit / 4)) * 100)
                  : 0
              }
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        {/* Today Card */}
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-muted-foreground font-medium mb-1">Today</div>
            <div className="text-lg font-bold mb-1">{(todayData.weight_kg || 0).toFixed(2)}kg</div>
            <div className="text-sm font-semibold text-red-600">
              {formatCurrency(todayData.total_cost || 0, defaultCurrency)}
            </div>
            <Progress
              value={
                targetsSummary && targetsSummary.total_weight_limit > 0
                  ? Math.min(100, ((todayData.weight_kg || 0) / (targetsSummary.total_weight_limit / 30)) * 100)
                  : 0
              }
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Restaurant Performance KPIs */}
      {restaurantPerformanceKPIs?.has_restaurant_data && restaurantPerformanceKPIs?.has_waste_data && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  Restaurant Performance
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Waste efficiency metrics ({restaurantPerformanceKPIs.data_coverage_percentage.toFixed(0)}% data coverage)
                </p>
              </div>
              {restaurantPerformanceKPIs.data_coverage_percentage < 80 && (
                <Badge variant="secondary">Limited data</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Waste per Cover (Weight) */}
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Waste per Cover</span>
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {restaurantPerformanceKPIs.waste_per_cover_kg > 0
                    ? `${restaurantPerformanceKPIs.waste_per_cover_kg.toFixed(3)}kg`
                    : "0.000kg"}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {restaurantPerformanceKPIs.total_covers.toLocaleString()} total covers
                </div>
              </div>

              {/* Waste per Cover (Cost) */}
              <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4 border border-red-100 dark:border-red-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">Waste Cost per Cover</span>
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {formatCurrency(restaurantPerformanceKPIs.waste_per_cover_cost, defaultCurrency)}
                </div>
                <div className="text-xs text-red-600 dark:text-red-400 mt-1">Per diner waste cost</div>
              </div>

              {/* Waste vs F&B Revenue */}
              <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4 border border-purple-100 dark:border-purple-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Waste vs F&B Revenue</span>
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {restaurantPerformanceKPIs.waste_value_per_fb_revenue_percentage.toFixed(2)}%
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">Of total F&B revenue</div>
              </div>

              {/* Revenue per Cover */}
              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-100 dark:border-green-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">Avg Revenue per Cover</span>
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {formatCurrency(restaurantPerformanceKPIs.avg_fb_revenue_per_cover, defaultCurrency)}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {formatCurrency(restaurantPerformanceKPIs.total_fb_revenue, defaultCurrency)} total
                </div>
              </div>
            </div>

            {/* Additional Insights Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {restaurantPerformanceKPIs.avg_covers_per_day.toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground">Avg covers/day</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {restaurantPerformanceKPIs.avg_waste_per_day_kg.toFixed(2)}kg
                </div>
                <div className="text-xs text-muted-foreground">Avg waste/day</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {formatCurrency(restaurantPerformanceKPIs.avg_waste_cost_per_day, defaultCurrency)}
                </div>
                <div className="text-xs text-muted-foreground">Avg waste cost/day</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-8 gap-6">
        {/* Live Detection Feed */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Live Feed
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-xs text-muted-foreground">Live</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-3 pr-4">
                {recentDetections.slice(0, 6).map((detection) => {
                  const displayValues = getDisplayValues(detection);
                  const mealInfo = getMealPeriodInfo(detection.meal_period);

                  return (
                    <div
                      key={detection.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => openDetectionDetails(detection)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          <DetectionImage
                            detectionId={detection.id}
                            imageType="food_1"
                            alt="Detection"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm capitalize">
                              {displayValues.category === "NO_WASTE"
                                ? "No Waste"
                                : formatCategoryName(displayValues.category)}
                            </p>
                            {detection.meal_period && (
                              <Badge variant={mealInfo.variant} className="text-xs">
                                {mealInfo.label}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(detection.detected_at), "HH:mm")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {displayValues.net_weight !== undefined && displayValues.net_weight !== null && (
                          <p className="text-sm font-bold text-orange-600">
                            {(Math.abs(displayValues.net_weight) / 1000).toFixed(2)}kg
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {recentDetections.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent detections</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Combined Cost & Weight Chart */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Cost & Weight Trends</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Daily cost and weight analysis in combined view
                </p>
              </div>
              <Select value={chartMealFilter} onValueChange={setChartMealFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="All Meals" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Meals</SelectItem>
                  <SelectItem value="BREAKFAST">Breakfast</SelectItem>
                  <SelectItem value="LUNCH">Lunch</SelectItem>
                  <SelectItem value="DINNER">Dinner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <AnalyticsChart
              type="dual-area"
              data={
                costWeightCombinedData
                  ? costWeightCombinedData.map((trend) => ({
                      date: format(new Date(trend.date), "MMM dd"),
                      cost: trend.total_cost,
                      weight: trend.weight_kg,
                    }))
                  : []
              }
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
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section with Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Analytics Dashboard</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Detailed insights and trends</p>
            </div>

            <Tabs value={analyticsTab} onValueChange={(v) => setAnalyticsTab(v as AnalyticsTabType)}>
              <TabsList>
                <TabsTrigger value="cost">Cost</TabsTrigger>
                <TabsTrigger value="items">Items</TabsTrigger>
                <TabsTrigger value="weight">Weight</TabsTrigger>
                {restaurantPerformanceKPIs?.has_restaurant_data && (
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {/* Analytics Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analyticsTab === "cost" && (
              <>
                <div>
                  <h4 className="text-sm font-medium mb-3">Cost by Category</h4>
                  <AnalyticsChart
                    type="bar"
                    data={chartData.map((d) => ({
                      name: d.category,
                      value: d.value,
                    }))}
                    dataKey="value"
                    xAxisKey="name"
                    color="#10B981"
                    height={280}
                    valueType="currency"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-3">Daily Cost Trend</h4>
                  <AnalyticsChart
                    type="line"
                    data={
                      financialTrends
                        ? financialTrends.map((trend) => ({
                            date: format(new Date(trend.date), "MMM dd"),
                            cost: trend.total_cost,
                          }))
                        : []
                    }
                    dataKey="cost"
                    xAxisKey="date"
                    color="#ef4444"
                    height={280}
                    valueType="currency"
                  />
                </div>
              </>
            )}

            {analyticsTab === "items" && (
              <>
                <div>
                  <h4 className="text-sm font-medium mb-3">Items by Category</h4>
                  <AnalyticsChart
                    type="bar"
                    data={chartData.map((d) => ({
                      name: d.category,
                      value: d.count,
                    }))}
                    dataKey="value"
                    xAxisKey="name"
                    color="#3b82f6"
                    height={280}
                    valueType="count"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-3">Category Distribution</h4>
                  <AnalyticsChart
                    type="pie"
                    data={pieData}
                    dataKey="value"
                    height={280}
                    valueType="count"
                  />
                </div>
              </>
            )}

            {analyticsTab === "weight" && (
              <>
                <div>
                  <h4 className="text-sm font-medium mb-3">Weight by Category</h4>
                  <AnalyticsChart
                    type="bar"
                    data={chartData
                      .map((d) => ({
                        name: d.category,
                        value: d.weight,
                      }))
                      .sort((a, b) => b.value - a.value)}
                    dataKey="value"
                    xAxisKey="name"
                    color="#10b981"
                    height={280}
                    valueType="weight"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-3">Daily Weight Trend</h4>
                  <AnalyticsChart
                    type="line"
                    data={
                      financialTrends
                        ? financialTrends.map((trend) => ({
                            date: format(new Date(trend.date), "MMM dd"),
                            weight: trend.weight_kg,
                          }))
                        : []
                    }
                    dataKey="weight"
                    xAxisKey="date"
                    color="#10b981"
                    height={280}
                    valueType="weight"
                  />
                </div>
              </>
            )}

            {analyticsTab === "performance" && restaurantPerformanceTrends && (
              <>
                <div>
                  <h4 className="text-sm font-medium mb-3">Waste per Cover Trends</h4>
                  <AnalyticsChart
                    type="line"
                    data={restaurantPerformanceTrends
                      .filter((d) => d.has_restaurant_data && d.has_waste_data)
                      .map((trend) => ({
                        date: format(new Date(trend.date), "MMM dd"),
                        waste_kg: trend.waste_per_cover_kg,
                      }))}
                    dataKey="waste_kg"
                    xAxisKey="date"
                    color="#3b82f6"
                    height={280}
                    valueType="weight"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-3">Waste Cost per Cover</h4>
                  <AnalyticsChart
                    type="line"
                    data={restaurantPerformanceTrends
                      .filter((d) => d.has_restaurant_data && d.has_waste_data)
                      .map((trend) => ({
                        date: format(new Date(trend.date), "MMM dd"),
                        cost: trend.waste_per_cover_cost,
                      }))}
                    dataKey="cost"
                    xAxisKey="date"
                    color="#dc2626"
                    height={280}
                    valueType="currency"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">System Status</CardTitle>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Cameras</span>
                <span className="font-semibold text-green-600">
                  {Object.values(cameraStatuses).filter((s) => s.status === "active").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Cameras</span>
                <span className="font-semibold">{cameras.length}</span>
              </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Today's Detections</span>
                  <span className="font-semibold text-blue-600">{stats?.today_count ?? 0}</span>
                </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">System Uptime</span>
                <span className="font-semibold text-green-600">99.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Camera Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CameraIcon className="h-4 w-4" />
              Camera Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40">
              <div className="space-y-2 pr-4">
                {cameras.slice(0, 5).map((camera: Camera) => {
                  const status = cameraStatuses[camera.id] || { status: "inactive" };
                  return (
                    <div
                      key={camera.id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                          <CameraIcon className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-xs">{camera.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {camera.location || "No location"}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={status.status === "active" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {status.status.toUpperCase()}
                      </Badge>
                    </div>
                  );
                })}
                {cameras.length > 5 && (
                  <div className="text-center text-xs text-muted-foreground mt-1">
                    +{cameras.length - 5} more cameras
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Detection Details Modal */}
      <DetectionDetailsModal
        detection={selectedDetection}
        isOpen={showDetailsModal}
        onClose={() => {
          setSelectedDetection(null);
          setShowDetailsModal(false);
        }}
        showFullDetails={false}
      />
    </div>
  );
}
