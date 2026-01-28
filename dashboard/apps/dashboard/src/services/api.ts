import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

/**
 * Resolve base URL for API calls.
 *
 * Priority:
 * 1. NEXT_PUBLIC_API_URL environment variable (useful for staging/production).
 * 2. If not set and we're in the browser, use window.location.origin (useful for local dev and relative deployments).
 * 3. Fallback to empty string to avoid invalid URL building on the server.
 *
 * Note: On the server (during SSR), `window` is undefined, so the function returns an empty string.
 *       The caller (ApiService) appends `/api/v1` to this base, so ensure you set NEXT_PUBLIC_API_URL
 *       when running server-side or in environments where origin cannot be derived from `window`.
 */
const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }
  // If empty, use current origin (handles HTTPS correctly)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

/**
 * Final resolved API base URL used for building absolute asset URLs.
 * Example: `${API_BASE_URL}/static/...`
 */
const API_BASE_URL = getApiBaseUrl();

class ApiService {
  private client: AxiosInstance;

  constructor() {
    // Create an axios instance scoped to the API's base path.
    // All requests made via `this.client` will use this base URL.
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/v1`,
      headers: {
        'Content-Type': 'application/json',
      },
      // Allow cookies (session cookies) to be sent with requests when same-origin
      withCredentials: true,
    });

    // Request interceptor:
    // - Runs for every request before it is sent.
    // - We attach the Authorization header when a token is available in localStorage.
    // - Note: localStorage is only available on the client; guard with `typeof window !== 'undefined'`.
    // - If you prefer cookies or more secure storage (HttpOnly cookies), change this logic accordingly.
    // No automatic Authorization header from localStorage.
    // We rely on cookie-based session (HttpOnly) for authentication.
    this.client.interceptors.request.use((config) => config, (error) => Promise.reject(error));

    // Response interceptor:
    // - Centralized error handling for all responses.
    // - If we get a 401 (unauthorized), assume session is invalid: clear credentials and redirect to /login.
    // - Also show a user-friendly error message using a toast.
    // - Finally, rethrow the error so callers can handle it if needed.
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Force navigation to login to get a fresh session.
            window.location.href = '/login';
          }
        }

        // Prefer detail from server payload; fallback to the error message.
        const message = error.response?.data?.detail || error.message;
        toast.error(message);

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  /**
   * Login with username/password.
   *
   * Note: the backend often expects a form-encoded body. There are two common ways:
   *  - application/x-www-form-urlencoded: use URLSearchParams or a query string.
   *  - multipart/form-data: use FormData (browsers will set correct boundary automatically).
   *
   * This code uses FormData and sets 'application/x-www-form-urlencoded' header — which is an uncommon
   * combination. If you encounter server errors, prefer using URLSearchParams:
   *   const params = new URLSearchParams();
   *   params.append('username', credentials.username);
   *   params.append('password', credentials.password);
   *   this.client.post('/auth/login', params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
   *
   * Keep an eye on the backend's expected content type.
   */
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
    meal_period?: string;
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

  async getCategorySummary(days = 30) {
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

  /**
   * Capture a screenshot from the camera and return a browser Blob URL.
   *
   * The request expects binary data, so we set responseType: 'blob'.
   * We then create an object URL that can be used as an <img src> or downloaded.
   *
   * Important: object URLs are not automatically released. If you create many,
   * call URL.revokeObjectURL(url) when the image is no longer needed to free memory.
   */
  async captureScreenshot(cameraId: number) {
    const response = await this.client.get(`/cameras/${cameraId}/screenshot`, {
      responseType: 'blob',
    });
    return URL.createObjectURL(response.data);
  }

  /**
   * Upload an ROI image for a camera.
   * This uses multipart/form-data which allows sending binary files (the browser sets the correct boundary).
   */
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

  /**
   * Generic file uploader.
   * - `endpoint` should be a path like '/uploads' (it will be appended to baseURL).
   * - `config` can include additional axios config (e.g., onUploadProgress).
   * - We merge provided headers so callers can override behavior.
   */
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

  /**
   * Build an absolute URL to a static image served by the API.
   * Use this for rendering <img src={apiService.getImageUrl(path)} />
   * Note: API_BASE_URL may be empty during SSR if not configured, so ensure
   * NEXT_PUBLIC_API_URL is set when server-side rendering absolute URLs.
   */
  getImageUrl(imagePath: string): string {
    return `${API_BASE_URL}/static/${imagePath}`;
  }

  /**
   * Get a signed URL for a detection image (stored in GCS or similar).
   * The server typically returns a time-limited URL (response.data.url) which the client
   * can use directly in image tags or downloads.
   */
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
/**
 * `settingsApi` groups settings-related methods with a narrower interface.
 * This makes it easier to mock or pass only the settings functions to
 * React Query hooks and other consumers that don't need full ApiService.
 */
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
