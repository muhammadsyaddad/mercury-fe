/**
 * Shared weight utility functions for consistent unit handling
 */

/**
 * Convert grams to kilograms with proper decimal places
 */
export const gramsToKg = (grams: number | null | undefined): number => {
  if (grams === null || grams === undefined || Number.isNaN(grams)) {
    return 0;
  }
  return grams / 1000;
};

/**
 * Convert kilograms to grams
 */
export const kgToGrams = (kg: number | null | undefined): number => {
  if (kg === null || kg === undefined || Number.isNaN(kg)) {
    return 0;
  }
  return kg * 1000;
};

/**
 * Format weight for display with appropriate unit
 */
export const formatWeight = (
  weight?: number | null,
  unit: "g" | "kg" = "kg",
  decimals = 2,
): string => {
  if (weight === undefined || weight === null || Number.isNaN(weight)) {
    return "N/A";
  }

  if (unit === "kg") {
    const weightInKg = typeof weight === "number" ? weight / 1000 : 0;
    return `${weightInKg.toFixed(decimals)}kg`;
  }
  return `${Math.round(weight)}g`;
};

/**
 * Format weight with smart unit selection (g for small amounts, kg for large)
 */
export const formatWeightSmart = (weightInGrams?: number | null): string => {
  if (
    weightInGrams === undefined ||
    weightInGrams === null ||
    Number.isNaN(weightInGrams)
  ) {
    return "N/A";
  }

  if (weightInGrams < 1000) {
    return `${Math.round(weightInGrams)}g`;
  }
  return `${(weightInGrams / 1000).toFixed(2)}kg`;
};

/**
 * Parse weight string to grams (handles both kg and g inputs)
 */
export const parseWeightToGrams = (weightStr: string | undefined): number => {
  if (!weightStr || weightStr.trim() === "") {
    return 0;
  }

  const cleanStr = weightStr.toLowerCase().trim();
  const numMatch = cleanStr.match(/(\d+\.?\d*)/);

  if (!numMatch) {
    return 0;
  }

  const num = Number.parseFloat(numMatch[1] ?? "0");

  if (cleanStr.includes("kg")) {
    return num * 1000; // Convert kg to grams
  }
  return num; // Assume grams if no unit specified
};

/**
 * Validate weight value (must be positive)
 */
export const isValidWeight = (
  weight: number | null | undefined,
): weight is number => {
  return (
    weight !== null &&
    weight !== undefined &&
    !Number.isNaN(weight) &&
    weight >= 0
  );
};

/**
 * Calculate weight statistics for an array of weights
 */
export const calculateWeightStats = (
  weights: (number | null | undefined)[],
): {
  total: number;
  average: number;
  min: number;
  max: number;
  count: number;
} => {
  const validWeights = weights.filter(isValidWeight);

  if (validWeights.length === 0) {
    return { total: 0, average: 0, min: 0, max: 0, count: 0 };
  }

  const total = validWeights.reduce((sum, weight) => sum + weight, 0);
  const average = total / validWeights.length;
  const min = Math.min(...validWeights);
  const max = Math.max(...validWeights);

  return {
    total,
    average,
    min,
    max,
    count: validWeights.length,
  };
};
