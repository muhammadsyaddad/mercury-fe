import { createApiClient } from './apiConfig';
import type { Tray, CreateTrayData } from '../types';

const api = createApiClient();

export const trayService = {
  async getTrays(activeOnly = true): Promise<Tray[]> {
    const response = await api.get('/trays', {
      params: { active_only: activeOnly }
    });
    return response.data;
  },

  async getTray(id: number): Promise<Tray> {
    const response = await api.get(`/trays/${id}`);
    return response.data;
  },

  async createTray(data: CreateTrayData): Promise<Tray> {
    const response = await api.post('/trays', data);
    return response.data;
  },

  async updateTray(id: number, data: Partial<CreateTrayData>): Promise<Tray> {
    const response = await api.put(`/trays/${id}`, data);
    return response.data;
  },

  async deleteTray(id: number): Promise<void> {
    await api.delete(`/trays/${id}`);
  },

  async uploadTrayImage(id: number, file: File): Promise<{ message: string; image_path: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/trays/${id}/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};
