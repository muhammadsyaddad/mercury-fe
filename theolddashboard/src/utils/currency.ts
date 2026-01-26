/**
 * Currency formatting utilities
 */

export const formatRupiah = (value: number): string => {
  // Format as Rupiah with dots as thousand separators
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace('IDR', 'Rp').replace(/\s+/g, ' ');
};

// Currency configuration with locale preferences
export const currencyConfig: Record<string, { locale: string; symbol?: string; fractionDigits?: number }> = {
  'IDR': { locale: 'id-ID', symbol: 'Rp', fractionDigits: 0 },
  'USD': { locale: 'en-US', fractionDigits: 2 },
  'EUR': { locale: 'de-DE', fractionDigits: 2 },
  'GBP': { locale: 'en-GB', fractionDigits: 2 },
  'JPY': { locale: 'ja-JP', fractionDigits: 0 },
  'AUD': { locale: 'en-AU', fractionDigits: 2 },
  'CAD': { locale: 'en-CA', fractionDigits: 2 },
  'SGD': { locale: 'en-SG', fractionDigits: 2 },
};

export const formatCurrency = (value: number, currency: string = 'IDR'): string => {
  // Handle special cases for IDR
  if (currency === 'IDR' || currency === 'RP' || currency === 'RUPIAH') {
    return formatRupiah(value);
  }
  
  // Use currency configuration
  const config = currencyConfig[currency];
  if (config) {
    const formatted = new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: config.fractionDigits || 2,
      maximumFractionDigits: config.fractionDigits || 2,
    }).format(value);
    
    // Apply custom symbol if available
    if (config.symbol) {
      return formatted.replace(currency, config.symbol);
    }
    
    return formatted;
  }
  
  // Fallback to default formatting
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: currency === 'RP' ? 'IDR' : currency 
  }).format(value);
};

export const formatNumber = (value: number, locale: string = 'id-ID'): string => {
  // Format numbers with appropriate thousand separators
  return new Intl.NumberFormat(locale).format(value);
};

// Get default currency from global state or localStorage
export const getDefaultCurrency = (): string => {
  // Try to get from localStorage first (cached from API)
  const cached = localStorage.getItem('defaultCurrency');
  if (cached) {
    return cached;
  }
  
  // Fallback to IDR
  return 'IDR';
};

// Set default currency in localStorage
export const setDefaultCurrency = (currency: string): void => {
  localStorage.setItem('defaultCurrency', currency);
};

// Format currency using the global default if no currency specified
export const formatCurrencyDefault = (value: number, currency?: string): string => {
  const defaultCurrency = currency || getDefaultCurrency();
  return formatCurrency(value, defaultCurrency);
};