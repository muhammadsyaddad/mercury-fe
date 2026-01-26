import axios from 'axios';
import { Tray, CreateTrayData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const trayService = {
  async getTrays(activeOnly: boolean = true): Promise<Tray[]> {
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