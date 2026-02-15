import { Card, CardContent, CardHeader, CardTitle } from "@vision_dashboard/ui/card";
import { Badge } from "@vision_dashboard/ui/badge";
import {
  TrendingUp,
  Scale,
  DollarSign,
  BarChart3,
  Utensils,
} from "lucide-react";
import { formatCurrency } from "@/utils/currency";

interface RestaurantPerformanceKPIsData {
  has_restaurant_data: boolean;
  has_waste_data: boolean;
  data_coverage_percentage: number;
  waste_per_cover_kg: number;
  waste_per_cover_cost: number;
  total_covers: number;
  waste_value_per_fb_revenue_percentage: number;
  avg_fb_revenue_per_cover: number;
  total_fb_revenue: number;
  avg_covers_per_day: number;
  avg_waste_per_day_kg: number;
  avg_waste_cost_per_day: number;
}

interface RestaurantPerformanceCardProps {
  kpis: RestaurantPerformanceKPIsData;
  currency: string;
}

export function RestaurantPerformanceCard({
  kpis,
  currency,
}: RestaurantPerformanceCardProps) {
  if (!kpis.has_restaurant_data || !kpis.has_waste_data) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              Restaurant Performance
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Waste efficiency metrics ({kpis.data_coverage_percentage.toFixed(0)}% data coverage)
            </p>
          </div>
          {kpis.data_coverage_percentage < 80 && (
            <Badge variant="secondary">Limited data</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiTile
            label="Waste per Cover"
            value={
              kpis.waste_per_cover_kg > 0
                ? `${kpis.waste_per_cover_kg.toFixed(3)}kg`
                : "0.000kg"
            }
            detail={`${kpis.total_covers.toLocaleString()} total covers`}
            colorScheme="blue"
            icon={<Scale className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
          />
          <KpiTile
            label="Waste Cost per Cover"
            value={formatCurrency(kpis.waste_per_cover_cost, currency)}
            detail="Per diner waste cost"
            colorScheme="red"
            icon={<DollarSign className="w-4 h-4 text-red-600 dark:text-red-400" />}
          />
          <KpiTile
            label="Waste vs F&B Revenue"
            value={`${kpis.waste_value_per_fb_revenue_percentage.toFixed(2)}%`}
            detail="Of total F&B revenue"
            colorScheme="purple"
            icon={<BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
          />
          <KpiTile
            label="Avg Revenue per Cover"
            value={formatCurrency(kpis.avg_fb_revenue_per_cover, currency)}
            detail={`${formatCurrency(kpis.total_fb_revenue, currency)} total`}
            colorScheme="green"
            icon={<TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold">
              {kpis.avg_covers_per_day.toFixed(0)}
            </div>
            <div className="text-xs text-muted-foreground">Avg covers/day</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">
              {kpis.avg_waste_per_day_kg.toFixed(2)}kg
            </div>
            <div className="text-xs text-muted-foreground">Avg waste/day</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">
              {formatCurrency(kpis.avg_waste_cost_per_day, currency)}
            </div>
            <div className="text-xs text-muted-foreground">Avg waste cost/day</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const colorSchemes = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-100 dark:border-blue-900",
    label: "text-blue-800 dark:text-blue-200",
    value: "text-blue-900 dark:text-blue-100",
    detail: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-100 dark:border-red-900",
    label: "text-red-800 dark:text-red-200",
    value: "text-red-900 dark:text-red-100",
    detail: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-100 dark:bg-red-900",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-100 dark:border-purple-900",
    label: "text-purple-800 dark:text-purple-200",
    value: "text-purple-900 dark:text-purple-100",
    detail: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-100 dark:bg-purple-900",
  },
  green: {
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-100 dark:border-green-900",
    label: "text-green-800 dark:text-green-200",
    value: "text-green-900 dark:text-green-100",
    detail: "text-green-600 dark:text-green-400",
    iconBg: "bg-green-100 dark:bg-green-900",
  },
} as const;

function KpiTile({
  label,
  value,
  detail,
  colorScheme,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  colorScheme: keyof typeof colorSchemes;
  icon: React.ReactNode;
}) {
  const c = colorSchemes[colorScheme];

  return (
    <div className={`${c.bg} rounded-lg p-4 border ${c.border}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${c.label}`}>{label}</span>
        <div className={`w-8 h-8 ${c.iconBg} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className={`text-2xl font-bold ${c.value}`}>{value}</div>
      <div className={`text-xs ${c.detail} mt-1`}>{detail}</div>
    </div>
  );
}
