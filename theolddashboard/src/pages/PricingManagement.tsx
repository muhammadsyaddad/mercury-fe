import React, { useState, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CurrencyDollarIcon,
  TagIcon,
  SparklesIcon,
  XMarkIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { foodPricesApi, financialAnalyticsApi, systemSettingsApi, CreateFoodPrice, FoodPrice, DefaultPriceSettings } from '../services/financialApi';
import { apiService } from '../services/api';

// Form interface with uppercase values for UI consistency
interface CreateFoodPriceForm {
  price_type: 'CATEGORY' | 'ITEM';
  category?: string;
  item_name?: string;
  price_per_kg: number;
  currency?: string;
  effective_from?: string;
  effective_to?: string;
  is_active?: boolean;
}
import { formatCurrency } from '../utils/currency';
import { useCurrency } from '../contexts/CurrencyContext';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const PricingManagement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<FoodPrice | null>(null);
  const [selectedPriceType, setSelectedPriceType] = useState<'CATEGORY' | 'ITEM'>('CATEGORY');
  const [isDefaultPriceModalOpen, setIsDefaultPriceModalOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { defaultCurrency } = useCurrency();

  // Fetch food prices
  const { data: pricesData, isLoading, error } = useQuery({
    queryKey: ['foodPrices'],
    queryFn: () => {
      console.log('Making API call to getFoodPrices');
      return foodPricesApi.getFoodPrices({ limit: 100, active_only: false });
    },
    staleTime: 0, // Always refetch
    gcTime: 0 // Don't cache
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
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<CreateFoodPriceForm>();
  const watchPriceType = watch('price_type', selectedPriceType);

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
    onError: (error: any) => {
      console.error('Create price error:', error.response?.data);
      toast.error(error.response?.data?.detail || 'Failed to create price');
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
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update price');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: foodPricesApi.deleteFoodPrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodPrices'] });
      toast.success('Price deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete price');
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
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update default price settings');
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

  const closeDefaultPriceModal = () => {
    setIsDefaultPriceModalOpen(false);
    resetDefault();
  };

  // Form submission
  const onSubmit = (data: CreateFoodPriceForm) => {
    console.log('Form submission data:', data);
    
    // Clean up data - remove empty fields for the opposite price type
    const cleanData = { ...data };
    if (data.price_type === 'CATEGORY') {
      delete cleanData.item_name;
    } else if (data.price_type === 'ITEM') {
      delete cleanData.category;
    }
    
    // Convert to API format: ensure price_per_kg is a number and price_type is lowercase
    const apiData: CreateFoodPrice = {
      ...cleanData,
      price_per_kg: Number(cleanData.price_per_kg),
      price_type: cleanData.price_type.toLowerCase() as 'category' | 'item'
    };
    
    console.log('Cleaned submission data:', apiData);
    
    if (editingPrice) {
      updateMutation.mutate({ id: editingPrice.id, data: apiData });
    } else {
      createMutation.mutate(apiData);
    }
  };

  // Default price form submission
  const onSubmitDefaultPrice = (data: {default_price_per_kg: number}) => {
    // Include current currency from defaultPriceSettings when updating
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pricing data...</p>
        </div>
      </div>
    );
  }

  const prices = pricesData?.items || [];
  
  console.log('PricingManagement render:', { 
    isLoading, 
    error, 
    pricesData, 
    pricesCount: prices.length,
    prices: prices,
    categoryPricesCount: prices.filter((p: any) => p.price_type === 'category').length,
    itemPricesCount: prices.filter((p: any) => p.price_type === 'item').length
  });
  const categoryPrices = prices.filter((p: any) => p.price_type === 'category');
  const itemPrices = prices.filter((p: any) => p.price_type === 'item');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pricing Management</h1>
              <p className="text-gray-600 mt-1">
                Configure food waste pricing for accurate cost calculations
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => openDefaultPriceModal()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Cog6ToothIcon className="w-4 h-4" />
                Default Settings
              </button>
              
              <button
                onClick={() => recalculateMutation.mutate()}
                disabled={recalculateMutation.isPending}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <SparklesIcon className="w-4 h-4" />
                {recalculateMutation.isPending ? 'Recalculating...' : 'Recalculate Costs'}
              </button>
              
              <button
                onClick={() => openModal()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Add Price
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Prices */}
          <div>
            <div className="bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TagIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Category Pricing</h2>
                    <p className="text-sm text-gray-600">Default prices for food categories</p>
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {categoryPrices.length === 0 ? (
                  <div className="p-8 text-center">
                    <TagIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Category Prices</h3>
                    <p className="text-gray-600 mb-4">Set up default pricing for food categories</p>
                    <button
                      onClick={() => openModal()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Category Price
                    </button>
                  </div>
                ) : (
                  categoryPrices.map((price: any) => (
                    <div key={price.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 capitalize">
                            {price.category?.replace('_', ' ')}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatCurrency(price.price_per_kg, price.currency)} per kg
                          </div>
                          {!price.is_active && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                              Inactive
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openModal(price)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(price)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Menu/Item-Specific Prices */}
          <div>
            <div className="bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Menu/Item-Specific Pricing</h2>
                    <p className="text-sm text-gray-600">Custom prices for specific menu items</p>
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {itemPrices.length === 0 ? (
                  <div className="p-8 text-center">
                    <CurrencyDollarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Menu Item Prices</h3>
                    <p className="text-gray-600 mb-4">Create specific pricing for individual menu items</p>
                    <button
                      onClick={() => {
                        setSelectedPriceType('ITEM');
                        openModal();
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Add Menu Item Price
                    </button>
                  </div>
                ) : (
                  itemPrices.map((price: any) => (
                    <div key={price.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {price.item_name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatCurrency(price.price_per_kg, price.currency)} per kg
                          </div>
                          {!price.is_active && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                              Inactive
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openModal(price)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(price)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How Pricing Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
                1
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Menu/Item-Specific First</h4>
              <p className="text-sm text-gray-600">
                System first looks for specific menu item pricing (e.g., "nasi goreng" = $5/kg)
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
                2
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Category Fallback</h4>
              <p className="text-sm text-gray-600">
                If no item price found, uses category pricing (e.g., "fruits" = $3/kg)
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
                3
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Default Price</h4>
              <p className="text-sm text-gray-600">
                If neither available, uses configurable default price ({defaultPriceSettings ? formatCurrency(defaultPriceSettings.default_price_per_kg, defaultPriceSettings.default_currency) : '$1.00'}/kg)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Creating/Editing Prices */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      {editingPrice ? 'Edit Price' : 'Add New Price'}
                    </Dialog.Title>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Price Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price Type
                      </label>
                      <select
                        {...register('price_type', { required: 'Price type is required' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onChange={(e) => {
                          const newType = e.target.value as 'CATEGORY' | 'ITEM';
                          setSelectedPriceType(newType);
                          // Clear the opposite field when switching types
                          if (newType === 'CATEGORY') {
                            reset({
                              ...watch(),
                              price_type: newType,
                              item_name: undefined
                            });
                          } else {
                            reset({
                              ...watch(),
                              price_type: newType,
                              category: undefined
                            });
                          }
                        }}
                      >
                        <option value="CATEGORY">Category Price</option>
                        <option value="ITEM">Menu/Item-Specific Price</option>
                      </select>
                      {errors.price_type && (
                        <p className="text-red-500 text-sm mt-1">{errors.price_type.message}</p>
                      )}
                    </div>

                    {/* Category (for category pricing) */}
                    {watchPriceType === 'CATEGORY' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category
                        </label>
                        <select
                          {...register('category', { required: watchPriceType === 'CATEGORY' ? 'Category is required' : false })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Category</option>
                          {categories?.map((category) => (
                            <option key={category} value={category}>
                              {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                        {errors.category && (
                          <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
                        )}
                      </div>
                    )}

                    {/* Menu/Item Name (for item pricing) */}
                    {watchPriceType === 'ITEM' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Menu/Item Name
                        </label>
                        <select
                          {...register('item_name', { required: watchPriceType === 'ITEM' ? 'Menu/item name is required' : false })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select a menu item</option>
                          {menuItems && menuItems.map((item: any) => (
                            <option key={item.id} value={item.name}>
                              {item.name} ({item.category.toLowerCase().replace('_', ' ')})
                            </option>
                          ))}
                        </select>
                        {errors.item_name && (
                          <p className="text-red-500 text-sm mt-1">{errors.item_name.message}</p>
                        )}
                        {(!menuItems || menuItems.length === 0) && (
                          <p className="text-amber-600 text-xs mt-1">
                            ⚠️ No menu items available. Please create menu items first.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price per KG
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register('price_per_kg', { 
                          required: 'Price is required',
                          min: { value: 0.01, message: 'Price must be greater than 0' }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                      {errors.price_per_kg && (
                        <p className="text-red-500 text-sm mt-1">{errors.price_per_kg.message}</p>
                      )}
                    </div>

                    {/* Currency */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        {...register('currency')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="IDR">IDR (Rupiah)</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('is_active')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Active (price will be used for calculations)
                      </label>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={createMutation.isPending || updateMutation.isPending}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 
                         editingPrice ? 'Update Price' : 'Create Price'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Modal for Default Price Settings */}
      <Transition appear show={isDefaultPriceModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeDefaultPriceModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      Default Price Settings
                    </Dialog.Title>
                    <button onClick={closeDefaultPriceModal} className="text-gray-400 hover:text-gray-600">
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Manager+ Access:</strong> This default price is used when no specific category or item pricing is found.
                      It affects all cost calculations across the system. Currency is managed in System Settings.
                    </p>
                  </div>

                  <form onSubmit={handleSubmitDefault(onSubmitDefaultPrice)} className="space-y-4">
                    {/* Default Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Price per KG
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        {...registerDefault('default_price_per_kg', { 
                          required: 'Default price is required',
                          min: { value: 0.01, message: 'Price must be greater than 0' }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="1.00"
                      />
                      {errorsDefault.default_price_per_kg && (
                        <p className="text-red-500 text-sm mt-1">{errorsDefault.default_price_per_kg.message}</p>
                      )}
                    </div>

                    {/* Current Currency Display */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                        <span className="text-gray-900">{defaultPriceSettings?.default_currency || defaultCurrency}</span>
                        <span className="text-gray-500 text-sm ml-2">(Managed in System Settings)</span>
                      </div>
                    </div>

                    {/* Current Settings Display */}
                    {defaultPriceSettings && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <strong>Current:</strong> {formatCurrency(defaultPriceSettings.default_price_per_kg, defaultPriceSettings.default_currency)}/kg
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          To change currency, go to System Settings
                        </p>
                      </div>
                    )}

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={closeDefaultPriceModal}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updateDefaultPriceMutation.isPending}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {updateDefaultPriceMutation.isPending ? 'Saving...' : 'Save Settings'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default PricingManagement;