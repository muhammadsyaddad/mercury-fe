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
import { Plus, Pencil, Trash2, UtensilsCrossed, CheckCircle, XCircle } from 'lucide-react';

interface MenuItemForm {
  name: string;
  category: FoodCategory;
  description?: string;
  is_active: boolean;
}

const getCategoryIcon = (category: FoodCategory) => {
  const icons: Record<FoodCategory, string> = {
    [FoodCategory.PROTEIN]: '🥩',
    [FoodCategory.CARBOHYDRATE]: '🍞',
    [FoodCategory.VEGETABLES]: '🥬',
    [FoodCategory.FRUITS]: '🍎',
    [FoodCategory.PASTRY]: '🧁',
    [FoodCategory.OTHERS]: '🍽️',
    [FoodCategory.NO_WASTE]: '✅',
  };
  return icons[category] || '🍽️';
};

const getCategoryColor = (category: FoodCategory) => {
  const colors: Record<FoodCategory, string> = {
    [FoodCategory.PROTEIN]: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200',
    [FoodCategory.CARBOHYDRATE]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
    [FoodCategory.VEGETABLES]: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
    [FoodCategory.FRUITS]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200',
    [FoodCategory.PASTRY]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200',
    [FoodCategory.OTHERS]: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200',
    [FoodCategory.NO_WASTE]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
};

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

  const menuItems = menuData?.items || [];

  // Group items by category
  const itemsByCategory = menuItems.reduce((acc: Record<string, MenuItem[]>, item: MenuItem) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Menu Management</h1>
            <p className="text-muted-foreground">Manage your restaurant's menu items for AI classification and pricing</p>
          </div>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Menu Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Items</div>
            <div className="text-2xl font-bold">{menuItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Active</div>
            <div className="text-2xl font-bold text-green-600">
              {menuItems.filter((i: MenuItem) => i.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Inactive</div>
            <div className="text-2xl font-bold text-muted-foreground">
              {menuItems.filter((i: MenuItem) => !i.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Categories</div>
            <div className="text-2xl font-bold text-primary">{Object.keys(itemsByCategory).length}</div>
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
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between">
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
        <Card className="py-16">
          <CardContent className="text-center">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold mb-2">No Menu Items</h3>
            <p className="text-muted-foreground mb-4">Get started by adding your first menu item</p>
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
                <Badge className={getCategoryColor(selectedCategory)}>
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
