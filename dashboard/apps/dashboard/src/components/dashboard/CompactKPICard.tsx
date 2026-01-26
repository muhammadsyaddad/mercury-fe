"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@vision_dashboard/ui/card";
import { cn } from "@vision_dashboard/ui/cn";
import { DollarSign, Scale, BarChart3, TrendingUp, TrendingDown } from "lucide-react";

interface CompactKPICardProps {
  totalWasteCost: string;
  totalWasteWeight: string;
  avgCostPerKg: string;
  costPerDetection: string;
  costTrend?: "up" | "down" | "stable";
  costChangePercentage?: number;
  detectionCount?: number;
}

export function CompactKPICard({
  totalWasteCost,
  totalWasteWeight,
  avgCostPerKg,
  costPerDetection,
  costTrend,
  costChangePercentage,
  detectionCount,
}: CompactKPICardProps) {
  const getTrendIcon = () => {
    if (costTrend === "up") {
      return <TrendingUp className="w-4 h-4 text-red-500" />;
    }
    if (costTrend === "down") {
      return <TrendingDown className="w-4 h-4 text-green-500" />;
    }
    return null;
  };

  const getTrendColor = () => {
    if (costTrend === "up") return "text-red-600";
    if (costTrend === "down") return "text-green-600";
    return "text-muted-foreground";
  };

  return (
    <Card className="rounded-xl shadow-sm border border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Key Performance Metrics
          </CardTitle>
          {costTrend && costChangePercentage !== undefined && (
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              <span className={cn("text-sm font-medium", getTrendColor())}>
                {Math.abs(costChangePercentage).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Waste Cost */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <div className="p-2 bg-blue-500 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Total Cost
              </div>
              <div className="text-lg font-bold text-blue-900 dark:text-blue-100 truncate">
                {totalWasteCost}
              </div>
            </div>
          </div>

          {/* Total Waste Weight */}
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <div className="p-2 bg-green-500 rounded-lg">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                Total Weight
              </div>
              <div className="text-lg font-bold text-green-900 dark:text-green-100 truncate">
                {totalWasteWeight}
              </div>
              {detectionCount !== undefined && (
                <div className="text-xs text-green-600 dark:text-green-400">
                  {detectionCount} detections
                </div>
              )}
            </div>
          </div>

          {/* Average Cost per KG */}
          <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
            <div className="p-2 bg-purple-500 rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                Avg Cost/KG
              </div>
              <div className="text-lg font-bold text-purple-900 dark:text-purple-100 truncate">
                {avgCostPerKg}
              </div>
            </div>
          </div>

          {/* Cost per Detection */}
          <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
            <div className="p-2 bg-indigo-500 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                Cost/Detection
              </div>
              <div className="text-lg font-bold text-indigo-900 dark:text-indigo-100 truncate">
                {costPerDetection}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CompactKPICard;
