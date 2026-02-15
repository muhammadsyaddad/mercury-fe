"use client";

import { useState } from "react";
import { useExecutiveQueries } from "@/lib/executive-queries";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@vision_dashboard/ui/card";
import { Button } from "@vision_dashboard/ui/button";
import { Badge } from "@vision_dashboard/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@vision_dashboard/ui/tabs";
import { Spinner } from "@vision_dashboard/ui/spinner";
import { cn } from "@vision_dashboard/ui/cn";
import {
  RefreshCw,
  Play,
  Pause,
  Settings,
  TrendingUp,
  TrendingDown,
  Scale,
  DollarSign,
  BarChart3,
  Activity,
  Target,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/utils/currency";
import { formatCategoryName } from "@/utils/categoryUtils";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { KPICard } from "@/components/dashboard/KPICard";
import { ProgressIndicator } from "@/components/dashboard/ProgressIndicator";

type DashboardTab = "overview" | "analytics" | "operations";

export default function ExecutiveDashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { dashboardQuery, intelligenceQuery, targetsSummaryQuery } =
    useExecutiveQueries(autoRefresh);
  const { defaultCurrency } = useCurrency();

  // Data Queries
  const dashboardData = dashboardQuery.data;
  const dashboardLoading = dashboardQuery.isLoading;
  const refetchDashboard = dashboardQuery.refetch;

  const businessIntelligence = intelligenceQuery.data;
  const biLoading = intelligenceQuery.isLoading;
  const refetchBI = intelligenceQuery.refetch;

  const targetsSummary = targetsSummaryQuery.data;
  const targetsLoading = targetsSummaryQuery.isLoading;

  const handleManualRefresh = () => {
    Promise.all([refetchDashboard(), refetchBI()]).then(() => {
      toast.success("Dashboard refreshed");
    });
  };

  const isLoading = dashboardLoading || biLoading || targetsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Spinner className="h-12 w-12 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading executive dashboard...</p>
        </div>
      </div>
    );
  }

  const kpis = dashboardData?.kpis;
  const trends = dashboardData?.daily_trends || [];
  const categories = dashboardData?.category_breakdown || [];

  // Prepare chart data
  const trendChartData = trends.map((trend) => ({
    date: format(new Date(trend.date), "MMM dd"),
    cost: trend.total_cost,
    weight: trend.weight_kg,
    detections: trend.detection_count,
  }));

  const categoryChartData = categories.slice(0, 6).map((cat) => ({
    name: formatCategoryName(cat.category),
    value: cat.total_cost,
    weight: cat.weight_kg,
    percentage: cat.percentage_of_total_cost,
    detections: cat.detection_count || 0,
  }));

  // Prepare insights data
  const insights =
    businessIntelligence?.performance_insights?.slice(0, 4).map((insight) => ({
      type:
        insight.insight_type === "opportunity"
          ? "info"
          : insight.insight_type === "risk"
            ? "warning"
            : insight.insight_type === "alert"
              ? "alert"
              : "success",
      title: insight.title,
      description: insight.description,
      action: insight.recommended_action,
      value: insight.estimated_savings > 0 ? formatCurrency(insight.estimated_savings, defaultCurrency) : undefined,
    })) || [];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "alert":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getInsightBadgeVariant = (type: string) => {
    switch (type) {
      case "success":
        return "default" as const;
      case "warning":
        return "secondary" as const;
      case "alert":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-gradient-to-r from-indigo-50 via-blue-50/80 to-violet-50/60 dark:from-indigo-950/40 dark:via-blue-950/30 dark:to-violet-950/20 rounded-xl p-6 border border-indigo-200/60 dark:border-indigo-800/40">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center ring-1 ring-indigo-200 dark:ring-indigo-800">
            <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-indigo-900 dark:text-indigo-100">Executive Dashboard</h1>
            <p className="text-indigo-700/70 dark:text-indigo-300/70 mt-1">Real-time food waste analytics and insights</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Status */}
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Live - {format(new Date(), "HH:mm")}
            </span>
          </div>

          {/* Auto-refresh Toggle */}
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            {autoRefresh ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            Auto-refresh
          </Button>

          {/* Manual Refresh */}
          <Button variant="outline" size="sm" onClick={handleManualRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DashboardTab)}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <Activity className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="operations" className="gap-2">
            <Target className="h-4 w-4" />
            Operations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Total Cost"
              value={formatCurrency(kpis?.total_waste_cost || 0, defaultCurrency)}
              subtitle="Monthly waste cost"
              trend={kpis?.cost_trend === "up" ? "up" : kpis?.cost_trend === "down" ? "down" : "stable"}
              trendValue={`${Math.abs(kpis?.cost_change_percentage || 0).toFixed(1)}%`}
              icon={<DollarSign className="h-5 w-5" />}
              color="blue"
            />

            <KPICard
              title="Total Weight"
              value={`${(kpis?.total_waste_weight_kg || 0).toFixed(1)} kg`}
              subtitle={kpis?.detection_count ? `${kpis.detection_count} detections` : "No detections"}
              icon={<Scale className="h-5 w-5" />}
              color="green"
            />

            <KPICard
              title="Avg Cost/KG"
              value={formatCurrency(kpis?.avg_cost_per_kg || 0, defaultCurrency)}
              subtitle="Per kilogram"
              icon={<BarChart3 className="h-5 w-5" />}
              color="purple"
            />

            <KPICard
              title="Cost/Detection"
              value={formatCurrency(kpis?.cost_per_detection || 0, defaultCurrency)}
              subtitle="Per incident"
              icon={<Activity className="h-5 w-5" />}
              color="yellow"
            />
          </div>

          {/* Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Cost Trends</CardTitle>
                    <CardDescription>Daily waste cost analysis</CardDescription>
                  </div>
                  {businessIntelligence && (
                    <Badge variant={businessIntelligence.predictive_insights.waste_trend_direction === "decreasing" ? "default" : "secondary"}>
                      {businessIntelligence.predictive_insights.waste_trend_direction === "increasing" && (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      )}
                      {businessIntelligence.predictive_insights.waste_trend_direction === "decreasing" && (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {businessIntelligence.business_impact.yoy_cost_change_percentage.toFixed(1)}% YoY
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <AnalyticsChart
                  type="area"
                  data={trendChartData}
                  dataKey="cost"
                  xAxisKey="date"
                  color="#3B82F6"
                  height={280}
                  valueType="currency"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>Cost by food category</CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsChart
                  type="bar"
                  data={categoryChartData}
                  dataKey="value"
                  xAxisKey="name"
                  color="#10B981"
                  height={280}
                  valueType="currency"
                />
              </CardContent>
            </Card>
          </div>

          {/* Stats and Progress Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Business Metrics */}
            {businessIntelligence && (
              <Card>
                <CardHeader>
                  <CardTitle>Business Metrics</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-indigo-50/50 dark:bg-indigo-950/15 rounded-lg border border-indigo-100/40 dark:border-indigo-900/20">
                      <div>
                        <div className="text-sm text-muted-foreground">Budget vs Actual</div>
                        <div className="text-2xl font-bold">
                          {businessIntelligence.business_impact.budget_variance_percentage.toFixed(1)}%
                        </div>
                      </div>
                      <div
                        className={cn(
                          "flex items-center gap-1 text-sm font-medium",
                          businessIntelligence.business_impact.budget_variance_percentage > 0
                            ? "text-red-600"
                            : "text-green-600"
                        )}
                      >
                        {businessIntelligence.business_impact.budget_variance_percentage > 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {businessIntelligence.business_impact.budget_variance_percentage > 0 ? "Over" : "Under"} budget
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-indigo-50/50 dark:bg-indigo-950/15 rounded-lg border border-indigo-100/40 dark:border-indigo-900/20">
                      <div>
                        <div className="text-sm text-muted-foreground">YoY Change</div>
                        <div className="text-2xl font-bold">
                          {businessIntelligence.business_impact.yoy_cost_change_percentage.toFixed(1)}%
                        </div>
                      </div>
                      <div
                        className={cn(
                          "flex items-center gap-1 text-sm font-medium",
                          businessIntelligence.business_impact.yoy_cost_change_percentage > 0
                            ? "text-red-600"
                            : "text-green-600"
                        )}
                      >
                        {businessIntelligence.business_impact.yoy_cost_change_percentage > 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        vs last year
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-indigo-50/50 dark:bg-indigo-950/15 rounded-lg border border-indigo-100/40 dark:border-indigo-900/20">
                      <div>
                        <div className="text-sm text-muted-foreground">Projected Annual Cost</div>
                        <div className="text-2xl font-bold">
                          {formatCurrency(businessIntelligence.business_impact.projected_annual_waste_cost, defaultCurrency)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Target Progress */}
            {targetsSummary && (
              <Card>
                <CardHeader>
                  <CardTitle>Target Progress</CardTitle>
                  <CardDescription>Performance against goals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Cost Target</span>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(targetsSummary.total_current_cost, defaultCurrency)} /{" "}
                          {formatCurrency(targetsSummary.total_cost_limit, defaultCurrency)}
                        </span>
                      </div>
                      <ProgressIndicator
                        current={targetsSummary.total_current_cost}
                        target={targetsSummary.total_cost_limit}
                        status={kpis?.cost_target_status || "on_track"}
                        showPercentage
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Weight Target</span>
                        <span className="text-sm text-muted-foreground">
                          {targetsSummary.total_current_weight.toFixed(1)} kg / {targetsSummary.total_weight_limit.toFixed(1)} kg
                        </span>
                      </div>
                      <ProgressIndicator
                        current={targetsSummary.total_current_weight}
                        target={targetsSummary.total_weight_limit}
                        status="on_track"
                        showPercentage
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{targetsSummary.on_track_count}</div>
                        <div className="text-xs text-muted-foreground">On Track</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{targetsSummary.warning_count}</div>
                        <div className="text-xs text-muted-foreground">Warning</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{targetsSummary.exceeded_count}</div>
                        <div className="text-xs text-muted-foreground">Exceeded</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* AI Insights */}
          {insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  AI Insights
                </CardTitle>
                <CardDescription>Automated recommendations and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.map((insight) => (
                    <div
                      key={insight.title}
                      className={cn(
                        "p-4 rounded-lg border",
                        insight.type === "success" && "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900",
                        insight.type === "warning" && "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900",
                        insight.type === "alert" && "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900",
                        insight.type === "info" && "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium">{insight.title}</h4>
                            {insight.value && (
                              <Badge variant={getInsightBadgeVariant(insight.type)}>{insight.value}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                          {insight.action && (
                            <p className="text-sm font-medium text-primary">{insight.action}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card className="bg-gradient-to-br from-indigo-50/40 to-blue-50/20 dark:from-indigo-950/15 dark:to-blue-950/10 border-indigo-200/30 dark:border-indigo-800/20">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-4">
                <BarChart3 className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Advanced Analytics</h3>
              <p className="text-muted-foreground">Detailed analytical views coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="mt-6">
          <Card className="bg-gradient-to-br from-indigo-50/40 to-violet-50/20 dark:from-indigo-950/15 dark:to-violet-950/10 border-indigo-200/30 dark:border-indigo-800/20">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mb-4">
                <Activity className="h-8 w-8 text-violet-500 dark:text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Live Operations</h3>
              <p className="text-muted-foreground">Real-time operational monitoring coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
