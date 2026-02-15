export interface MealPeriodInfo {
  label: string;
  variant: "default" | "secondary" | "outline";
  icon: string;
}

export function getMealPeriodInfo(mealPeriod?: string): MealPeriodInfo {
  switch (mealPeriod) {
    case "BREAKFAST":
      return { label: "Breakfast", variant: "secondary", icon: "sunrise" };
    case "LUNCH":
      return { label: "Lunch", variant: "default", icon: "sun" };
    case "DINNER":
      return { label: "Dinner", variant: "outline", icon: "moon" };
    default:
      return { label: "Unknown", variant: "secondary", icon: "utensils" };
  }
}
