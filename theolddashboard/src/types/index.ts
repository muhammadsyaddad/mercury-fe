export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  REVIEWER = 'reviewer',
  STAFF = 'staff',
  USER = 'user'
}

export interface Camera {
  id: number;
  name: string;
  ip_address: string;
  port: number;
  username: string;
  password: string;
  rtsp_url: string;
  rtsp_path: string;
  camera_type: string;
  location?: string;
  roi_config?: ROIConfig;
  ocr_capture_delay: number;
  ocr_preprocessing_config?: OCRPreprocessingConfig;
  tray_id?: number;
  net_weight_calculation_method: 'difference' | 'subtract_tray';
  pixels_per_cm?: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  created_by: number;
}

export interface ROIConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  enabled: boolean;
  type: 'motion' | 'food' | 'ocr';
}

export interface OCRPreprocessingConfig {
  rotation: number; // 0, 90, 180, 270 degrees
  flip_horizontal: boolean;
  flip_vertical: boolean;
}

export interface Detection {
  id: number;
  camera_id: number;
  image_path: string;
  food_image_1_path?: string;
  food_image_2_path?: string;
  initial_ocr_path?: string;
  initial_ocr_2_path?: string;
  final_ocr_path?: string;
  final_ocr_2_path?: string;
  category: FoodCategory;
  confidence: number;
  roi_coordinates?: any;
  motion_data?: any;
  description?: string;
  initial_weight?: number;  // Weight before disposal
  final_weight?: number;    // Weight after disposal
  weight?: number;          // Calculated difference
  net_weight?: number;      // Net weight after tray calculation
  initial_ocr_raw_text?: string;  // Raw OCR text from initial weight extraction
  final_ocr_raw_text?: string;    // Raw OCR text from final weight extraction
  initial_ocr_confidence?: number; // Confidence score for initial OCR
  final_ocr_confidence?: number;   // Confidence score for final OCR
  tray_id?: number;               // ID of detected tray used for weight calculation
  tray_name?: string;             // Name of detected tray used for weight calculation
  tray_weight?: number;           // Weight of detected tray in grams
  ai_detected_shape?: string;     // AI detected shape (round, square, rectangle, ellipse)
  ai_tray_bbox?: number[];        // AI detected bounding box [ymin, xmin, ymax, xmax]
  ai_estimated_dimensions?: {     // AI estimated dimensions in pixels
    length?: number;              // Length in pixels (longer dimension)
    width?: number;               // Width in pixels (shorter dimension)
    height?: number;              // Alternative naming for backward compatibility
  };
  detected_at: string;
  review_status?: ReviewStatus;
  reviewed_by?: number;
  reviewed_at?: string;
  review_notes?: string;
  corrected_category?: FoodCategory;
  corrected_initial_weight?: number;
  corrected_final_weight?: number;
  corrected_description?: string;
  corrected_tray_id?: number;
  net_weight_calculation_method?: 'difference' | 'subtract_tray';

  // Computed meal period based on detection time
  meal_period?: MealPeriod;

  // Relationship fields (populated when using includes/joins)
  tray?: Tray;
  camera?: Camera;
}

export enum FoodCategory {
  PROTEIN = 'PROTEIN',
  CARBOHYDRATE = 'CARBOHYDRATE',
  VEGETABLES = 'VEGETABLES',
  FRUITS = 'FRUITS',
  PASTRY = 'PASTRY',
  OTHERS = 'OTHERS',
  NO_WASTE = 'NO_WASTE'
}

export enum ReviewStatus {
  DETECTION_OK = 'DETECTION_OK',
  NEED_REVISION = 'NEED_REVISION',
  DETECTION_REJECTED = 'DETECTION_REJECTED',
  REVISION_APPROVED = 'REVISION_APPROVED'
}

export enum MealPeriod {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER'
}

export interface DetectionStats {
  total_detections: number;
  category_breakdown: Record<string, number>;
  today_count: number;
  week_count: number;
  month_count: number;
}

export interface WeightAnalytics {
  total_net_weight: number;
  average_net_weight: number;
  weight_by_category: Record<string, {
    total_weight: number;
    average_weight: number;
    count: number;
  }>;
  weight_by_method: Record<string, {
    total_weight: number;
    count: number;
  }>;
  daily_totals: Array<{
    date: string;
    total_weight: number;
    count: number;
  }>;
  top_waste_categories: Array<{
    category: string;
    total_weight: number;
    percentage: number;
  }>;
}

export interface WeightTrend {
  date: string;
  total_weight: number;
  average_weight: number;
  count: number;
  categories: Record<string, number>;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  full_name: string;
  password: string;
  role: UserRole;
}

export interface Tray {
  id: number;
  name: string;
  shape: 'round' | 'rectangle' | 'square' | 'ellipse';
  weight: number; // Weight in grams
  length?: number; // Length in cm (for rectangle/square/ellipse major axis)
  width?: number; // Width in cm (for rectangle/square/ellipse minor axis) 
  diameter?: number; // Diameter in cm (for round)
  description?: string;
  image_path?: string; // Optional image path for visual identification
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  created_by: number;
}

export interface CreateTrayData {
  name: string;
  shape: 'round' | 'rectangle' | 'square' | 'ellipse';
  weight: number; // Weight in grams
  length?: number; // Length in cm (for rectangle/square/ellipse major axis)
  width?: number; // Width in cm (for rectangle/square/ellipse minor axis)
  diameter?: number; // Diameter in cm (for round)
  description?: string;
  image_path?: string; // Optional image path for visual identification
}

export interface CreateCameraData {
  name: string;
  ip_address: string;
  port: number;
  username: string;
  password: string;
  rtsp_path: string;
  camera_type: string;
  location?: string;
  roi_config?: ROIConfig;
  ocr_capture_delay: number;
  ocr_preprocessing_config?: OCRPreprocessingConfig;
  tray_id?: number;
  net_weight_calculation_method: 'difference' | 'subtract_tray';
  pixels_per_cm?: number;
}

export interface CameraStatus {
  status: 'active' | 'inactive' | 'stopping';
  thread_alive?: boolean;
  camera_name?: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedDetectionResponse extends PaginatedResponse<Detection> {}

export interface MenuItem {
  id: number;
  name: string;
  category: FoodCategory;
  description?: string;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at?: string;
}

export interface CreateMenuItemData {
  name: string;
  category: FoodCategory;
  description?: string;
  is_active?: boolean;
}

export interface PaginatedMenuItemResponse extends PaginatedResponse<MenuItem> {}