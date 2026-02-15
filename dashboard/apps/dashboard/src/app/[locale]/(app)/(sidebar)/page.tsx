"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@vision_dashboard/ui/card";
import { Badge } from "@vision_dashboard/ui/badge";
import { Progress } from "@vision_dashboard/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@vision_dashboard/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@vision_dashboard/ui/select";
import { Spinner } from "@vision_dashboard/ui/spinner";
import { ScrollArea } from "@vision_dashboard/ui/scroll-area";
import {
  Scale,
  Activity,
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/utils/currency";
import { getTodayLocalDate } from "@/utils/dateUtils";
import { getDisplayValues } from "@/utils/detectionDisplay";
import { getCategoryColor, formatCategoryName } from "@/utils/categoryUtils";
import { getMealPeriodInfo } from "@/utils/mealPeriodUtils";
import { useDashboardQueries } from "@/lib/dashboard-queries";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { DetectionDetailsModal } from "@/components/dashboard/DetectionDetailsModal";
import { DetectionImage } from "@/components/dashboard/DetectionImage";
import { RestaurantPerformanceCard } from "@/components/dashboard/RestaurantPerformanceCard";
import { SystemStatusCard, CameraStatusCard } from "@/components/dashboard/SystemStatusCards";
import type { Detection, Camera} from "@/types";

type AnalyticsTabType = "cost" | "items" | "weight" | "performance";

export default function DashboardPage() {
  const { defaultCurrency } = useCurrency();

  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTabType>("cost");
  const [selectedMealPeriod, setSelectedMealPeriod] = useState<string>("all");
  const [chartMealFilter, setChartMealFilter] = useState<string>("all");
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const dashboardQueries = useDashboardQueries({
    selectedMealPeriod,
    chartMealFilter,
    analyticsTab,
    hasRestaurantData: true,
  });

  const {
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
  } = dashboardQueries;

  const stats = statsQuery.data;
  const statsLoading = statsQuery.isLoading;
  const cameras = camerasQuery.data ?? [];
  const camerasLoading = camerasQuery.isLoading;
  const detectionsData = recentDetectionsQuery.data;
  const statusesData = cameraStatusesQuery.data;
  const recentDetections = detectionsData?.items ?? [];
  const cameraStatuses = statusesData ?? {} as Record<string, { status: string }>;
  const targetsSummary = targetsSummaryQuery.data;
  const financialTrends = financialTrendsQuery.data;
  const costWeightCombinedData = costWeightCombinedQuery.data;
  const categoryCosts = categoryCostsQuery.data;
  const restaurantPerformanceKPIs = restaurantPerformanceKPIsQuery.data;
  const restaurantPerformanceTrends = restaurantPerformanceTrendsQuery.data;

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Spinner className="h-12 w-12 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-emerald-50 via-teal-50/80 to-cyan-50/60 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-cyan-950/20 border-emerald-200/60 dark:border-emerald-800/40">
        <CardContent className="p-6">
           <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center ring-1 ring-emerald-200 dark:ring-emerald-800">
                <Scale className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">Food Waste Management</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-emerald-700/70 dark:text-emerald-300/70">
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
        <Card className="bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/40">
          <CardContent className="p-4 text-center">
            <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold mb-1 uppercase tracking-wide">
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
        <Card className="bg-blue-50/60 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-800/40">
          <CardContent className="p-4 text-center">
            <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1 uppercase tracking-wide">
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
        <Card className="bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40">
          <CardContent className="p-4 text-center">
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1 uppercase tracking-wide">Last 7 days</div>
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
        <Card className="bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-800/40">
          <CardContent className="p-4 text-center">
            <div className="text-xs text-rose-600 dark:text-rose-400 font-semibold mb-1 uppercase tracking-wide">Today</div>
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
      {restaurantPerformanceKPIs && (
        <RestaurantPerformanceCard
          kpis={restaurantPerformanceKPIs}
          currency={defaultCurrency}
        />
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-8 gap-6">
        {/* Live Detection Feed */}
        <Card className="lg:col-span-3 border-emerald-200/40 dark:border-emerald-800/30">
          <CardHeader className="bg-gradient-to-r from-emerald-50/60 to-teal-50/40 dark:from-emerald-950/20 dark:to-teal-950/10 rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center">
                  <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
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
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer border-l-2 border-transparent hover:border-l-emerald-400"
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
                  <div className="text-center py-8 bg-gradient-to-br from-emerald-50/40 to-teal-50/30 dark:from-emerald-950/10 dark:to-teal-950/10 rounded-lg">
                    <Activity className="h-10 w-10 mx-auto mb-2 text-emerald-400/50" />
                    <p className="text-sm text-muted-foreground">No recent detections</p>
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
        <SystemStatusCard
          activeCameraCount={Object.values(cameraStatuses).filter((s) => s.status === "active").length}
          totalCameraCount={cameras.length}
          todayDetectionCount={stats?.today_count ?? 0}
        />
        <CameraStatusCard
          cameras={cameras}
          cameraStatuses={cameraStatuses}
        />
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
