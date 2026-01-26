/**
 * Shared category utility functions for dashboard components
 */
import { FoodCategory } from '../types';

/**
 * Format category name for display
 */
export const formatCategoryName = (category: string): string => {
  if (!category || category.trim() === '') {
    return 'Unknown';
  }
  let cleanCategory = category;
  if (cleanCategory.includes('FoodCategory.')) {
    cleanCategory = cleanCategory.split('.')[1].toLowerCase();
  }
  return cleanCategory.charAt(0).toUpperCase() + cleanCategory.slice(1);
};

/**
 * Get normalized category from string
 */
export const getNormalizedCategory = (category: string): FoodCategory => {
  if (category.includes('FoodCategory.')) {
    const enumKey = category.split('.')[1];
    return FoodCategory[enumKey as keyof typeof FoodCategory];
  }
  return category as FoodCategory;
};

/**
 * Get category color for display
 */
export const getCategoryColor = (category: FoodCategory): string => {
  const colors = {
    [FoodCategory.PROTEIN]: '#ef4444',
    [FoodCategory.CARBOHYDRATE]: '#f59e0b',
    [FoodCategory.VEGETABLES]: '#10b981',
    [FoodCategory.FRUITS]: '#8b5cf6',
    [FoodCategory.PASTRY]: '#ec4899',
    [FoodCategory.OTHERS]: '#6b7280',
    [FoodCategory.NO_WASTE]: '#9ca3af'
  };
  return colors[category] || '#6b7280';
};

/**
 * Get category icon for display
 */
export const getCategoryIcon = (category: FoodCategory): string => {
  const icons = {
    [FoodCategory.PROTEIN]: '🥩',
    [FoodCategory.CARBOHYDRATE]: '🍞',
    [FoodCategory.VEGETABLES]: '🥬',
    [FoodCategory.FRUITS]: '🍎',
    [FoodCategory.PASTRY]: '🧁',
    [FoodCategory.OTHERS]: '🍽️',
    [FoodCategory.NO_WASTE]: '✅'
  };
  return icons[category] || '🍽️';
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
export const getCategoryDisplayValues = (detection: { corrected_category?: string | FoodCategory; category: string | FoodCategory }) => {
  const effectiveCategory = detection.corrected_category || detection.category;
  const normalizedCategory = getNormalizedCategory(effectiveCategory as string);
  
  return {
    category: formatCategoryName(effectiveCategory as string),
    normalizedCategory,
    color: getCategoryColor(normalizedCategory),
    icon: getCategoryIcon(normalizedCategory),
    isWaste: isWasteCategory(normalizedCategory)
  };
};
