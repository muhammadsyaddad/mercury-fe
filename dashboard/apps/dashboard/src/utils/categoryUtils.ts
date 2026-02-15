/**
 * Shared category utility functions for dashboard components
 */
import { FoodCategory } from "../types";

/**
 * Resolve a category string or FoodCategory enum to an uppercase key
 * for use in lookup maps. Handles "FoodCategory.X" prefixed values.
 */
const toCategoryKey = (category: FoodCategory | string): string => {
  const raw = typeof category === "string" ? category : String(category);
  if (raw.includes("FoodCategory.")) {
    return (raw.split(".")[1] ?? "").toUpperCase();
  }
  return raw.toUpperCase();
};

/**
 * Format category name for display
 */
export const formatCategoryName = (category: string): string => {
  if (!category || category.trim() === "") {
    return "Unknown";
  }
  const key = toCategoryKey(category);
  if (key === "NO_WASTE") return "No Waste";
  return key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
};

/**
 * Get normalized category from string
 */
export const getNormalizedCategory = (category: string): FoodCategory => {
  if (category.includes("FoodCategory.")) {
    const enumKey = category.split(".")[1];
    return (
      FoodCategory[enumKey as keyof typeof FoodCategory] ?? FoodCategory.OTHERS
    );
  }
  return category as FoodCategory;
};

/**
 * Get category hex color for display (e.g. charts, inline styles)
 */
export const getCategoryColor = (category: FoodCategory | string): string => {
  const colors: Record<string, string> = {
    [FoodCategory.PROTEIN]: "#ef4444",
    [FoodCategory.CARBOHYDRATE]: "#f59e0b",
    [FoodCategory.VEGETABLES]: "#10b981",
    [FoodCategory.FRUITS]: "#8b5cf6",
    [FoodCategory.PASTRY]: "#ec4899",
    [FoodCategory.OTHERS]: "#6b7280",
    [FoodCategory.NO_WASTE]: "#9ca3af",
  };
  const key = toCategoryKey(category);
  return colors[key] || "#6b7280";
};

/**
 * Get category Tailwind CSS classes for badges/labels
 */
export const getCategoryColorClass = (
  category: FoodCategory | string,
): string => {
  const classes: Record<string, string> = {
    [FoodCategory.PROTEIN]:
      "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200",
    [FoodCategory.CARBOHYDRATE]:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200",
    [FoodCategory.VEGETABLES]:
      "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200",
    [FoodCategory.FRUITS]:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200",
    [FoodCategory.PASTRY]:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200",
    [FoodCategory.OTHERS]:
      "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200",
    [FoodCategory.NO_WASTE]:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200",
  };
  const key = toCategoryKey(category);
  return classes[key] || "bg-gray-100 text-gray-800";
};

/**
 * Get category icon for display
 */
export const getCategoryIcon = (category: FoodCategory | string): string => {
  const icons: Record<string, string> = {
    [FoodCategory.PROTEIN]: "🥩",
    [FoodCategory.CARBOHYDRATE]: "🍞",
    [FoodCategory.VEGETABLES]: "🥬",
    [FoodCategory.FRUITS]: "🍎",
    [FoodCategory.PASTRY]: "🧁",
    [FoodCategory.OTHERS]: "🍽️",
    [FoodCategory.NO_WASTE]: "✅",
  };
  const key = toCategoryKey(category);
  return icons[key] || "🍽️";
};

/**
 * Check if category represents waste
 */
export const isWasteCategory = (category: FoodCategory): boolean => {
  return category !== FoodCategory.NO_WASTE;
};

/**
 * Get category display values for detection
 */
export const getCategoryDisplayValues = (detection: {
  corrected_category?: string | FoodCategory;
  category: string | FoodCategory;
}) => {
  const effectiveCategory = detection.corrected_category || detection.category;
  const normalizedCategory = getNormalizedCategory(effectiveCategory as string);

  return {
    category: formatCategoryName(effectiveCategory as string),
    normalizedCategory,
    color: getCategoryColor(normalizedCategory),
    icon: getCategoryIcon(normalizedCategory),
    isWaste: isWasteCategory(normalizedCategory),
  };
};
