"use client";

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { settingsApi } from '@/services/api';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@vision_dashboard/ui/card";
import { Button } from "@vision_dashboard/ui/button";
import { Label } from "@vision_dashboard/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@vision_dashboard/ui/select";
import { Spinner } from "@vision_dashboard/ui/spinner";
import { Settings, DollarSign, Check, AlertTriangle } from 'lucide-react';

interface CurrencySettings {
  default_currency: string;
  supported_currencies: string[];
}

interface CurrencyUpdateForm {
  default_currency: string;
}

const currencyOptions = [
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { updateDefaultCurrency } = useCurrency();
  
  // Fetch currency settings (with fallback for when API is not available)
  const { data: currencySettings, isLoading, error } = useQuery<CurrencySettings>({
    queryKey: ['currencySettings'],
    queryFn: async () => {
      try {
        return await settingsApi.getCurrencySettings();
      } catch {
        // Return default settings if API endpoint doesn't exist yet
        return {
          default_currency: 'USD',
          supported_currencies: currencyOptions.map(c => c.code),
        };
      }
    },
  });

  // Form handling
  const { handleSubmit, reset, setValue, watch } = useForm<CurrencyUpdateForm>();
  const selectedCurrency = watch('default_currency');

  // Update currency mutation
  const updateCurrencyMutation = useMutation({
    mutationFn: settingsApi.updateCurrencySettings,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['currencySettings'] });
      updateDefaultCurrency(data.default_currency);
      toast.success('Currency settings updated successfully');
    },
    onError: () => {
      toast.error('Failed to update currency settings');
    },
  });

  // Form submission
  const onSubmit = (data: CurrencyUpdateForm) => {
    updateCurrencyMutation.mutate(data);
  };

  useEffect(() => {
    if (currencySettings) {
      reset({
        default_currency: currencySettings.default_currency
      });
    }
  }, [currencySettings, reset]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Spinner className="h-12 w-12 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Settings</h3>
          <p className="text-muted-foreground">Failed to load system settings. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">Configure system-wide settings and preferences</p>
        </div>
      </div>

      {/* Currency Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle>Currency Settings</CardTitle>
              <CardDescription>Configure the default currency for price display</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Current Default Currency */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Current Default Currency</span>
              </div>
              <p className="text-blue-800 dark:text-blue-200 mt-1">
                {currencyOptions.find(opt => opt.code === currencySettings?.default_currency)?.name || currencySettings?.default_currency}
              </p>
            </div>

            {/* Default Currency Selection */}
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Select 
                value={selectedCurrency} 
                onValueChange={(value) => setValue('default_currency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map((option) => (
                    <SelectItem key={option.code} value={option.code}>
                      {option.name} ({option.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                This currency will be used as the default for all price displays and calculations throughout the system.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateCurrencyMutation.isPending}
              >
                {updateCurrencyMutation.isPending ? (
                  <>
                    <Spinner className="h-4 w-4 mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Update Currency Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle>How Currency Settings Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0 mt-0.5">
              1
            </div>
            <div>
              <h4 className="font-medium">Global Default</h4>
              <p className="text-sm text-muted-foreground">
                The selected currency becomes the system-wide default for all price displays and new price entries.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0 mt-0.5">
              2
            </div>
            <div>
              <h4 className="font-medium">Existing Prices</h4>
              <p className="text-sm text-muted-foreground">
                Existing price entries maintain their original currency. The system will display them in their respective currencies.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0 mt-0.5">
              3
            </div>
            <div>
              <h4 className="font-medium">New Entries</h4>
              <p className="text-sm text-muted-foreground">
                New food prices and calculations will use the default currency as the starting point.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supported Currencies */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Currencies</CardTitle>
          <CardDescription>Currently supported currencies in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {currencyOptions.map((currency) => (
              <div
                key={currency.code}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  currency.code === currencySettings?.default_currency
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{currency.code}</span>
                    <p className="text-sm text-muted-foreground">{currency.name}</p>
                  </div>
                  <span className="text-lg font-bold">{currency.symbol}</span>
                </div>
                {currency.code === currencySettings?.default_currency && (
                  <div className="mt-2 flex items-center gap-1">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-primary">Default</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
