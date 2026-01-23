import React, { useState, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FlagIcon,
  ScaleIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { wasteTargetsApi, CreateWasteTarget, WasteTarget } from '../services/financialApi';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { formatCurrency } from '../utils/currency';
import { getTodayLocalDate } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const WasteTargets: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<WasteTarget | null>(null);
  
  const queryClient = useQueryClient();

  // Fetch waste targets
  const { data: targetsData, isLoading } = useQuery({
    queryKey: ['wasteTargets'],
    queryFn: () => wasteTargetsApi.getWasteTargets({ limit: 100 }),
  });

  // Fetch targets summary
  const { data: summary } = useQuery({
    queryKey: ['targetsSummary'],
    queryFn: wasteTargetsApi.getTargetsSummary,
  });

  // Form handling
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<CreateWasteTarget>();
  const watchTargetType = watch('target_type', 'both');

  // Mutations
  const createMutation = useMutation({
    mutationFn: wasteTargetsApi.createWasteTarget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wasteTargets'] });
      queryClient.invalidateQueries({ queryKey: ['targetsSummary'] });
      toast.success('Target created successfully');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create target');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateWasteTarget> }) =>
      wasteTargetsApi.updateWasteTarget(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wasteTargets'] });
      queryClient.invalidateQueries({ queryKey: ['targetsSummary'] });
      toast.success('Target updated successfully');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update target');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: wasteTargetsApi.deleteWasteTarget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wasteTargets'] });
      queryClient.invalidateQueries({ queryKey: ['targetsSummary'] });
      toast.success('Target deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete target');
    },
  });

  const resetMutation = useMutation({
    mutationFn: wasteTargetsApi.resetTargetProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wasteTargets'] });
      queryClient.invalidateQueries({ queryKey: ['targetsSummary'] });
      toast.success('Target progress reset successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to reset target');
    },
  });

  // Modal handlers
  const openModal = (target?: WasteTarget) => {
    if (target) {
      setEditingTarget(target);
      reset({
        name: target.name,
        category: target.category || undefined,
        target_type: target.target_type,
        weight_limit_kg: target.weight_limit_kg || undefined,
        cost_limit: target.cost_limit || undefined,
        currency: target.currency,
        period_type: target.period_type,
        target_period_start: target.target_period_start,
        target_period_end: target.target_period_end || undefined,
        is_active: target.is_active,
      });
    } else {
      setEditingTarget(null);
      reset({
        target_type: 'both',
        currency: 'USD',
        period_type: 'monthly',
        target_period_start: getTodayLocalDate(),
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTarget(null);
    reset();
  };

  // Form submission
  const onSubmit = (data: CreateWasteTarget) => {
    // Filter out empty strings to avoid validation errors
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
    ) as CreateWasteTarget;

    if (editingTarget) {
      updateMutation.mutate({ id: editingTarget.id, data: cleanedData });
    } else {
      createMutation.mutate(cleanedData);
    }
  };

  // Delete handler
  const handleDelete = (target: WasteTarget) => {
    if (window.confirm('Are you sure you want to delete this target? This action cannot be undone.')) {
      deleteMutation.mutate(target.id);
    }
  };

  // Reset handler
  const handleReset = (target: WasteTarget) => {
    if (window.confirm('Are you sure you want to reset this target\'s progress? This will set current values back to zero.')) {
      resetMutation.mutate(target.id);
    }
  };

  // Status icon and color
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'on_track':
        return { icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-100' };
      case 'warning':
        return { icon: ExclamationTriangleIcon, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'exceeded':
        return { icon: XCircleIcon, color: 'text-red-600', bg: 'bg-red-100' };
      default:
        return { icon: FlagIcon, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading targets...</p>
        </div>
      </div>
    );
  }

  const targets = targetsData?.items || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Waste Reduction Targets</h1>
              <p className="text-gray-600 mt-1">
                Set and track waste reduction goals to improve operational efficiency
              </p>
            </div>
            
            <button
              onClick={() => openModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Target
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{summary.total_targets}</div>
              <div className="text-sm text-gray-600">Total Targets</div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{summary.on_track_count}</div>
              <div className="text-sm text-gray-600">On Track</div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="text-2xl font-bold text-yellow-600">{summary.warning_count}</div>
              <div className="text-sm text-gray-600">Warning</div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="text-2xl font-bold text-red-600">{summary.exceeded_count}</div>
              <div className="text-sm text-gray-600">Exceeded</div>
            </div>
          </div>
        )}

        {/* Targets List */}
        {targets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <FlagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Targets Set</h3>
            <p className="text-gray-600 mb-6">
              Create your first waste reduction target to start tracking performance
            </p>
            <button
              onClick={() => openModal()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create First Target
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {targets.map((target) => {
              const statusConfig = getStatusConfig(target.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div key={target.id} className="bg-white rounded-xl shadow-lg border border-gray-100">
                  {/* Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {target.name}
                          </h3>
                          <div className={clsx(
                            'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                            statusConfig.bg,
                            statusConfig.color
                          )}>
                            <StatusIcon className="w-3 h-3" />
                            {target.status.replace('_', ' ').toUpperCase()}
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          {target.category && (
                            <div>Category: {target.category.replace('_', ' ').toUpperCase()}</div>
                          )}
                          <div>Period: {target.period_type}</div>
                          <div>Type: {target.target_type}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleReset(target)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Reset Progress"
                        >
                          <ArrowPathIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openModal(target)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit Target"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(target)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete Target"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress Indicators */}
                  <div className="p-6 space-y-4">
                    {(target.target_type === 'weight' || target.target_type === 'both') && target.weight_limit_kg && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Weight Target</span>
                          <span className="text-sm text-gray-600">
                            {target.current_weight.toFixed(1)} / {target.weight_limit_kg.toFixed(1)} kg
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={clsx(
                              'h-2 rounded-full transition-all duration-300',
                              target.weight_percentage_used >= 100 ? 'bg-red-500' :
                              target.weight_percentage_used >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                            )}
                            style={{ width: `${Math.min(target.weight_percentage_used, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {target.weight_percentage_used.toFixed(1)}% used
                        </div>
                      </div>
                    )}

                    {(target.target_type === 'cost' || target.target_type === 'both') && target.cost_limit && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Cost Target</span>
                          <span className="text-sm text-gray-600">
                            {formatCurrency(target.current_cost)} / {formatCurrency(target.cost_limit)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={clsx(
                              'h-2 rounded-full transition-all duration-300',
                              target.cost_percentage_used >= 100 ? 'bg-red-500' :
                              target.cost_percentage_used >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                            )}
                            style={{ width: `${Math.min(target.cost_percentage_used, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {target.cost_percentage_used.toFixed(1)}% used
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for Creating/Editing Targets */}
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
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      {editingTarget ? 'Edit Target' : 'Add New Target'}
                    </Dialog.Title>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Target Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Name
                      </label>
                      <input
                        type="text"
                        {...register('name', { required: 'Target name is required' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Monthly Fruit Waste Reduction"
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    {/* Category (Optional) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category (Optional)
                      </label>
                      <select
                        {...register('category')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Categories</option>
                        <option value="PROTEIN">Protein</option>
                        <option value="CARBOHYDRATE">Carbohydrate</option>
                        <option value="VEGETABLES">Vegetables</option>
                        <option value="FRUITS">Fruits</option>
                        <option value="PASTRY">Pastry</option>
                        <option value="OTHERS">Others</option>
                      </select>
                    </div>

                    {/* Target Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Type
                      </label>
                      <select
                        {...register('target_type', { required: 'Target type is required' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="weight">Weight Only</option>
                        <option value="cost">Cost Only</option>
                        <option value="both">Both Weight & Cost</option>
                      </select>
                      {errors.target_type && (
                        <p className="text-red-500 text-sm mt-1">{errors.target_type.message}</p>
                      )}
                    </div>

                    {/* Weight Limit */}
                    {(watchTargetType === 'weight' || watchTargetType === 'both') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Weight Limit (kg)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register('weight_limit_kg', { 
                            required: (watchTargetType === 'weight' || watchTargetType === 'both') ? 'Weight limit is required' : false,
                            min: { value: 0.01, message: 'Weight limit must be greater than 0' }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                        {errors.weight_limit_kg && (
                          <p className="text-red-500 text-sm mt-1">{errors.weight_limit_kg.message}</p>
                        )}
                      </div>
                    )}

                    {/* Cost Limit */}
                    {(watchTargetType === 'cost' || watchTargetType === 'both') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cost Limit
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register('cost_limit', { 
                            required: (watchTargetType === 'cost' || watchTargetType === 'both') ? 'Cost limit is required' : false,
                            min: { value: 0.01, message: 'Cost limit must be greater than 0' }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                        {errors.cost_limit && (
                          <p className="text-red-500 text-sm mt-1">{errors.cost_limit.message}</p>
                        )}
                      </div>
                    )}

                    {/* Period Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Period Type
                      </label>
                      <select
                        {...register('period_type', { required: 'Period type is required' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                      {errors.period_type && (
                        <p className="text-red-500 text-sm mt-1">{errors.period_type.message}</p>
                      )}
                    </div>

                    {/* Start Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        {...register('target_period_start', { required: 'Start date is required' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {errors.target_period_start && (
                        <p className="text-red-500 text-sm mt-1">{errors.target_period_start.message}</p>
                      )}
                    </div>

                    {/* End Date (Optional) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date (Optional)
                      </label>
                      <input
                        type="date"
                        {...register('target_period_end')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Leave empty for ongoing targets
                      </p>
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('is_active')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Active (target will be tracked)
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
                         editingTarget ? 'Update Target' : 'Create Target'}
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

export default WasteTargets;