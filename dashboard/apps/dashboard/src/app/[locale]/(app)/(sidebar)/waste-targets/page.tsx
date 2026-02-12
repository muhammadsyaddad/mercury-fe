"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Flag, Plus, Pencil, Trash2, RotateCcw, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@vision_dashboard/ui/card";
import { Button } from "@vision_dashboard/ui/button";
import { Input } from "@vision_dashboard/ui/input";
import { Label } from "@vision_dashboard/ui/label";
import { Switch } from "@vision_dashboard/ui/switch";
import { Spinner } from "@vision_dashboard/ui/spinner";
import { Progress } from "@vision_dashboard/ui/progress";
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
import { Badge } from "@vision_dashboard/ui/badge";
import { wasteTargetsApi } from '@/services/financialApi';
import type { WasteTarget, CreateWasteTarget, TargetSummary } from '@/services/financialApi';
import { formatCurrency } from '@/utils/currency';
import { getTodayLocalDate } from '@/utils/dateUtils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';

export default function WasteTargetsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<WasteTarget | null>(null);
  
  const queryClient = useQueryClient();
  const { defaultCurrency } = useCurrency();

  // Fetch waste targets
  const { data: targetsData, isLoading } = useQuery<{ items: WasteTarget[]; total_count: number }>({
    queryKey: ['wasteTargets'],
    queryFn: () => wasteTargetsApi.getWasteTargets({ limit: 100 }),
  });

  // Fetch targets summary
  const { data: summary } = useQuery<TargetSummary>({
    queryKey: ['targetsSummary'],
    queryFn: wasteTargetsApi.getTargetsSummary,
  });

  // Form handling
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CreateWasteTarget>();
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
        currency: defaultCurrency,
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
        return { icon: CheckCircle, variant: 'default' as const, color: 'text-green-600', bgColor: 'bg-green-100' };
      case 'warning':
        return { icon: AlertTriangle, variant: 'secondary' as const, color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
      case 'exceeded':
        return { icon: XCircle, variant: 'destructive' as const, color: 'text-red-600', bgColor: 'bg-red-100' };
      default:
        return { icon: Flag, variant: 'outline' as const, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner className="h-12 w-12 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading targets...</p>
        </div>
      </div>
    );
  }

  const targets = targetsData?.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 via-yellow-50/80 to-orange-50/60 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/20 rounded-xl p-6 border border-amber-200/60 dark:border-amber-800/40">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center ring-1 ring-amber-200 dark:ring-amber-800">
            <Flag className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-100">Waste Reduction Targets</h1>
            <p className="text-amber-700/70 dark:text-amber-300/70 mt-1">
              Set and track waste reduction goals to improve operational efficiency
            </p>
          </div>
        </div>
        
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Target
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/40">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                  <Flag className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">{summary.total_targets}</div>
                  <div className="text-sm text-amber-700/70 dark:text-amber-300/70">Total Targets</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summary.on_track_count}</div>
                  <div className="text-sm text-emerald-700/70 dark:text-emerald-300/70">On Track</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50/60 dark:bg-yellow-950/20 border-yellow-200/60 dark:border-yellow-800/40">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.warning_count}</div>
                  <div className="text-sm text-yellow-700/70 dark:text-yellow-300/70">Warning</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-800/40">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{summary.exceeded_count}</div>
                  <div className="text-sm text-rose-700/70 dark:text-rose-300/70">Exceeded</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Targets List */}
      {targets.length === 0 ? (
        <Card className="p-12 text-center bg-gradient-to-br from-amber-50/40 to-yellow-50/20 dark:from-amber-950/10 dark:to-yellow-950/5">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Flag className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-amber-900 dark:text-amber-100">No Targets Set</h3>
          <p className="text-amber-700/70 dark:text-amber-300/70 mb-6">
            Create your first waste reduction target to start tracking performance
          </p>
          <Button onClick={() => openModal()}>
            Create First Target
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {targets.map((target) => {
            const statusConfig = getStatusConfig(target.status);
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={target.id} className="border-l-4 border-l-amber-300 dark:border-l-amber-700 hover:shadow-md transition-shadow">
                {/* Header */}
                <CardHeader className="pb-4 bg-gradient-to-r from-amber-50/40 to-transparent dark:from-amber-950/10 dark:to-transparent">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">
                          {target.name}
                        </CardTitle>
                        <Badge 
                          variant={statusConfig.variant}
                          className={cn("flex items-center gap-1", statusConfig.bgColor, statusConfig.color)}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {target.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        {target.category && (
                          <div>Category: {target.category.replace('_', ' ').toUpperCase()}</div>
                        )}
                        <div>Period: {target.period_type}</div>
                        <div>Type: {target.target_type}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReset(target)}
                        title="Reset Progress"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openModal(target)}
                        title="Edit Target"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(target)}
                        title="Delete Target"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Progress Indicators */}
                <CardContent className="space-y-4">
                  {(target.target_type === 'weight' || target.target_type === 'both') && target.weight_limit_kg && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Weight Target</span>
                        <span className="text-sm text-muted-foreground">
                          {target.current_weight.toFixed(1)} / {target.weight_limit_kg.toFixed(1)} kg
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                          className={cn(
                            'h-2 rounded-full transition-all duration-300',
                            getProgressColor(target.weight_percentage_used)
                          )}
                          style={{ width: `${Math.min(target.weight_percentage_used, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {target.weight_percentage_used.toFixed(1)}% used
                      </div>
                    </div>
                  )}

                  {(target.target_type === 'cost' || target.target_type === 'both') && target.cost_limit && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Cost Target</span>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(target.current_cost, target.currency)} / {formatCurrency(target.cost_limit, target.currency)}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                          className={cn(
                            'h-2 rounded-full transition-all duration-300',
                            getProgressColor(target.cost_percentage_used)
                          )}
                          style={{ width: `${Math.min(target.cost_percentage_used, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {target.cost_percentage_used.toFixed(1)}% used
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal for Creating/Editing Targets */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTarget ? 'Edit Target' : 'Add New Target'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Target Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Target Name</Label>
              <Input
                id="name"
                {...register('name', { required: 'Target name is required' })}
                placeholder="e.g., Monthly Fruit Waste Reduction"
              />
              {errors.name && (
                <p className="text-destructive text-sm">{errors.name.message}</p>
              )}
            </div>

            {/* Category (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="category">Category (Optional)</Label>
              <Select
                onValueChange={(value) => setValue('category', value || undefined)}
                defaultValue={editingTarget?.category || ''}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="PROTEIN">Protein</SelectItem>
                  <SelectItem value="CARBOHYDRATE">Carbohydrate</SelectItem>
                  <SelectItem value="VEGETABLES">Vegetables</SelectItem>
                  <SelectItem value="FRUITS">Fruits</SelectItem>
                  <SelectItem value="PASTRY">Pastry</SelectItem>
                  <SelectItem value="OTHERS">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Type */}
            <div className="space-y-2">
              <Label htmlFor="target_type">Target Type</Label>
              <Select
                onValueChange={(value) => setValue('target_type', value as 'weight' | 'cost' | 'both')}
                defaultValue={editingTarget?.target_type || 'both'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight">Weight Only</SelectItem>
                  <SelectItem value="cost">Cost Only</SelectItem>
                  <SelectItem value="both">Both Weight & Cost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Weight Limit */}
            {(watchTargetType === 'weight' || watchTargetType === 'both') && (
              <div className="space-y-2">
                <Label htmlFor="weight_limit_kg">Weight Limit (kg)</Label>
                <Input
                  id="weight_limit_kg"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('weight_limit_kg', { 
                    required: (watchTargetType === 'weight' || watchTargetType === 'both') ? 'Weight limit is required' : false,
                    min: { value: 0.01, message: 'Weight limit must be greater than 0' }
                  })}
                  placeholder="0.00"
                />
                {errors.weight_limit_kg && (
                  <p className="text-destructive text-sm">{errors.weight_limit_kg.message}</p>
                )}
              </div>
            )}

            {/* Cost Limit */}
            {(watchTargetType === 'cost' || watchTargetType === 'both') && (
              <div className="space-y-2">
                <Label htmlFor="cost_limit">Cost Limit</Label>
                <Input
                  id="cost_limit"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('cost_limit', { 
                    required: (watchTargetType === 'cost' || watchTargetType === 'both') ? 'Cost limit is required' : false,
                    min: { value: 0.01, message: 'Cost limit must be greater than 0' }
                  })}
                  placeholder="0.00"
                />
                {errors.cost_limit && (
                  <p className="text-destructive text-sm">{errors.cost_limit.message}</p>
                )}
              </div>
            )}

            {/* Period Type */}
            <div className="space-y-2">
              <Label htmlFor="period_type">Period Type</Label>
              <Select
                onValueChange={(value) => setValue('period_type', value as CreateWasteTarget['period_type'])}
                defaultValue={editingTarget?.period_type || 'monthly'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="target_period_start">Start Date</Label>
              <Input
                id="target_period_start"
                type="date"
                {...register('target_period_start', { required: 'Start date is required' })}
              />
              {errors.target_period_start && (
                <p className="text-destructive text-sm">{errors.target_period_start.message}</p>
              )}
            </div>

            {/* End Date (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="target_period_end">End Date (Optional)</Label>
              <Input
                id="target_period_end"
                type="date"
                {...register('target_period_end')}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for ongoing targets
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                defaultChecked={editingTarget?.is_active ?? true}
                onCheckedChange={(checked) => setValue('is_active', checked)}
              />
              <Label htmlFor="is_active">Active (target will be tracked)</Label>
            </div>

            {/* Submit Buttons */}
            <DialogFooter className="gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 
                 editingTarget ? 'Update Target' : 'Create Target'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
