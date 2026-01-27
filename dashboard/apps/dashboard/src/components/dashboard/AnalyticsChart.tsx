"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@vision_dashboard/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@vision_dashboard/ui/chart";
import { cn } from "@vision_dashboard/ui/cn";
import { formatCurrencyDefault } from "@/utils/currency";

interface ChartProps {
  data: Record<string, unknown>[];
  type: "line" | "bar" | "pie" | "area" | "dual-area" | "dual-bar";
  title?: string;
  subtitle?: string;
  height?: number;
  color?: string;
  colors?: string[];
  dataKey?: string;
  secondaryDataKey?: string;
  xAxisKey?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  className?: string;
  valueType?: "currency" | "weight" | "count" | "percentage";
  secondaryValueType?: "currency" | "weight" | "count" | "percentage";
  secondaryColor?: string;
}

const DEFAULT_COLORS = [
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // yellow
  "#EF4444", // red
  "#8B5CF6", // purple
  "#06B6D4", // cyan
  "#F97316", // orange
  "#84CC16", // lime
];

export function AnalyticsChart({
  data,
  type,
  title,
  subtitle,
  height = 300,
  color = "#3B82F6",
  colors = DEFAULT_COLORS,
  dataKey = "value",
  secondaryDataKey,
  xAxisKey = "name",
  showLegend = true,
  showGrid = true,
  className,
  valueType = "currency",
  secondaryValueType = "weight",
  secondaryColor = "#F59E0B",
}: ChartProps) {
  const formatValue = (
    value: number,
    type: "currency" | "weight" | "count" | "percentage" = valueType
  ) => {
    switch (type) {
      case "weight":
        if (value >= 1000) {
          return `${(value / 1000).toFixed(1)}t`;
        }
        return `${value.toFixed(1)}`;

      case "count":
        if (value >= 1000000) {
          return `${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 1000) {
          return `${(value / 1000).toFixed(1)}K`;
        }
        return value.toString();

      case "percentage":
        return `${value.toFixed(1)}%`;

      default:
        if (value >= 1000000) {
          return `${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 1000) {
          return `${(value / 1000).toFixed(1)}K`;
        }
        return value.toFixed(0);
    }
  };

  const formatTooltipValue = (
    value: number,
    type: "currency" | "weight" | "count" | "percentage" = valueType
  ) => {
    switch (type) {
      case "weight":
        if (value >= 1000) {
          return `${(value / 1000).toFixed(1)}t`;
        }
        return `${value.toFixed(1)}kg`;

      case "count":
        if (value >= 1000000) {
          return `${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 1000) {
          return `${(value / 1000).toFixed(1)}K`;
        }
        return value.toString();

      case "percentage":
        return `${value.toFixed(1)}%`;

      default:
        return formatCurrencyDefault(value);
    }
  };

  const formatTooltip = (value: unknown, name: string | number): [string, string] => {
    if (typeof value === "number") {
      const type = String(name) === secondaryDataKey ? secondaryValueType : valueType;
      return [
        formatTooltipValue(value, type),
        String(name) === "cost" ? "Cost" : String(name) === "weight" ? "Weight" : String(name),
      ];
    }
    return [String(value), String(name)];
  };

  // Create chart config for the ChartContainer
  const chartConfig: ChartConfig = {
    [dataKey]: {
      label: dataKey.charAt(0).toUpperCase() + dataKey.slice(1),
      color: color,
    },
  };

  if (secondaryDataKey) {
    chartConfig[secondaryDataKey] = {
      label: secondaryDataKey.charAt(0).toUpperCase() + secondaryDataKey.slice(1),
      color: secondaryColor,
    };
  }

  const renderChart = () => {
    switch (type) {
      case "line":
        return (
          <LineChart data={data}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            )}
            <XAxis
              dataKey={xAxisKey}
              className="text-muted-foreground"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              interval={0}
              height={60}
            />
            <YAxis
              className="text-muted-foreground"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatValue(value)}
            />
            <ChartTooltip
              content={<ChartTooltipContent formatter={formatTooltip} />}
            />
            {showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={3}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
            />
          </LineChart>
        );

      case "area":
        return (
          <AreaChart data={data}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            )}
            <XAxis
              dataKey={xAxisKey}
              className="text-muted-foreground"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              interval={0}
              height={60}
            />
            <YAxis
              className="text-muted-foreground"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatValue(value)}
            />
            <ChartTooltip
              content={<ChartTooltipContent formatter={formatTooltip} />}
            />
            {showLegend && <Legend />}
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorGradient)"
            />
          </AreaChart>
        );

      case "bar":
        return (
          <BarChart data={data}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            )}
            <XAxis
              dataKey={xAxisKey}
              className="text-muted-foreground"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              interval={0}
              height={60}
            />
            <YAxis
              className="text-muted-foreground"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatValue(value)}
            />
            <ChartTooltip
              content={<ChartTooltipContent formatter={formatTooltip} />}
            />
            {showLegend && <Legend />}
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case "dual-area":
        return (
          <AreaChart data={data}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            )}
            <XAxis
              dataKey={xAxisKey}
              className="text-muted-foreground"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              interval={0}
              height={60}
            />
            <YAxis
              yAxisId="left"
              className="text-muted-foreground"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatValue(value, valueType)}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              className="text-muted-foreground"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                formatValue(value, secondaryValueType || "weight")
              }
            />
            <ChartTooltip
              content={<ChartTooltipContent formatter={formatTooltip} />}
            />
            {showLegend && <Legend />}
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient
                id="secondaryColorGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={secondaryColor} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <Area
              yAxisId="left"
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorGradient)"
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey={secondaryDataKey || "weight"}
              stroke={secondaryColor}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#secondaryColorGradient)"
            />
          </AreaChart>
        );

      case "dual-bar":
        return (
          <BarChart data={data}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            )}
            <XAxis
              dataKey={xAxisKey}
              className="text-muted-foreground"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              interval={0}
              height={60}
            />
            <YAxis
              yAxisId="left"
              className="text-muted-foreground"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatValue(value, valueType)}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              className="text-muted-foreground"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                formatValue(value, secondaryValueType || "weight")
              }
            />
            <ChartTooltip
              content={<ChartTooltipContent formatter={formatTooltip} />}
            />
            {showLegend && <Legend />}
            <Bar
              yAxisId="left"
              dataKey={dataKey}
              fill={color}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              yAxisId="right"
              dataKey={secondaryDataKey || "weight"}
              fill={secondaryColor}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );

      case "pie":
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${String(entry[xAxisKey] || index)}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={formatTooltip} />
            {showLegend && <Legend />}
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={cn("rounded-xl shadow-lg border border-border", className)}>
      {(title || subtitle) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <ChartContainer config={chartConfig} className={`h-[${height}px]`}>
          {renderChart() || <div>Chart type not supported</div>}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default AnalyticsChart;
