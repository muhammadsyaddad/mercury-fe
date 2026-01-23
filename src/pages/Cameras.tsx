import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Camera, CreateCameraData, UserRole, Tray } from '../types';
import { apiService } from '../services/api';
import { trayService } from '../services/trayService';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import ROIEditor from '../components/ROIEditor';
import { Plus, Camera as CameraIcon, Play, Square, RotateCcw, Target, Edit, Trash2, MapPin, Wifi } from 'lucide-react';

const Cameras: React.FC = () => {
  const { user, hasAnyRole } = useAuth();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [cameraStatuses, setCameraStatuses] = useState<Record<string, any>>({});
  const [trays, setTrays] = useState<Tray[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Camera | null>(null);
  const [showROIEditor, setShowROIEditor] = useState<Camera | null>(null);

  const canManageCameras = hasAnyRole([UserRole.MANAGER, UserRole.ADMIN]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<CreateCameraData>({
    defaultValues: {
      camera_type: 'hikvision',
      rtsp_path: '/Streaming/Channels/101',
      port: 554,
      ocr_capture_delay: 5,
      net_weight_calculation_method: 'difference',
      pixels_per_cm: 37.8,
      ocr_preprocessing_config: {
        rotation: 0,
        flip_horizontal: false,
        flip_vertical: false
      }
    }
  });

  // Watch form values for RTSP URL preview
  const watchedValues = watch(['ip_address', 'port', 'username', 'password', 'rtsp_path', 'camera_type']);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  useEffect(() => {
    loadCameras();
    loadCameraStatuses();
    loadTrays();
    const interval = setInterval(loadCameraStatuses, 10000); // Update statuses every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadTrays = async () => {
    try {
      const traysData = await trayService.getTrays();
      setTrays(traysData);
    } catch (error) {
      console.error('Failed to load trays:', error);
    }
  };

  const loadCameras = async () => {
    try {
      const data = await apiService.getCameras();
      setCameras(data);
    } catch (error) {
      toast.error('Failed to load cameras');
    } finally {
      setLoading(false);
    }
  };

  const loadCameraStatuses = async () => {
    try {
      const statuses = await apiService.getCameraStatuses();
      setCameraStatuses(statuses);
    } catch (error) {
      console.error('Failed to load camera statuses:', error);
    }
  };

  const handleAddCamera = async (data: CreateCameraData) => {
    try {
      await apiService.createCamera(data);
      toast.success('Camera added successfully');
      setShowAddModal(false);
      reset();
      loadCameras();
    } catch (error) {
      toast.error('Failed to add camera');
    }
  };

  const handleEditCamera = async (data: CreateCameraData) => {
    if (!editingCamera) return;
    
    try {
      await apiService.updateCamera(editingCamera.id, data);
      toast.success('Camera updated successfully');
      setEditingCamera(null);
      reset();
      loadCameras();
    } catch (error) {
      toast.error('Failed to update camera');
    }
  };

  const handleDeleteCamera = async (camera: Camera) => {
    try {
      await apiService.deleteCamera(camera.id);
      toast.success('Camera deleted successfully');
      setShowDeleteModal(null);
      loadCameras();
    } catch (error) {
      toast.error('Failed to delete camera');
    }
  };

  const handleStartMonitoring = async (cameraId: number) => {
    try {
      await apiService.startCameraMonitoring(cameraId);
      toast.success('Camera monitoring started');
      loadCameraStatuses();
    } catch (error) {
      toast.error('Failed to start monitoring');
    }
  };

  const handleStopMonitoring = async (cameraId: number) => {
    try {
      await apiService.stopCameraMonitoring(cameraId);
      toast.success('Camera monitoring stopped');
      loadCameraStatuses();
    } catch (error) {
      toast.error('Failed to stop monitoring');
    }
  };

  const handleRestartMonitoring = async (cameraId: number) => {
    try {
      await apiService.restartCameraMonitoring(cameraId);
      toast.success('Camera monitoring restarted');
      loadCameraStatuses();
    } catch (error) {
      toast.error('Failed to restart monitoring');
    }
  };

  const openEditModal = (camera: Camera) => {
    setEditingCamera(camera);
    setValue('name', camera.name);
    setValue('ip_address', camera.ip_address);
    setValue('port', camera.port);
    setValue('username', camera.username);
    setValue('password', camera.password);
    setValue('rtsp_path', camera.rtsp_path || '/Streaming/Channels/101');
    setValue('camera_type', camera.camera_type || 'hikvision');
    setValue('location', camera.location || '');
    setValue('ocr_capture_delay', camera.ocr_capture_delay || 5);
    setValue('net_weight_calculation_method', camera.net_weight_calculation_method || 'difference');
    setValue('pixels_per_cm', camera.pixels_per_cm || 37.8);
    
    // Set OCR preprocessing configuration
    if (camera.ocr_preprocessing_config) {
      setValue('ocr_preprocessing_config.rotation', camera.ocr_preprocessing_config.rotation || 0);
      setValue('ocr_preprocessing_config.flip_horizontal', camera.ocr_preprocessing_config.flip_horizontal || false);
      setValue('ocr_preprocessing_config.flip_vertical', camera.ocr_preprocessing_config.flip_vertical || false);
    } else {
      setValue('ocr_preprocessing_config.rotation', 0);
      setValue('ocr_preprocessing_config.flip_horizontal', false);
      setValue('ocr_preprocessing_config.flip_vertical', false);
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingCamera(null);
    setIsTestingConnection(false);
    reset();
  };

  // Generate RTSP URL preview
  const generateRTSPUrl = (ip: string, port: number, username: string, password: string, rtspPath: string = '/Streaming/Channels/101') => {
    if (!ip || !port || !username || !password) return '';
    return `rtsp://${username}:${password}@${ip}:${port}${rtspPath}`;
  };

  // Get default RTSP path based on camera type
  const getDefaultRTSPPath = (cameraType: string) => {
    const defaults: Record<string, string> = {
      'hikvision': '/Streaming/Channels/101',
      'dahua': '/cam/realmonitor?channel=1&subtype=0',
      'axis': '/axis-media/media.amp',
      'bosch': '/rtsp_tunnel',
      'generic': '/stream'
    };
    return defaults[cameraType] || '/Streaming/Channels/101';
  };

  // Validate IP address format
  const isValidIP = (ip: string) => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  };

  // Test camera connection
  const testCameraConnection = async () => {
    const [ip, port, username, password, rtsp_path] = watchedValues;
    
    if (!ip || !port || !username || !password || !rtsp_path) {
      toast.error('Please fill in all connection details first');
      return;
    }

    if (!isValidIP(ip)) {
      toast.error('Please enter a valid IP address');
      return;
    }

    setIsTestingConnection(true);
    try {
      const response = await apiService.testCameraConnection({
        ip_address: ip,
        port: Number(port),
        username,
        password,
        rtsp_path
      });
      
      if (response.success) {
        toast.success('Camera connection successful!');
      } else {
        toast.error(`Connection failed: ${response.message}`);
      }
    } catch (error) {
      toast.error('Failed to test camera connection');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'stopping': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢';
      case 'inactive': return '🔴';
      case 'stopping': return '🟡';
      default: return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Camera Management
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Manage your IP cameras and monitoring</p>
            </div>
            {canManageCameras && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Camera
              </button>
            )}
          </div>
        </div>

        {/* Cameras Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cameras.map((camera) => {
            const status = cameraStatuses[camera.id] || { status: 'inactive' };
            return (
              <div key={camera.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                        <CameraIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{camera.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Wifi className="w-4 h-4" />
                          {camera.ip_address}:{camera.port}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">{getStatusIcon(status.status)}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(status.status)}`}>
                        {status.status}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50/50 rounded-xl p-4 space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Location:
                      </span>
                      <span className="text-sm font-semibold text-gray-900">{camera.location || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Username:</span>
                      <span className="text-sm font-semibold text-gray-900">{camera.username}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className="text-sm font-semibold text-gray-900">{camera.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {status.status === 'active' ? (
                      <button
                        onClick={() => handleStopMonitoring(camera.id)}
                        className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-md hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center gap-1"
                      >
                        <Square className="w-3 h-3" />
                        Stop
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartMonitoring(camera.id)}
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-md hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        Start
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleRestartMonitoring(camera.id)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-md hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restart
                    </button>

                    <button
                      onClick={() => setShowROIEditor(camera)}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-md hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center gap-1"
                    >
                      <Target className="w-3 h-3" />
                      ROI
                    </button>

                    {canManageCameras && (
                      <>
                        <button
                          onClick={() => openEditModal(camera)}
                          className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-md hover:from-gray-600 hover:to-gray-700 transition-all duration-200 flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(camera)}
                          className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-md hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add/Edit Camera Modal */}
        {(showAddModal || editingCamera) && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/20">
              <div className="p-8">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-6">
                  {editingCamera ? 'Edit Camera' : 'Add New Camera'}
                </h2>
              
              <form onSubmit={handleSubmit(editingCamera ? handleEditCamera : handleAddCamera)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Camera Name
                  </label>
                  <input
                    {...register('name', { required: 'Camera name is required' })}
                    className={`input ${errors.name ? 'input-error' : ''}`}
                    placeholder="Enter camera name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IP Address
                  </label>
                  <input
                    {...register('ip_address', { 
                      required: 'IP address is required',
                      validate: (value) => {
                        if (!isValidIP(value)) {
                          return 'Please enter a valid IP address (e.g., 192.168.1.100)';
                        }
                        return true;
                      }
                    })}
                    className={`input ${errors.ip_address ? 'input-error' : ''}`}
                    placeholder="192.168.1.100"
                  />
                  {errors.ip_address && (
                    <p className="text-red-500 text-sm mt-1">{errors.ip_address.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Port
                  </label>
                  <input
                    {...register('port', { 
                      required: 'Port is required',
                      valueAsNumber: true,
                      min: { value: 1, message: 'Port must be between 1-65535' },
                      max: { value: 65535, message: 'Port must be between 1-65535' },
                      validate: (value) => {
                        const num = Number(value);
                        if (isNaN(num) || num < 1 || num > 65535) {
                          return 'Please enter a valid port number (1-65535)';
                        }
                        return true;
                      }
                    })}
                    type="number"
                    className={`input ${errors.port ? 'input-error' : ''}`}
                    placeholder="554 (RTSP default)"
                  />
                  {errors.port && (
                    <p className="text-red-500 text-sm mt-1">{errors.port.message}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">Common ports: 554 (RTSP), 80 (HTTP), 8080 (Alt HTTP)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    {...register('username', { 
                      required: 'Username is required',
                      minLength: { value: 1, message: 'Username cannot be empty' },
                      maxLength: { value: 50, message: 'Username must be less than 50 characters' }
                    })}
                    className={`input ${errors.username ? 'input-error' : ''}`}
                    placeholder="admin"
                    autoComplete="username"
                  />
                  {errors.username && (
                    <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: { value: 1, message: 'Password cannot be empty' },
                      maxLength: { value: 100, message: 'Password must be less than 100 characters' }
                    })}
                    type="password"
                    className={`input ${errors.password ? 'input-error' : ''}`}
                    placeholder="Enter password"
                    autoComplete="current-password"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Camera Type
                  </label>
                  <select
                    {...register('camera_type', { required: 'Camera type is required' })}
                    className={`input ${errors.camera_type ? 'input-error' : ''}`}
                    onChange={(e) => {
                      setValue('camera_type', e.target.value);
                      setValue('rtsp_path', getDefaultRTSPPath(e.target.value));
                    }}
                  >
                    <option value="hikvision">Hikvision</option>
                    <option value="dahua">Dahua</option>
                    <option value="axis">Axis</option>
                    <option value="bosch">Bosch</option>
                    <option value="generic">Generic</option>
                  </select>
                  {errors.camera_type && (
                    <p className="text-red-500 text-sm mt-1">{errors.camera_type.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RTSP Path
                  </label>
                  <input
                    {...register('rtsp_path', { 
                      required: 'RTSP path is required',
                      validate: (value) => {
                        if (!value.startsWith('/')) {
                          return 'RTSP path must start with /';
                        }
                        if (value.length > 200) {
                          return 'RTSP path must be less than 200 characters';
                        }
                        return true;
                      }
                    })}
                    className={`input ${errors.rtsp_path ? 'input-error' : ''}`}
                    placeholder="/Streaming/Channels/101"
                  />
                  {errors.rtsp_path && (
                    <p className="text-red-500 text-sm mt-1">{errors.rtsp_path.message}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    Path varies by camera type. Common paths automatically set when camera type changes.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location (Optional)
                  </label>
                  <input
                    {...register('location', {
                      maxLength: { value: 100, message: 'Location must be less than 100 characters' }
                    })}
                    className={`input ${errors.location ? 'input-error' : ''}`}
                    placeholder="Kitchen, Office, etc."
                  />
                  {errors.location && (
                    <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    OCR Capture Delay (seconds)
                  </label>
                  <input
                    type="number"
                    {...register('ocr_capture_delay', {
                      valueAsNumber: true,
                      min: { value: 1, message: 'OCR delay must be at least 1 second' },
                      max: { value: 60, message: 'OCR delay must be at most 60 seconds' }
                    })}
                    className={`input ${errors.ocr_capture_delay ? 'input-error' : ''}`}
                    placeholder="5"
                    defaultValue={5}
                  />
                  {errors.ocr_capture_delay && (
                    <p className="text-red-500 text-sm mt-1">{errors.ocr_capture_delay.message}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    How long to wait after motion stops before capturing OCR image (1-60 seconds)
                  </p>
                </div>

                {/* OCR Preprocessing Configuration */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-800 mb-3">OCR Image Preprocessing</h4>
                  <p className="text-gray-600 text-xs mb-4">
                    Apply transformations to OCR images before processing to improve accuracy
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Rotation */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rotation (degrees)
                      </label>
                      <input
                        type="number"
                        {...register('ocr_preprocessing_config.rotation', {
                          valueAsNumber: true,
                          min: 0,
                          max: 360
                        })}
                        className="input"
                        defaultValue={0}
                        min="0"
                        max="360"
                        step="1"
                        placeholder="0-360"
                      />
                      <p className="text-xs text-gray-500 mt-1">Clockwise rotation (0-360°)</p>
                    </div>

                    {/* Horizontal Flip */}
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          {...register('ocr_preprocessing_config.flip_horizontal')}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Flip Horizontal</span>
                      </label>
                      <p className="text-gray-500 text-xs mt-1">Mirror image left-to-right</p>
                    </div>

                    {/* Vertical Flip */}
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          {...register('ocr_preprocessing_config.flip_vertical')}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Flip Vertical</span>
                      </label>
                      <p className="text-gray-500 text-xs mt-1">Mirror image top-to-bottom</p>
                    </div>
                  </div>
                </div>

                {/* Camera Calibration Configuration */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-green-800 mb-3">Camera Calibration</h4>
                  <p className="text-green-700 text-xs mb-4">
                    Set the pixel-to-centimeter conversion ratio for accurate tray size detection and comparison
                  </p>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pixels per Centimeter
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      {...register('pixels_per_cm', {
                        valueAsNumber: true,
                        min: { value: 10, message: 'Pixels per cm must be at least 10' },
                        max: { value: 100, message: 'Pixels per cm must be at most 100' },
                        required: 'Pixels per cm is required'
                      })}
                      className={`input ${errors.pixels_per_cm ? 'input-error' : ''}`}
                      placeholder="37.8"
                      defaultValue={37.8}
                    />
                    {errors.pixels_per_cm && (
                      <p className="text-red-500 text-sm mt-1">{errors.pixels_per_cm.message}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      This value calibrates how many pixels equal 1 centimeter in your camera view. 
                      Used by AI to compare detected tray sizes with stored tray dimensions. 
                      Default: 37.8 pixels/cm
                    </p>
                  </div>
                </div>

                {/* Net Weight Configuration */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-orange-800 mb-3">Net Weight Configuration</h4>
                  
                  {/* Calculation Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Calculation Method
                    </label>
                    <select
                      {...register('net_weight_calculation_method', { required: true })}
                      className="input"
                    >
                      <option value="difference">Difference (Final - Initial)</option>
                      <option value="subtract_tray">Subtract Tray Weight (Max Weight - Auto-detected Tray)</option>
                    </select>
                    <p className="text-gray-500 text-xs mt-1">
                      "Subtract Tray Weight" uses AI to automatically detect and match trays from your tray database
                    </p>
                  </div>
                </div>

                {/* RTSP URL Preview */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RTSP URL Preview
                  </label>
                  <div className="bg-white p-3 rounded border font-mono text-sm">
                    {generateRTSPUrl(watchedValues[0], watchedValues[1], watchedValues[2], watchedValues[3], watchedValues[4]) || 
                     'rtsp://username:password@ip:port/Streaming/Channels/101'}
                  </div>
                  <p className="text-gray-500 text-xs mt-1">
                    This URL will be used to connect to your camera
                  </p>
                </div>

                {/* Connection Test */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">Test Connection</h4>
                      <p className="text-blue-600 text-xs mt-1">Verify camera connectivity before saving</p>
                    </div>
                    <button
                      type="button"
                      onClick={testCameraConnection}
                      disabled={isTestingConnection || !watchedValues[0] || !watchedValues[1] || !watchedValues[2] || !watchedValues[3] || !watchedValues[4]}
                      className="btn btn-secondary text-sm"
                    >
                      {isTestingConnection ? (
                        <>
                          <span className="animate-spin mr-1">⟳</span>
                          Testing...
                        </>
                      ) : (
                        'Test Connection'
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 text-gray-600 font-semibold bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                  >
                    {editingCamera ? 'Update' : 'Add'} Camera
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Delete Camera</h2>
              <p className="text-gray-600 mb-6 text-lg">
                Are you sure you want to delete "{showDeleteModal.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="px-6 py-3 text-gray-600 font-semibold bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteCamera(showDeleteModal)}
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:from-red-700 hover:to-red-800 transition-all duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ROI Editor Modal */}
        {showROIEditor && (
          <ROIEditor
            camera={showROIEditor}
            onSave={(roiConfig) => {
              setShowROIEditor(null);
              loadCameras(); // Refresh camera list
            }}
            onCancel={() => setShowROIEditor(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Cameras;