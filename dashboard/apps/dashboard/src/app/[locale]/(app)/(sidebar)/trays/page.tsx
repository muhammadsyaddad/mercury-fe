"use client";

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@vision_dashboard/ui/card";
import { Button } from "@vision_dashboard/ui/button";
import { Input } from "@vision_dashboard/ui/input";
import { Label } from "@vision_dashboard/ui/label";
import { Spinner } from "@vision_dashboard/ui/spinner";
import { Textarea } from "@vision_dashboard/ui/textarea";
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
import { trayService } from '@/services/trayService';
import type { Tray, CreateTrayData } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function TraysPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingTray, setEditingTray] = useState<Tray | null>(null);
  const [formData, setFormData] = useState<CreateTrayData>({
    name: '',
    shape: 'round',
    weight: 0,
    length: undefined,
    width: undefined,
    diameter: undefined,
    description: ''
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  // Fetch trays
  const { data: trays = [], isLoading } = useQuery<Tray[]>({
    queryKey: ['trays'],
    queryFn: () => trayService.getTrays(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateTrayData) => {
      const tray = await trayService.createTray(data);
      if (selectedImage && tray.id) {
        await trayService.uploadTrayImage(tray.id, selectedImage);
      }
      return tray;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trays'] });
      toast.success('Tray created successfully');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create tray');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateTrayData> }) => {
      const tray = await trayService.updateTray(id, data);
      if (selectedImage && tray.id) {
        await trayService.uploadTrayImage(tray.id, selectedImage);
      }
      return tray;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trays'] });
      toast.success('Tray updated successfully');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update tray');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: trayService.deleteTray,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trays'] });
      toast.success('Tray deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete tray');
    },
  });

  const openModal = (tray?: Tray) => {
    if (tray) {
      setEditingTray(tray);
      setFormData({
        name: tray.name,
        shape: tray.shape,
        weight: tray.weight,
        length: tray.length,
        width: tray.width,
        diameter: tray.diameter,
        description: tray.description || ''
      });
      setSelectedImage(null);
      setImagePreview(tray.image_path ? `${API_BASE_URL}/static/${tray.image_path}` : null);
    } else {
      setEditingTray(null);
      setFormData({
        name: '',
        shape: 'round',
        weight: 0,
        length: undefined,
        width: undefined,
        diameter: undefined,
        description: ''
      });
      setSelectedImage(null);
      setImagePreview(null);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTray(null);
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTray) {
      updateMutation.mutate({ id: editingTray.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (tray: Tray) => {
    if (window.confirm(`Are you sure you want to delete "${tray.name}"?`)) {
      deleteMutation.mutate(tray.id);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getShapeLabel = (shape: string) => {
    switch (shape) {
      case 'round': return 'Round';
      case 'rectangle': return 'Rectangle';
      case 'square': return 'Square';
      case 'ellipse': return 'Ellipse';
      default: return shape;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner className="h-12 w-12 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading trays...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-teal-50 via-cyan-50/80 to-emerald-50/60 dark:from-teal-950/40 dark:via-cyan-950/30 dark:to-emerald-950/20 rounded-xl p-6 border border-teal-200/60 dark:border-teal-800/40">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/40 rounded-xl flex items-center justify-center ring-1 ring-teal-200 dark:ring-teal-800">
            <ImageIcon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-teal-900 dark:text-teal-100">Tray Management</h1>
            <p className="text-teal-700/70 dark:text-teal-300/70 mt-1">
              Manage tray configurations for weight calculations
            </p>
          </div>
        </div>
        
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Tray
        </Button>
      </div>

      {/* Trays Grid */}
      {trays.length === 0 ? (
        <Card className="p-12 text-center bg-gradient-to-br from-teal-50/40 to-cyan-50/20 dark:from-teal-950/10 dark:to-cyan-950/5">
          <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-teal-600 dark:text-teal-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-teal-900 dark:text-teal-100">No Trays Found</h3>
          <p className="text-teal-700/70 dark:text-teal-300/70 mb-6">
            Create your first tray to get started with weight calculations
          </p>
          <Button onClick={() => openModal()}>
            Add First Tray
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trays.map((tray) => (
            <Card key={tray.id} className="border-t-4 border-t-teal-300 dark:border-t-teal-700 hover:shadow-md transition-shadow">
              {/* Tray Image */}
              {tray.image_path && (
                <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                  <img
                    src={`${API_BASE_URL}/static/${tray.image_path}`}
                    alt={tray.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{tray.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openModal(tray)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(tray)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shape:</span>
                  <span className="font-medium bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-md text-xs">{getShapeLabel(tray.shape)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weight:</span>
                  <span className="font-medium">{tray.weight}g</span>
                </div>
                
                {tray.shape === 'round' && tray.diameter && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Diameter:</span>
                    <span className="font-medium">{tray.diameter}cm</span>
                  </div>
                )}
                
                {(tray.shape === 'rectangle' || tray.shape === 'square') && tray.length && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Length:</span>
                    <span className="font-medium">{tray.length}cm</span>
                  </div>
                )}
                
                {tray.shape === 'ellipse' && tray.length && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Major Axis:</span>
                    <span className="font-medium">{tray.length}cm</span>
                  </div>
                )}
                
                {(tray.shape === 'rectangle' || tray.shape === 'ellipse') && tray.width && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tray.shape === 'ellipse' ? 'Minor Axis' : 'Width'}:</span>
                    <span className="font-medium">{tray.width}cm</span>
                  </div>
                )}
                
                {tray.description && (
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground text-xs">{tray.description}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal for Creating/Editing Trays */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTray ? 'Edit Tray' : 'Create New Tray'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shape">Shape</Label>
              <Select
                value={formData.shape}
                onValueChange={(value) => setFormData({ ...formData, shape: value as CreateTrayData['shape'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shape" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round">Round</SelectItem>
                  <SelectItem value="rectangle">Rectangle</SelectItem>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="ellipse">Ellipse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (grams)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: Number.parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            {formData.shape === 'round' && (
              <div className="space-y-2">
                <Label htmlFor="diameter">Diameter (cm)</Label>
                <Input
                  id="diameter"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.diameter || ''}
                  onChange={(e) => setFormData({ ...formData, diameter: Number.parseFloat(e.target.value) || undefined })}
                />
              </div>
            )}

            {(formData.shape === 'rectangle' || formData.shape === 'square') && (
              <div className="space-y-2">
                <Label htmlFor="length">Length (cm)</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.length || ''}
                  onChange={(e) => setFormData({ ...formData, length: Number.parseFloat(e.target.value) || undefined })}
                />
              </div>
            )}

            {formData.shape === 'ellipse' && (
              <div className="space-y-2">
                <Label htmlFor="length">Major Axis (cm)</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.length || ''}
                  onChange={(e) => setFormData({ ...formData, length: Number.parseFloat(e.target.value) || undefined })}
                />
              </div>
            )}

            {(formData.shape === 'rectangle' || formData.shape === 'ellipse') && (
              <div className="space-y-2">
                <Label htmlFor="width">{formData.shape === 'ellipse' ? 'Minor Axis (cm)' : 'Width (cm)'}</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.width || ''}
                  onChange={(e) => setFormData({ ...formData, width: Number.parseFloat(e.target.value) || undefined })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Tray Image (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Image
                </Button>
                {selectedImage && (
                  <span className="text-sm text-muted-foreground">{selectedImage.name}</span>
                )}
              </div>
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Tray preview"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>

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
                 editingTray ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
