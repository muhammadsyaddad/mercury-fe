import React, { useState, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { restaurantMetricsApi, CreateRestaurantMetrics, RestaurantMetrics } from '../services/financialApi';
import { formatCurrency } from '../utils/currency';
import { useCurrency } from '../contexts/CurrencyContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface CreateRestaurantMetricsForm extends CreateRestaurantMetrics {
  date: string;
}

const RestaurantMetricsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<RestaurantMetrics | null>(null);
  
  const queryClient = useQueryClient();
  const { defaultCurrency } = useCurrency();

  // Fetch restaurant metrics
  const { data: metricsData, isLoading, error } = useQuery({
    queryKey: ['restaurantMetrics'],
    queryFn: () => restaurantMetricsApi.getRestaurantMetrics({ limit: 100 }),
    staleTime: 0,
    gcTime: 0
  });

  // Form handling
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateRestaurantMetricsForm>();

  // Mutations
  const createMutation = useMutation({
    mutationFn: restaurantMetricsApi.createRestaurantMetrics,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurantMetrics'] });
      toast.success('Restaurant metrics created successfully');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create restaurant metrics');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateRestaurantMetrics }) =>
      restaurantMetricsApi.updateRestaurantMetrics(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurantMetrics'] });
      toast.success('Restaurant metrics updated successfully');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update restaurant metrics');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: restaurantMetricsApi.deleteRestaurantMetrics,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurantMetrics'] });
      toast.success('Restaurant metrics deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete restaurant metrics');
    },
  });

  // Modal handlers
  const openModal = (metric?: RestaurantMetrics) => {
    if (metric) {
      setEditingMetric(metric);
      reset({
        date: metric.date,
        occupancy_percentage: metric.occupancy_percentage,
        number_of_covers: metric.number_of_covers,
        fb_revenue: metric.fb_revenue,
        currency: metric.currency,
      });
    } else {
      setEditingMetric(null);
      reset({
        date: format(new Date(), 'yyyy-MM-dd'),
        currency: defaultCurrency,
        occupancy_percentage: 0,
        number_of_covers: 0,
        fb_revenue: 0,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMetric(null);
    reset();
  };

  // Form submission
  const onSubmit = (data: CreateRestaurantMetricsForm) => {
    const cleanData: CreateRestaurantMetrics = {
      date: data.date,
      occupancy_percentage: Number(data.occupancy_percentage),
      number_of_covers: Number(data.number_of_covers),
      fb_revenue: Number(data.fb_revenue),
      currency: data.currency
    };
    
    if (editingMetric) {
      updateMutation.mutate({ id: editingMetric.id, data: cleanData });
    } else {
      createMutation.mutate(cleanData);
    }
  };

  // Delete handler
  const handleDelete = (metric: RestaurantMetrics) => {
    if (window.confirm('Are you sure you want to delete this restaurant metrics entry? This action cannot be undone.')) {
      deleteMutation.mutate(metric.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading restaurant metrics...</p>
        </div>
      </div>
    );
  }

  const metrics = metricsData?.items || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Restaurant Metrics</h1>
              <p className="text-gray-600 mt-1">
                Track daily occupancy, covers, and F&B revenue
              </p>
            </div>
            
            <button
              onClick={() => openModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Daily Metrics
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChartBarIcon className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Average Occupancy</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.length > 0 
                ? `${(metrics.reduce((sum, m) => sum + m.occupancy_percentage, 0) / metrics.length).toFixed(1)}%`
                : '0%'
              }
            </p>
            <p className="text-sm text-gray-600">Based on {metrics.length} entries</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserGroupIcon className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Total Covers</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.reduce((sum, m) => sum + m.number_of_covers, 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Across all entries</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CurrencyDollarIcon className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Total Revenue</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(
                metrics.reduce((sum, m) => sum + m.fb_revenue, 0),
                metrics[0]?.currency || defaultCurrency
              )}
            </p>
            <p className="text-sm text-gray-600">F&B revenue total</p>
          </div>
        </div>

        {/* Metrics Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <CalendarIcon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Daily Metrics</h2>
                <p className="text-sm text-gray-600">Restaurant performance by date</p>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {metrics.length === 0 ? (
              <div className="p-8 text-center">
                <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Metrics Recorded</h3>
                <p className="text-gray-600 mb-4">Start tracking your daily restaurant metrics</p>
                <button
                  onClick={() => openModal()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Daily Metrics
                </button>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupancy</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Covers</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">F&B Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {metrics.map((metric) => (
                    <tr key={metric.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {format(new Date(metric.date), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{metric.occupancy_percentage}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{metric.number_of_covers.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(metric.fb_revenue, metric.currency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openModal(metric)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(metric)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal for Creating/Editing Metrics */}
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
                      {editingMetric ? 'Edit Daily Metrics' : 'Add Daily Metrics'}
                    </Dialog.Title>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        {...register('date', { required: 'Date is required' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {errors.date && (
                        <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
                      )}
                    </div>

                    {/* Occupancy Percentage */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Occupancy Level (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        {...register('occupancy_percentage', { 
                          required: 'Occupancy percentage is required',
                          min: { value: 0, message: 'Occupancy must be at least 0%' },
                          max: { value: 100, message: 'Occupancy cannot exceed 100%' }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="85.5"
                      />
                      {errors.occupancy_percentage && (
                        <p className="text-red-500 text-sm mt-1">{errors.occupancy_percentage.message}</p>
                      )}
                    </div>

                    {/* Number of Covers */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Covers/Diners
                      </label>
                      <input
                        type="number"
                        min="0"
                        {...register('number_of_covers', { 
                          required: 'Number of covers is required',
                          min: { value: 0, message: 'Number of covers must be non-negative' }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="150"
                      />
                      {errors.number_of_covers && (
                        <p className="text-red-500 text-sm mt-1">{errors.number_of_covers.message}</p>
                      )}
                    </div>

                    {/* F&B Revenue */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        F&B Revenue
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register('fb_revenue', { 
                          required: 'F&B revenue is required',
                          min: { value: 0, message: 'Revenue must be non-negative' }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="25000.00"
                      />
                      {errors.fb_revenue && (
                        <p className="text-red-500 text-sm mt-1">{errors.fb_revenue.message}</p>
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
                         editingMetric ? 'Update Metrics' : 'Create Metrics'}
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

export default RestaurantMetricsPage;