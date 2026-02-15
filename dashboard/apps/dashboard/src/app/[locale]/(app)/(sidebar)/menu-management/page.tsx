"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { apiService } from '@/services/api';
import type { MenuItem } from '@/types';
import { FoodCategory } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@vision_dashboard/ui/card";
import { Button } from "@vision_dashboard/ui/button";
import { Input } from "@vision_dashboard/ui/input";
import { Label } from "@vision_dashboard/ui/label";
import { Textarea } from "@vision_dashboard/ui/textarea";
import { Badge } from "@vision_dashboard/ui/badge";
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
import { Plus, Pencil, Trash2, UtensilsCrossed, CheckCircle, XCircle, Tag } from 'lucide-react';
import { getCategoryIcon, getCategoryColorClass } from '@/utils/categoryUtils';

interface MenuItemForm {
  name: string;
  category: FoodCategory;
  description?: string;
  is_active: boolean;
}

export default function MenuManagementPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const queryClient = useQueryClient();

  // Fetch menu items
  const { data: menuData, isLoading } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => apiService.getMenuItems({ page: 1, page_size: 200, active_only: false }),
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<MenuItemForm>();
  const selectedCategory = watch('category');
  const isActive = watch('is_active');

  // Mutations
  const createMutation = useMutation({
    mutationFn: apiService.createMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      toast.success('Menu item created successfully');
      closeModal();
    },
    onError: () => {
      toast.error('Failed to create menu item');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: MenuItemForm }) => apiService.updateMenuItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      toast.success('Menu item updated successfully');
      closeModal();
    },
    onError: () => {
      toast.error('Failed to update menu item');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: apiService.deleteMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      toast.success('Menu item deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete menu item');
    },
  });

  const openModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      reset({
        name: item.name,
        category: item.category,
        description: item.description || '',
        is_active: item.is_active,
      });
    } else {
      setEditingItem(null);
      reset({
        name: '',
        category: FoodCategory.OTHERS,
        description: '',
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    reset();
  };

  const onSubmit = (data: MenuItemForm) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (item: MenuItem) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(item.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Spinner className="h-12 w-12 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading menu items...</p>
        </div>
      </div>
    );
  }

  const menuItems: MenuItem[] = menuData?.items ?? [];

  // Group items by category
  const itemsByCategory = menuItems.reduce<Record<string, MenuItem[]>>((acc, item: MenuItem) => {
    const category = item.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category]?.push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-orange-50 via-amber-50/80 to-yellow-50/60 dark:from-orange-950/40 dark:via-amber-950/30 dark:to-yellow-950/20 rounded-xl p-6 border border-orange-200/60 dark:border-orange-800/40">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/40 rounded-xl flex items-center justify-center ring-1 ring-orange-200 dark:ring-orange-800">
            <UtensilsCrossed className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-orange-900 dark:text-orange-100">Menu Management</h1>
            <p className="text-orange-700/70 dark:text-orange-300/70">Manage your restaurant's menu items for AI classification and pricing</p>
          </div>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Menu Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-orange-50/60 dark:bg-orange-950/20 border-orange-200/60 dark:border-orange-800/40">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-sm text-orange-700/70 dark:text-orange-300/70">Total Items</div>
                <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{menuItems.length}</div>
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
                <div className="text-sm text-emerald-700/70 dark:text-emerald-300/70">Active</div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {menuItems.filter((i: MenuItem) => i.is_active).length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-50/60 dark:bg-slate-950/20 border-slate-200/60 dark:border-slate-800/40">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 dark:bg-slate-900/30 rounded-lg flex items-center justify-center">
                <XCircle className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <div className="text-sm text-slate-700/70 dark:text-slate-300/70">Inactive</div>
                <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                  {menuItems.filter((i: MenuItem) => !i.is_active).length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-violet-50/60 dark:bg-violet-950/20 border-violet-200/60 dark:border-violet-800/40">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                <Tag className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <div className="text-sm text-violet-700/70 dark:text-violet-300/70">Categories</div>
                <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{Object.keys(itemsByCategory).length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Items by Category */}
      <div className="space-y-6">
        {Object.entries(itemsByCategory).map(([category, items]) => (
          <Card key={category}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getCategoryIcon(category as FoodCategory)}</span>
                <div>
                  <CardTitle className="capitalize">
                    {category.toLowerCase().replace('_', ' ')}
                  </CardTitle>
                  <CardDescription>{items.length} items</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="divide-y">
              {items.map((item: MenuItem) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between hover:bg-orange-50/30 dark:hover:bg-orange-950/10 -mx-2 px-2 rounded-lg transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{item.name}</h3>
                      {item.is_active ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openModal(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {menuItems.length === 0 && (
        <Card className="py-16 bg-gradient-to-br from-orange-50/40 to-amber-50/20 dark:from-orange-950/10 dark:to-amber-950/5">
          <CardContent className="text-center">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-orange-900 dark:text-orange-100">No Menu Items</h3>
            <p className="text-orange-700/70 dark:text-orange-300/70 mb-4">Get started by adding your first menu item</p>
            <Button onClick={() => openModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Menu Item Name *</Label>
              <Input
                id="name"
                {...register('name', { required: 'Name is required' })}
                placeholder="e.g., Nasi Goreng, Ayam Bakar"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select 
                value={selectedCategory} 
                onValueChange={(value) => setValue('category', value as FoodCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(FoodCategory).filter(cat => cat !== FoodCategory.NO_WASTE).map((category) => (
                    <SelectItem key={category} value={category}>
                      <div className="flex items-center gap-2">
                        <span>{getCategoryIcon(category)}</span>
                        <span className="capitalize">{category.toLowerCase().replace('_', ' ')}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category.message}</p>
              )}
              {selectedCategory && (
                <Badge className={getCategoryColorClass(selectedCategory)}>
                  {getCategoryIcon(selectedCategory)} {selectedCategory}
                </Badge>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                {...register('description')}
                rows={3}
                placeholder="Optional description or notes about this menu item"
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Active items will be used for AI classification
                </p>
              </div>
              <Switch
                checked={isActive}
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
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
