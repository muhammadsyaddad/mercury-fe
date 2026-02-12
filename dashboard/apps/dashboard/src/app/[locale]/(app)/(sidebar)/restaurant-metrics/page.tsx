"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, BarChart3, Users, DollarSign, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@vision_dashboard/ui/card";
import { Button } from "@vision_dashboard/ui/button";
import { Input } from "@vision_dashboard/ui/input";
import { Label } from "@vision_dashboard/ui/label";
import { Spinner } from "@vision_dashboard/ui/spinner";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@vision_dashboard/ui/table";
import { restaurantMetricsApi } from '@/services/financialApi';
import type { RestaurantMetrics, CreateRestaurantMetrics } from '@/services/financialApi';
import { formatCurrency } from '@/utils/currency';
import { useCurrency } from '@/contexts/CurrencyContext';

interface CreateRestaurantMetricsForm extends CreateRestaurantMetrics {
  date: string;
}

export default function RestaurantMetricsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<RestaurantMetrics | null>(null);

  const queryClient = useQueryClient();
  const { defaultCurrency } = useCurrency();

  // Fetch restaurant metrics
  const { data: metricsData, isLoading } = useQuery<{ items: RestaurantMetrics[]; total_count: number }>({
    queryKey: ['restaurantMetrics'],
    queryFn: () => restaurantMetricsApi.getRestaurantMetrics({ limit: 100 }),
    staleTime: 0,
    gcTime: 0
  });

  // Form handling
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreateRestaurantMetricsForm>();

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner className="h-12 w-12 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading restaurant metrics...</p>
        </div>
      </div>
    );
  }

  const metrics = metricsData?.items || [];

  // Calculate summary stats
  const avgOccupancy = metrics.length > 0
    ? (metrics.reduce((sum: number, m: RestaurantMetrics) => sum + m.occupancy_percentage, 0) / metrics.length).toFixed(1)
    : '0';
  const totalCovers = metrics.reduce((sum: number, m: RestaurantMetrics) => sum + m.number_of_covers, 0);
  const totalRevenue = metrics.reduce((sum: number, m: RestaurantMetrics) => sum + m.fb_revenue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Restaurant Metrics</h1>
          <p className="text-muted-foreground mt-1">
            Track daily occupancy, covers, and F&B revenue
          </p>
        </div>

        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Daily Metrics
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Occupancy</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgOccupancy}%</div>
            <p className="text-xs text-muted-foreground">Based on {metrics.length} entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Covers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCovers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue, metrics[0]?.currency || defaultCurrency)}
            </div>
            <p className="text-xs text-muted-foreground">F&B revenue total</p>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Daily Metrics</CardTitle>
              <p className="text-sm text-muted-foreground">Restaurant performance by date</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {metrics.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Metrics Recorded</h3>
              <p className="text-muted-foreground mb-4">Start tracking your daily restaurant metrics</p>
              <Button onClick={() => openModal()}>
                Add Daily Metrics
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Occupancy</TableHead>
                    <TableHead>Covers</TableHead>
                    <TableHead>F&B Revenue</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.map((metric) => (
                    <TableRow key={metric.id}>
                      <TableCell className="font-medium">
                        {format(new Date(metric.date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{metric.occupancy_percentage}%</TableCell>
                      <TableCell>{metric.number_of_covers.toLocaleString()}</TableCell>
                      <TableCell>
                        {formatCurrency(metric.fb_revenue, metric.currency)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openModal(metric)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(metric)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal for Creating/Editing Metrics */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMetric ? 'Edit Daily Metrics' : 'Add Daily Metrics'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                {...register('date', { required: 'Date is required' })}
              />
              {errors.date && (
                <p className="text-destructive text-sm">{errors.date.message}</p>
              )}
            </div>

            {/* Occupancy Percentage */}
            <div className="space-y-2">
              <Label htmlFor="occupancy_percentage">Occupancy Level (%)</Label>
              <Input
                id="occupancy_percentage"
                type="number"
                step="0.1"
                min="0"
                max="100"
                {...register('occupancy_percentage', {
                  required: 'Occupancy percentage is required',
                  min: { value: 0, message: 'Occupancy must be at least 0%' },
                  max: { value: 100, message: 'Occupancy cannot exceed 100%' }
                })}
                placeholder="85.5"
              />
              {errors.occupancy_percentage && (
                <p className="text-destructive text-sm">{errors.occupancy_percentage.message}</p>
              )}
            </div>

            {/* Number of Covers */}
            <div className="space-y-2">
              <Label htmlFor="number_of_covers">Number of Covers/Diners</Label>
              <Input
                id="number_of_covers"
                type="number"
                min="0"
                {...register('number_of_covers', {
                  required: 'Number of covers is required',
                  min: { value: 0, message: 'Number of covers must be non-negative' }
                })}
                placeholder="150"
              />
              {errors.number_of_covers && (
                <p className="text-destructive text-sm">{errors.number_of_covers.message}</p>
              )}
            </div>

            {/* F&B Revenue */}
            <div className="space-y-2">
              <Label htmlFor="fb_revenue">F&B Revenue</Label>
              <Input
                id="fb_revenue"
                type="number"
                step="0.01"
                min="0"
                {...register('fb_revenue', {
                  required: 'F&B revenue is required',
                  min: { value: 0, message: 'Revenue must be non-negative' }
                })}
                placeholder="25000.00"
              />
              {errors.fb_revenue && (
                <p className="text-destructive text-sm">{errors.fb_revenue.message}</p>
              )}
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                defaultValue={editingMetric?.currency || defaultCurrency}
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
                 editingMetric ? 'Update Metrics' : 'Create Metrics'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
