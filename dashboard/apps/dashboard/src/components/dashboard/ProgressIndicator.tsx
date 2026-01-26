"use client";

import { Card, CardContent } from "@vision_dashboard/ui/card";
import { Progress } from "@vision_dashboard/ui/progress";
import { cn } from "@vision_dashboard/ui/cn";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { formatCurrency } from "@/utils/currency";

interface ProgressIndicatorProps {
  title: string;
  current: number;
  target: number;
  unit?: string;
  format?: "number" | "currency" | "percentage";
  status?: "on_track" | "warning" | "exceeded";
  showDetails?: boolean;
  className?: string;
}

export function ProgressIndicator({
  title,
  current,
  target,
  unit = "",
  format = "number",
  status,
  showDetails = true,
  className,
}: ProgressIndicatorProps) {
  const percentage = Math.min((current / target) * 100, 100);

  // Determine status if not provided
  const calculatedStatus =
    status ||
    (() => {
      if (percentage >= 100) return "exceeded";
      if (percentage >= 80) return "warning";
      return "on_track";
    })();

  const formatValue = (value: number) => {
    switch (format) {
      case "currency":
        return formatCurrency(value);
      case "percentage":
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  };

  const statusConfig = {
    on_track: {
      color: "bg-green-500",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      textColor: "text-green-800 dark:text-green-400",
      icon: CheckCircle,
      label: "On Track",
    },
    warning: {
      color: "bg-yellow-500",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
      textColor: "text-yellow-800 dark:text-yellow-400",
      icon: AlertTriangle,
      label: "Warning",
    },
    exceeded: {
      color: "bg-red-500",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      textColor: "text-red-800 dark:text-red-400",
      icon: XCircle,
      label: "Exceeded",
    },
  };

  const config = statusConfig[calculatedStatus];
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        "rounded-xl shadow-lg border border-border",
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {title}
            </h3>
            {showDetails && (
              <div className="text-sm text-muted-foreground">
                {formatValue(current)} of {formatValue(target)} {unit}
              </div>
            )}
          </div>

          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium",
              config.bgColor,
              config.textColor
            )}
          >
            <Icon className="w-4 h-4" />
            {config.label}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <Progress
            value={Math.min(percentage, 100)}
            className={cn("h-3 mb-2", {
              "[&>div]:bg-green-500": calculatedStatus === "on_track",
              "[&>div]:bg-yellow-500": calculatedStatus === "warning",
              "[&>div]:bg-red-500": calculatedStatus === "exceeded",
            })}
          />

          {/* Percentage Label */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {percentage.toFixed(1)}% used
            </span>
            <span className="font-medium text-foreground">
              {Math.max(target - current, 0) > 0 ? (
                <>
                  {formatValue(Math.max(target - current, 0))} {unit} remaining
                </>
              ) : (
                <>
                  {formatValue(current - target)} {unit} over target
                </>
              )}
            </span>
          </div>
        </div>

        {/* Additional Details */}
        {showDetails && percentage > 100 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-red-800 dark:text-red-400">
                Target exceeded by {formatValue(current - target)} {unit}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ProgressIndicator;
