import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../services/api';
import { setDefaultCurrency, getDefaultCurrency } from '../utils/currency';

interface CurrencyContextType {
  defaultCurrency: string;
  isLoading: boolean;
  error: Error | null;
  updateDefaultCurrency: (currency: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: React.ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [defaultCurrency, setDefaultCurrencyState] = useState<string>(() => getDefaultCurrency());

  // Fetch currency settings from API
  const { data: currencySettings, isLoading, error } = useQuery({
    queryKey: ['currencySettings'],
    queryFn: settingsApi.getCurrencySettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Update local state and localStorage when API data changes
  useEffect(() => {
    if (currencySettings?.default_currency) {
      setDefaultCurrencyState(currencySettings.default_currency);
      setDefaultCurrency(currencySettings.default_currency);
    }
  }, [currencySettings]);

  const updateDefaultCurrency = (currency: string) => {
    setDefaultCurrencyState(currency);
    setDefaultCurrency(currency);
  };

  const contextValue: CurrencyContextType = {
    defaultCurrency,
    isLoading,
    error: error as Error | null,
    updateDefaultCurrency,
  };

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
};