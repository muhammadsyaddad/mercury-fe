import React, { useState, useEffect } from 'react';
import { Tray, CreateTrayData } from '../types';
import { trayService } from '../services/trayService';
import toast from 'react-hot-toast';

const TrayManagement: React.FC = () => {
  const [trays, setTrays] = useState<Tray[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  useEffect(() => {
    loadTrays();
  }, []);

  const loadTrays = async () => {
    try {
      setLoading(true);
      const response = await trayService.getTrays();
      setTrays(response);
    } catch (error) {
      toast.error('Failed to load trays');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
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
    setShowCreateModal(true);
  };

  const handleEdit = (tray: Tray) => {
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
    setImagePreview(tray.image_path ? `${import.meta.env.VITE_API_URL || ''}/static/${tray.image_path}` : null);
    setShowCreateModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let tray: any;
      
      if (editingTray) {
        tray = await trayService.updateTray(editingTray.id, formData);
        toast.success('Tray updated successfully');
      } else {
        tray = await trayService.createTray(formData);
        toast.success('Tray created successfully');
      }
      
      // Upload image if selected
      if (selectedImage && tray.id) {
        await trayService.uploadTrayImage(tray.id, selectedImage);
        toast.success('Image uploaded successfully');
      }
      
      setShowCreateModal(false);
      loadTrays();
    } catch (error) {
      toast.error(editingTray ? 'Failed to update tray' : 'Failed to create tray');
    }
  };

  const handleDelete = async (tray: Tray) => {
    if (!confirm(`Are you sure you want to delete "${tray.name}"?`)) {
      return;
    }

    try {
      await trayService.deleteTray(tray.id);
      toast.success('Tray deleted successfully');
      loadTrays();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete tray');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tray Management</h1>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Tray
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trays.map((tray) => (
          <div key={tray.id} className="bg-white rounded-lg shadow p-6">
            {/* Tray Image */}
            {tray.image_path && (
              <div className="mb-4">
                <img
                  src={`${import.meta.env.VITE_API_URL || ''}/static/${tray.image_path}`}
                  alt={tray.name}
                  className="w-full h-32 object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">{tray.name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(tray)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(tray)}
                  className="text-red-600 hover:text-red-800"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div><strong>Shape:</strong> {tray.shape}</div>
              <div><strong>Weight:</strong> {tray.weight}g</div>
              
              {tray.shape === 'round' && tray.diameter && (
                <div><strong>Diameter:</strong> {tray.diameter}cm</div>
              )}
              
              {(tray.shape === 'rectangle' || tray.shape === 'square') && tray.length && (
                <div><strong>Length:</strong> {tray.length}cm</div>
              )}
              
              {tray.shape === 'ellipse' && tray.length && (
                <div><strong>Major Axis:</strong> {tray.length}cm</div>
              )}
              
              {(tray.shape === 'rectangle' || tray.shape === 'ellipse') && tray.width && (
                <div><strong>{tray.shape === 'ellipse' ? 'Minor Axis' : 'Width'}:</strong> {tray.width}cm</div>
              )}
              
              {tray.description && (
                <div><strong>Description:</strong> {tray.description}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {trays.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No trays found. Create your first tray to get started.</p>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingTray ? 'Edit Tray' : 'Create New Tray'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Shape</label>
                <select
                  value={formData.shape}
                  onChange={(e) => setFormData({ ...formData, shape: e.target.value as 'round' | 'rectangle' | 'square' | 'ellipse' })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="round">Round</option>
                  <option value="rectangle">Rectangle</option>
                  <option value="square">Square</option>
                  <option value="ellipse">Ellipse</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Weight (grams)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>

              {formData.shape === 'round' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Diameter (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.diameter || ''}
                    onChange={(e) => setFormData({ ...formData, diameter: parseFloat(e.target.value) || undefined })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              )}

              {(formData.shape === 'rectangle' || formData.shape === 'square') && (
                <div>
                  <label className="block text-sm font-medium mb-1">Length (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.length || ''}
                    onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) || undefined })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              )}

              {formData.shape === 'ellipse' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Major Axis (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.length || ''}
                    onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) || undefined })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              )}

              {(formData.shape === 'rectangle' || formData.shape === 'ellipse') && (
                <div>
                  <label className="block text-sm font-medium mb-1">{formData.shape === 'ellipse' ? 'Minor Axis (cm)' : 'Width (cm)'}</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.width || ''}
                    onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) || undefined })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  rows={3}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-1">Tray Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full p-2 border rounded-lg"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Tray preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingTray ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrayManagement;