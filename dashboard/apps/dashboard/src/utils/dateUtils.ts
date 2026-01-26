/**
 * Get today's date in YYYY-MM-DD format using local time (not UTC)
 * This ensures we get the correct date in the user's timezone
 */
export const getTodayLocalDate = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
};

/**
 * Format a date to YYYY-MM-DD using local time
 */
export const formatLocalDate = (date: Date): string => {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

/**
 * Calculate current month days (including today)
 */
export const getCurrentMonthDays = (): number => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysSinceMonthStart = Math.floor((now.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceMonthStart + 1; // Add 1 to include current day
};

/**
 * Get display text for active filter period
 */
export const getFilterDisplayText = (period: number): string => {
  const currentMonthDays = getCurrentMonthDays();
  const now = new Date();
  
  if (period === currentMonthDays) {
    return `${now.toLocaleDateString('en-US', { month: 'long' })} ${now.getFullYear()}`;
  }
  if (period === 7) {
    return 'Last 7 Days';
  }
  if (period === 30) {
    return 'Last 30 Days';
  }
  if (period === 90) {
    return 'Last 90 Days';
  }
  if (period === 365) {
    return `${now.getFullYear()}`;
  }
  return `Last ${period} Days`;
};

/**
 * Calculate days since year start
 */
export const getDaysSinceYearStart = (): number => {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  return Math.ceil((now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * Format date for display in charts
 */
export const formatChartDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Check if two dates are in the same month
 */
export const isSameMonth = (date1: Date, date2: Date): boolean => {
  return date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
};

/**
 * Get month name from month number (1-12)
 */
export const getMonthName = (monthNumber: number): string => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[monthNumber - 1] || 'Unknown';
};
