"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { 
  foodPricesApi, 
  financialAnalyticsApi, 
  systemSettingsApi,
  type FoodPrice, 
  type CreateFoodPrice,
  type DefaultPriceSettings 
} from '@/services/financialApi';
import { apiService } from '@/services/api';
import { formatCurrency } from '@/utils/currency';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@vision_dashboard/ui/card";
import { Button } from "@vision_dashboard/ui/button";
import { Input } from "@vision_dashboard/ui/input";
import { Label } from "@vision_dashboard/ui/label";
import { Switch } from "@vision_dashboard/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@vision_dashboard/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@vision_dashboard/ui/select";
import { Spinner } from "@vision_dashboard/ui/spinner";
import { Plus, Pencil, Trash2, DollarSign, Tag, Sparkles, Settings } from 'lucide-react';

interface CreateFoodPriceForm {
  price_type: 'CATEGORY' | 'ITEM';
  category?: string;
  item_name?: string;
  price_per_kg: number;
  currency?: string;
  is_active?: boolean;
}

export default function PricingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<FoodPrice | null>(null);
  const [selectedPriceType, setSelectedPriceType] = useState<'CATEGORY' | 'ITEM'>('CATEGORY');
  const [isDefaultPriceModalOpen, setIsDefaultPriceModalOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { defaultCurrency } = useCurrency();

  // Fetch food prices
  const { data: pricesData, isLoading } = useQuery({
    queryKey: ['foodPrices'],
    queryFn: () => foodPricesApi.getFoodPrices({ limit: 100, active_only: false }),
    staleTime: 0,
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['foodCategories'],
    queryFn: foodPricesApi.getCategories,
  });

  // Fetch default price settings
  const { data: defaultPriceSettings } = useQuery({
    queryKey: ['defaultPriceSettings'],
    queryFn: systemSettingsApi.getDefaultPriceSettings,
  });

  // Fetch menu items for the dropdown
  const { data: menuItems } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => apiService.getActiveMenuItems(),
  });

  // Form handling
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CreateFoodPriceForm>();
  const watchPriceType = watch('price_type', selectedPriceType);
  const watchIsActive = watch('is_active', true);

  // Default price form handling
  const { register: registerDefault, handleSubmit: handleSubmitDefault, reset: resetDefault, formState: { errors: errorsDefault } } = useForm<{default_price_per_kg: number}>();

  // Mutations
  const createMutation = useMutation({
    mutationFn: foodPricesApi.createFoodPrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodPrices'] });
      toast.success('Price created successfully');
      closeModal();
    },
    onError: () => {
      toast.error('Failed to create price');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateFoodPrice }) =>
      foodPricesApi.updateFoodPrice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodPrices'] });
      toast.success('Price updated successfully');
      closeModal();
    },
    onError: () => {
      toast.error('Failed to update price');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: foodPricesApi.deleteFoodPrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodPrices'] });
      toast.success('Price deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete price');
    },
  });

  const recalculateMutation = useMutation({
    mutationFn: () => financialAnalyticsApi.recalculateAllCosts(),
    onSuccess: (data) => {
      toast.success(`Recalculated costs for ${data.updated_count} detections`);
      queryClient.invalidateQueries({ queryKey: ['executiveDashboard'] });
    },
    onError: () => {
      toast.error('Failed to recalculate costs');
    },
  });

  const updateDefaultPriceMutation = useMutation({
    mutationFn: systemSettingsApi.updateDefaultPriceSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defaultPriceSettings'] });
      toast.success('Default price settings updated successfully');
      setIsDefaultPriceModalOpen(false);
    },
    onError: () => {
      toast.error('Failed to update default price settings');
    },
  });

  // Modal handlers
  const openModal = (price?: FoodPrice) => {
    if (price) {
      setEditingPrice(price);
      reset({
        price_type: price.price_type.toUpperCase() as 'CATEGORY' | 'ITEM',
        category: price.category,
        item_name: price.item_name || undefined,
        price_per_kg: price.price_per_kg,
        currency: price.currency,
        is_active: price.is_active,
      });
      setSelectedPriceType(price.price_type.toUpperCase() as 'CATEGORY' | 'ITEM');
    } else {
      setEditingPrice(null);
      reset({
        price_type: 'CATEGORY',
        currency: defaultCurrency,
        is_active: true,
      });
      setSelectedPriceType('CATEGORY');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPrice(null);
    reset();
  };

  const openDefaultPriceModal = () => {
    if (defaultPriceSettings) {
      resetDefault({
        default_price_per_kg: defaultPriceSettings.default_price_per_kg,
      });
    }
    setIsDefaultPriceModalOpen(true);
  };

  // Form submission
  const onSubmit = (data: CreateFoodPriceForm) => {
    const cleanData = { ...data };
    if (data.price_type === 'CATEGORY') {
      cleanData.item_name = undefined;
    } else if (data.price_type === 'ITEM') {
      cleanData.category = undefined;
    }
    
    const apiData: CreateFoodPrice = {
      ...cleanData,
      price_per_kg: Number(cleanData.price_per_kg),
      price_type: cleanData.price_type.toLowerCase() as 'category' | 'item'
    };
    
    if (editingPrice) {
      updateMutation.mutate({ id: editingPrice.id, data: apiData });
    } else {
      createMutation.mutate(apiData);
    }
  };

  // Default price form submission
  const onSubmitDefaultPrice = (data: {default_price_per_kg: number}) => {
    const updateData: DefaultPriceSettings = {
      default_price_per_kg: data.default_price_per_kg,
      default_currency: defaultPriceSettings?.default_currency || defaultCurrency
    };
    updateDefaultPriceMutation.mutate(updateData);
  };

  // Delete handler
  const handleDelete = (price: FoodPrice) => {
    if (window.confirm('Are you sure you want to delete this price? This action cannot be undone.')) {
      deleteMutation.mutate(price.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Spinner className="h-12 w-12 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading pricing data...</p>
        </div>
      </div>
    );
  }

  const prices = pricesData?.items || [];
  const categoryPrices = prices.filter((p: FoodPrice) => p.price_type.toUpperCase() === 'CATEGORY');
  const itemPrices = prices.filter((p: FoodPrice) => p.price_type.toUpperCase() === 'ITEM');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 via-green-50/80 to-teal-50/60 dark:from-emerald-950/40 dark:via-green-950/30 dark:to-teal-950/20 rounded-xl p-6 border border-emerald-200/60 dark:border-emerald-800/40">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center ring-1 ring-emerald-200 dark:ring-emerald-800">
            <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">Pricing Management</h1>
            <p className="text-emerald-700/70 dark:text-emerald-300/70">Configure food waste pricing for accurate cost calculations</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={openDefaultPriceModal}>
            <Settings className="h-4 w-4 mr-2" />
            Default Settings
          </Button>
          
          <Button 
            variant="secondary"
            onClick={() => recalculateMutation.mutate()}
            disabled={recalculateMutation.isPending}
          >
            {recalculateMutation.isPending ? (
              <Spinner className="h-4 w-4 mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Recalculate Costs
          </Button>
          
          <Button onClick={() => openModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Price
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Prices */}
        <Card className="border-blue-200/40 dark:border-blue-800/30">
          <CardHeader className="bg-gradient-to-r from-blue-50/60 via-sky-50/40 to-transparent dark:from-blue-950/20 dark:via-sky-950/10 dark:to-transparent border-b border-blue-200/30 dark:border-blue-800/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Tag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>Category Pricing</CardTitle>
                <CardDescription>Default prices for food categories</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {categoryPrices.length === 0 ? (
              <div className="text-center py-8">
                <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Category Prices</h3>
                <p className="text-muted-foreground text-sm mb-4">Set up default pricing for food categories</p>
                <Button onClick={() => openModal()}>
                  Add Category Price
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {categoryPrices.map((price: FoodPrice) => (
                  <div key={price.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between">
                    <div>
                      <div className="font-medium capitalize">
                        {price.category?.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(price.price_per_kg, price.currency)} per kg
                      </div>
                      {!price.is_active && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive mt-1">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openModal(price)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(price)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Menu/Item-Specific Prices */}
        <Card className="border-green-200/40 dark:border-green-800/30">
          <CardHeader className="bg-gradient-to-r from-green-50/60 via-emerald-50/40 to-transparent dark:from-green-950/20 dark:via-emerald-950/10 dark:to-transparent border-b border-green-200/30 dark:border-green-800/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle>Menu/Item-Specific Pricing</CardTitle>
                <CardDescription>Custom prices for specific menu items</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {itemPrices.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Menu Item Prices</h3>
                <p className="text-muted-foreground text-sm mb-4">Create specific pricing for individual menu items</p>
                <Button 
                  variant="secondary"
                  onClick={() => {
                    setSelectedPriceType('ITEM');
                    openModal();
                  }}
                >
                  Add Menu Item Price
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {itemPrices.map((price: FoodPrice) => (
                  <div key={price.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {price.item_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(price.price_per_kg, price.currency)} per kg
                      </div>
                      {!price.is_active && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive mt-1">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openModal(price)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(price)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* How it Works */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800">
        <CardHeader>
          <CardTitle className="text-emerald-900 dark:text-emerald-100">How Pricing Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-600 dark:bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
                1
              </div>
              <h4 className="font-medium mb-2 text-emerald-900 dark:text-emerald-100">Menu/Item-Specific First</h4>
              <p className="text-sm text-emerald-700/70 dark:text-emerald-300/70">
                System first looks for specific menu item pricing (e.g., &quot;nasi goreng&quot; = $5/kg)
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-600 dark:bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
                2
              </div>
              <h4 className="font-medium mb-2 text-emerald-900 dark:text-emerald-100">Category Fallback</h4>
              <p className="text-sm text-emerald-700/70 dark:text-emerald-300/70">
                If no item price found, uses category pricing (e.g., &quot;fruits&quot; = $3/kg)
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-600 dark:bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
                3
              </div>
              <h4 className="font-medium mb-2 text-emerald-900 dark:text-emerald-100">Default Price</h4>
              <p className="text-sm text-emerald-700/70 dark:text-emerald-300/70">
                If neither available, uses configurable default price ({defaultPriceSettings ? formatCurrency(defaultPriceSettings.default_price_per_kg, defaultPriceSettings.default_currency) : '$1.00'}/kg)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal for Creating/Editing Prices */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPrice ? 'Edit Price' : 'Add New Price'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Price Type */}
            <div className="space-y-2">
              <Label>Price Type</Label>
              <Select 
                value={watchPriceType} 
                onValueChange={(value: 'CATEGORY' | 'ITEM') => {
                  setSelectedPriceType(value);
                  setValue('price_type', value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select price type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CATEGORY">Category Price</SelectItem>
                  <SelectItem value="ITEM">Menu/Item-Specific Price</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category (for category pricing) */}
            {watchPriceType === 'CATEGORY' && (
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={watch('category')} 
                  onValueChange={(value) => setValue('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category} value={category}>
                        <span className="capitalize">{category.replace('_', ' ')}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category.message}</p>
                )}
              </div>
            )}

            {/* Menu/Item Name (for item pricing) */}
            {watchPriceType === 'ITEM' && (
              <div className="space-y-2">
                <Label>Menu/Item Name</Label>
                <Select 
                  value={watch('item_name')} 
                  onValueChange={(value) => setValue('item_name', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a menu item" />
                  </SelectTrigger>
                  <SelectContent>
                    {menuItems?.map((item: { id: number; name: string; category: string }) => (
                      <SelectItem key={item.id} value={item.name}>
                        {item.name} ({item.category.toLowerCase().replace('_', ' ')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.item_name && (
                  <p className="text-sm text-destructive">{errors.item_name.message}</p>
                )}
                {(!menuItems || menuItems.length === 0) && (
                  <p className="text-amber-600 text-xs">
                    No menu items available. Please create menu items first.
                  </p>
                )}
              </div>
            )}

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price_per_kg">Price per KG</Label>
              <Input
                id="price_per_kg"
                type="number"
                step="0.01"
                min="0"
                {...register('price_per_kg', { 
                  required: 'Price is required',
                  min: { value: 0.01, message: 'Price must be greater than 0' }
                })}
                placeholder="0.00"
              />
              {errors.price_per_kg && (
                <p className="text-sm text-destructive">{errors.price_per_kg.message}</p>
              )}
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select 
                value={watch('currency') || defaultCurrency} 
                onValueChange={(value) => setValue('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IDR">IDR (Rupiah)</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Price will be used for calculations
                </p>
              </div>
              <Switch
                checked={watchIsActive}
                onCheckedChange={(checked) => setValue('is_active', checked)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Spinner className="h-4 w-4 mr-2" />
                )}
                {editingPrice ? 'Update Price' : 'Create Price'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal for Default Price Settings */}
      <Dialog open={isDefaultPriceModalOpen} onOpenChange={() => setIsDefaultPriceModalOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Default Price Settings</DialogTitle>
          </DialogHeader>

          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Manager+ Access:</strong> This default price is used when no specific category or item pricing is found.
              It affects all cost calculations across the system. Currency is managed in System Settings.
            </p>
          </div>

          <form onSubmit={handleSubmitDefault(onSubmitDefaultPrice)} className="space-y-4">
            {/* Default Price */}
            <div className="space-y-2">
              <Label htmlFor="default_price_per_kg">Default Price per KG</Label>
              <Input
                id="default_price_per_kg"
                type="number"
                step="0.01"
                min="0.01"
                {...registerDefault('default_price_per_kg', { 
                  required: 'Default price is required',
                  min: { value: 0.01, message: 'Price must be greater than 0' }
                })}
                placeholder="1.00"
              />
              {errorsDefault.default_price_per_kg && (
                <p className="text-sm text-destructive">{errorsDefault.default_price_per_kg.message}</p>
              )}
            </div>

            {/* Current Currency Display */}
            <div className="space-y-2">
              <Label>Currency</Label>
              <div className="w-full px-3 py-2 bg-muted border rounded-md">
                <span>{defaultPriceSettings?.default_currency || defaultCurrency}</span>
                <span className="text-muted-foreground text-sm ml-2">(Managed in System Settings)</span>
              </div>
            </div>

            {/* Current Settings Display */}
            {defaultPriceSettings && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Current:</strong> {formatCurrency(defaultPriceSettings.default_price_per_kg, defaultPriceSettings.default_currency)}/kg
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  To change currency, go to System Settings
                </p>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDefaultPriceModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateDefaultPriceMutation.isPending}>
                {updateDefaultPriceMutation.isPending && (
                  <Spinner className="h-4 w-4 mr-2" />
                )}
                Save Settings
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
