"use client";

import { Card, CardContent } from "@vision_dashboard/ui/card";
import { cn } from "@vision_dashboard/ui/cn";
import { ArrowUp, ArrowDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  icon?: React.ReactNode;
  color?: "blue" | "green" | "red" | "yellow" | "purple" | "indigo";
  size?: "sm" | "md" | "lg";
}

const colorClasses = {
  blue: "from-blue-500 to-blue-600",
  green: "from-green-500 to-green-600",
  red: "from-red-500 to-red-600",
  yellow: "from-yellow-500 to-yellow-600",
  purple: "from-purple-500 to-purple-600",
  indigo: "from-indigo-500 to-indigo-600",
};

const sizeClasses = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const textSizes = {
  sm: { value: "text-2xl", title: "text-sm", subtitle: "text-xs" },
  md: { value: "text-3xl", title: "text-base", subtitle: "text-sm" },
  lg: { value: "text-4xl", title: "text-lg", subtitle: "text-base" },
};

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  color = "blue",
  size = "md",
}: KPICardProps) {
  return (
    <Card
      className={cn(
        "rounded-xl shadow-lg border border-border hover:shadow-xl transition-all duration-300",
        sizeClasses[size]
      )}
    >
      <CardContent className="p-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {icon && (
                <div
                  className={cn(
                    "p-2 rounded-lg bg-gradient-to-r text-white",
                    colorClasses[color]
                  )}
                >
                  {icon}
                </div>
              )}
              <h3
                className={cn(
                  "font-medium text-muted-foreground",
                  textSizes[size].title
                )}
              >
                {title}
              </h3>
            </div>

            <div
              className={cn(
                "font-bold text-foreground mb-1",
                textSizes[size].value
              )}
            >
              {typeof value === "number" ? value.toLocaleString() : value}
            </div>

            {subtitle && (
              <p
                className={cn("text-muted-foreground", textSizes[size].subtitle)}
              >
                {subtitle}
              </p>
            )}
          </div>

          {trend && trendValue && (
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                {
                  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400":
                    trend === "up",
                  "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400":
                    trend === "down",
                  "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400":
                    trend === "stable",
                }
              )}
            >
              {trend === "up" && <ArrowUp className="w-3 h-3" />}
              {trend === "down" && <ArrowDown className="w-3 h-3" />}
              {trendValue}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default KPICard;
