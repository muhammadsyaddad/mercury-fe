import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { toast } from 'react-hot-toast';

// Get API base URL - use current origin if VITE_API_URL is empty
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }
  // If empty, use current origin (handles HTTPS correctly)
  return window.location.origin;
};

const API_BASE_URL = getApiBaseUrl();
console.log('API_BASE_URL:', API_BASE_URL);

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/v1`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        
        const message = error.response?.data?.detail || error.message;
        toast.error(message);
        
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: { username: string; password: string }) {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    const response = await this.client.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  }

  async register(userData: any) {
    const response = await this.client.post('/auth/register', userData);
    return response.data;
  }

  // User endpoints
  async getCurrentUser() {
    const response = await this.client.get('/users/me');
    return response.data;
  }

  async getUsers(params?: { skip?: number; limit?: number }) {
    const response = await this.client.get('/users', { params });
    return response.data;
  }

  async createUser(userData: any) {
    const response = await this.client.post('/users', userData);
    return response.data;
  }

  async updateUser(userId: number, userData: any) {
    const response = await this.client.put(`/users/${userId}`, userData);
    return response.data;
  }

  async deleteUser(userId: number) {
    const response = await this.client.delete(`/users/${userId}`);
    return response.data;
  }

  // Camera endpoints
  async getCameras(params?: { skip?: number; limit?: number }) {
    const response = await this.client.get('/cameras', { params });
    return response.data;
  }

  async getCamera(cameraId: number) {
    const response = await this.client.get(`/cameras/${cameraId}`);
    return response.data;
  }

  async createCamera(cameraData: any) {
    const response = await this.client.post('/cameras', cameraData);
    return response.data;
  }

  async updateCamera(cameraId: number, cameraData: any) {
    const response = await this.client.put(`/cameras/${cameraId}`, cameraData);
    return response.data;
  }

  async deleteCamera(cameraId: number) {
    const response = await this.client.delete(`/cameras/${cameraId}`);
    return response.data;
  }

  async updateCameraROI(cameraId: number, roiConfig: any) {
    const response = await this.client.post(`/cameras/${cameraId}/roi`, roiConfig);
    return response.data;
  }

  // Detection endpoints
  async getDetections(params?: {
    page?: number;
    page_size?: number;
    camera_id?: number;
    category?: string;
    review_status?: string;
    start_date?: string;
    end_date?: string;
    include_no_waste?: boolean;
  }) {
    const response = await this.client.get('/detections', { params });
    return response.data;
  }

  async getDetection(detectionId: number) {
    const response = await this.client.get(`/detections/${detectionId}`);
    return response.data;
  }

  async deleteDetection(detectionId: number) {
    const response = await this.client.delete(`/detections/${detectionId}`);
    return response.data;
  }

  async reviewDetection(detectionId: number, reviewData: any) {
    const response = await this.client.put(`/detections/${detectionId}/review`, reviewData);
    return response.data;
  }

  async getDetectionStats(params?: { camera_id?: number }) {
    const response = await this.client.get('/detections/stats', { params });
    return response.data;
  }

  async getCategorySummary(days: number = 30) {
    const response = await this.client.get('/detections/categories/summary', {
      params: { days },
    });
    return response.data;
  }

  async getWeightAnalytics(params?: {
    days?: number;
    camera_id?: number;
    category?: string;
  }) {
    const response = await this.client.get('/detections/weight/analytics', { params });
    return response.data;
  }

  async getWeightTrends(params?: {
    days?: number;
    interval?: 'daily' | 'weekly' | 'monthly';
    camera_id?: number;
  }) {
    const response = await this.client.get('/detections/weight/trends', { params });
    return response.data;
  }

  async exportDetections(params?: {
    start_date?: string;
    end_date?: string;
    camera_id?: number;
    review_status?: string;
    include_no_waste?: boolean;
  }) {
    const response = await this.client.get('/detections/export/csv', { params });
    return response.data;
  }

  // Monitoring endpoints
  async getCameraStatuses() {
    const response = await this.client.get('/monitoring/cameras');
    return response.data;
  }

  async startCameraMonitoring(cameraId: number) {
    const response = await this.client.post(`/monitoring/cameras/${cameraId}/start`);
    return response.data;
  }

  async stopCameraMonitoring(cameraId: number) {
    const response = await this.client.post(`/monitoring/cameras/${cameraId}/stop`);
    return response.data;
  }

  async restartCameraMonitoring(cameraId: number) {
    const response = await this.client.post(`/monitoring/cameras/${cameraId}/restart`);
    return response.data;
  }

  async testCameraConnection(connectionData: {
    ip_address: string;
    port: number;
    username: string;
    password: string;
    rtsp_path: string;
  }) {
    const response = await this.client.post('/cameras/test-connection', connectionData);
    return response.data;
  }

  async captureScreenshot(cameraId: number): Promise<string> {
    const response = await this.client.get(`/cameras/${cameraId}/screenshot`, {
      responseType: 'blob',
    });
    return URL.createObjectURL(response.data);
  }

  async saveROIImage(cameraId: number, imageBlob: Blob) {
    const formData = new FormData();
    formData.append('roi_image', imageBlob, `camera_${cameraId}_roi.jpg`);
    
    const response = await this.client.post(`/cameras/${cameraId}/roi-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Utility method for file uploads
  async uploadFile(file: File, endpoint: string, config?: AxiosRequestConfig) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await this.client.post(endpoint, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
    
    return response.data;
  }

  // Settings endpoints
  async getCurrencySettings() {
    const response = await this.client.get('/settings/currency');
    return response.data;
  }

  async updateCurrencySettings(currencyData: { default_currency: string }) {
    const response = await this.client.put('/settings/currency', currencyData);
    return response.data;
  }

  async getSystemSettings(params?: { skip?: number; limit?: number }) {
    const response = await this.client.get('/settings', { params });
    return response.data;
  }

  async getSystemSetting(key: string) {
    const response = await this.client.get(`/settings/${key}`);
    return response.data;
  }

  async createSystemSetting(settingData: {
    setting_key: string;
    setting_value: string;
    description?: string;
    is_active?: boolean;
  }) {
    const response = await this.client.post('/settings', settingData);
    return response.data;
  }

  async updateSystemSetting(key: string, settingData: {
    setting_value?: string;
    description?: string;
    is_active?: boolean;
  }) {
    const response = await this.client.put(`/settings/${key}`, settingData);
    return response.data;
  }

  async deleteSystemSetting(key: string) {
    const response = await this.client.delete(`/settings/${key}`);
    return response.data;
  }

  // Get image URL
  getImageUrl(imagePath: string): string {
    return `${API_BASE_URL}/static/${imagePath}`;
  }

  // Get detection image URL (with GCS support)
  async getDetectionImageUrl(detectionId: number, imageType: string): Promise<string> {
    const response = await this.client.get(`/images/detection/${detectionId}/image/${imageType}/url`);
    return response.data.url;
  }

  // Menu Items endpoints
  async getMenuItems(params?: { page?: number; page_size?: number; active_only?: boolean }) {
    const response = await this.client.get('/menu-items', { params });
    return response.data;
  }

  async getActiveMenuItems() {
    const response = await this.client.get('/menu-items/active');
    return response.data;
  }

  async getMenuItem(id: number) {
    const response = await this.client.get(`/menu-items/${id}`);
    return response.data;
  }

  async createMenuItem(data: any) {
    const response = await this.client.post('/menu-items', data);
    return response.data;
  }

  async updateMenuItem(id: number, data: any) {
    const response = await this.client.put(`/menu-items/${id}`, data);
    return response.data;
  }

  async deleteMenuItem(id: number) {
    const response = await this.client.delete(`/menu-items/${id}`);
    return response.data;
  }
}

export const apiService = new ApiService();
export const settingsApi = {
  getCurrencySettings: () => apiService.getCurrencySettings(),
  updateCurrencySettings: (data: { default_currency: string }) => apiService.updateCurrencySettings(data),
  getSystemSettings: (params?: { skip?: number; limit?: number }) => apiService.getSystemSettings(params),
  getSystemSetting: (key: string) => apiService.getSystemSetting(key),
  createSystemSetting: (data: any) => apiService.createSystemSetting(data),
  updateSystemSetting: (key: string, data: any) => apiService.updateSystemSetting(key, data),
  deleteSystemSetting: (key: string) => apiService.deleteSystemSetting(key),
};
export default apiService;