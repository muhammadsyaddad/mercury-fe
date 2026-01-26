import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  CogIcon,
  CurrencyDollarIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { settingsApi } from '../services/api';
import { useCurrency } from '../contexts/CurrencyContext';

interface CurrencySettings {
  default_currency: string;
  supported_currencies: string[];
}

interface CurrencyUpdateForm {
  default_currency: string;
}

const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const { defaultCurrency, updateDefaultCurrency } = useCurrency();
  
  // Fetch currency settings
  const { data: currencySettings, isLoading, error } = useQuery<CurrencySettings>({
    queryKey: ['currencySettings'],
    queryFn: settingsApi.getCurrencySettings,
  });

  // Form handling
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CurrencyUpdateForm>();

  // Update currency mutation
  const updateCurrencyMutation = useMutation({
    mutationFn: settingsApi.updateCurrencySettings,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['currencySettings'] });
      updateDefaultCurrency(data.default_currency);
      toast.success('Currency settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update currency settings');
    },
  });

  // Form submission
  const onSubmit = (data: CurrencyUpdateForm) => {
    updateCurrencyMutation.mutate(data);
  };

  React.useEffect(() => {
    if (currencySettings) {
      reset({
        default_currency: currencySettings.default_currency
      });
    }
  }, [currencySettings, reset]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Settings</h3>
          <p className="text-gray-600">Failed to load system settings. Please try again.</p>
        </div>
      </div>
    );
  }

  const currencyOptions = [
    { code: 'IDR', name: 'Indonesian Rupiah (IDR)', symbol: 'Rp' },
    { code: 'USD', name: 'US Dollar (USD)', symbol: '$' },
    { code: 'EUR', name: 'Euro (EUR)', symbol: '€' },
    { code: 'GBP', name: 'British Pound (GBP)', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen (JPY)', symbol: '¥' },
    { code: 'AUD', name: 'Australian Dollar (AUD)', symbol: 'A$' },
    { code: 'CAD', name: 'Canadian Dollar (CAD)', symbol: 'C$' },
    { code: 'SGD', name: 'Singapore Dollar (SGD)', symbol: 'S$' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CogIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
              <p className="text-gray-600 mt-1">
                Configure system-wide settings and preferences
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Currency Settings Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Currency Settings</h2>
                <p className="text-sm text-gray-600">Configure the default currency for price display</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Current Default Currency */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckIcon className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Current Default Currency</span>
                </div>
                <p className="text-blue-800 mt-1">
                  {currencyOptions.find(opt => opt.code === currencySettings?.default_currency)?.name || currencySettings?.default_currency}
                </p>
              </div>

              {/* Default Currency Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Currency
                </label>
                <select
                  {...register('default_currency', { required: 'Please select a default currency' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {currencyOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.name} ({option.symbol})
                    </option>
                  ))}
                </select>
                {errors.default_currency && (
                  <p className="text-red-500 text-sm mt-1">{errors.default_currency.message}</p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  This currency will be used as the default for all price displays and calculations throughout the system.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updateCurrencyMutation.isPending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {updateCurrencyMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      Update Currency Settings
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How Currency Settings Work</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Global Default</h4>
                <p className="text-sm text-gray-600">
                  The selected currency becomes the system-wide default for all price displays and new price entries.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Existing Prices</h4>
                <p className="text-sm text-gray-600">
                  Existing price entries maintain their original currency. The system will display them in their respective currencies.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900">New Entries</h4>
                <p className="text-sm text-gray-600">
                  New food prices and calculations will use the default currency as the starting point.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Supported Currencies */}
        <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Supported Currencies</h3>
            <p className="text-sm text-gray-600">Currently supported currencies in the system</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currencyOptions.map((currency) => (
                <div
                  key={currency.code}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    currency.code === currencySettings?.default_currency
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">{currency.code}</span>
                      <p className="text-sm text-gray-600">{currency.name.split('(')[0].trim()}</p>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{currency.symbol}</span>
                  </div>
                  {currency.code === currencySettings?.default_currency && (
                    <div className="mt-2 flex items-center gap-1">
                      <CheckIcon className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-600">Default</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;