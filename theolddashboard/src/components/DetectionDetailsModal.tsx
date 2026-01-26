import React, { useState, useEffect } from 'react';
import { Detection, UserRole, ReviewStatus, FoodCategory, Tray, MenuItem } from '../types';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { trayService } from '../services/trayService';
import { toast } from 'react-hot-toast';
import { getDisplayValues } from '../utils/detectionDisplay';

interface DetectionDetailsModalProps {
  detection: Detection | null;
  isOpen: boolean;
  onClose: () => void;
  showFullDetails?: boolean; // For history page vs dashboard
  onReviewUpdate?: (updatedDetection: Detection) => void;
}

const DetectionDetailsModal: React.FC<DetectionDetailsModalProps> = ({
  detection,
  isOpen,
  onClose,
  showFullDetails = false,
  onReviewUpdate,
}) => {
  const { hasAnyRole } = useAuth();
  const canViewOCRResults = hasAnyRole([UserRole.ADMIN, UserRole.REVIEWER]);
  const canReview = hasAnyRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.REVIEWER]);
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    review_status: ReviewStatus.DETECTION_OK,
    review_notes: '',
    corrected_category: detection?.category || FoodCategory.OTHERS,
    corrected_initial_weight: detection?.initial_weight ?? 0,
    corrected_final_weight: detection?.final_weight ?? 0,
    corrected_description: detection?.description || '',
    corrected_tray_id: detection?.tray_id || undefined,
  });
  const [submitting, setSubmitting] = useState(false);
  const [availableTrays, setAvailableTrays] = useState<Tray[]>([]);
  const [loadingTrays, setLoadingTrays] = useState(false);
  const [availableMenuItems, setAvailableMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenuItems, setLoadingMenuItems] = useState(false);

  // Load available trays and menu items
  useEffect(() => {
    const loadData = async () => {
      if (!isOpen) return;

      // Load trays
      setLoadingTrays(true);
      try {
        const trays = await trayService.getTrays(true);
        setAvailableTrays(trays);
      } catch (error) {
        console.error('Failed to load trays:', error);
        toast.error('Failed to load available trays');
      } finally {
        setLoadingTrays(false);
      }

      // Load menu items
      setLoadingMenuItems(true);
      try {
        const menuItems = await apiService.getActiveMenuItems();
        setAvailableMenuItems(menuItems);
      } catch (error) {
        console.error('Failed to load menu items:', error);
        toast.error('Failed to load menu items');
      } finally {
        setLoadingMenuItems(false);
      }
    };

    loadData();
  }, [isOpen]);
  
  // Reset review form when detection changes
  React.useEffect(() => {
    if (detection) {
      setReviewData({
        review_status: detection.review_status || ReviewStatus.DETECTION_OK,
        review_notes: detection.review_notes || '',
        corrected_category: detection.corrected_category || detection.category,
        corrected_initial_weight: detection.corrected_initial_weight ?? detection.initial_weight ?? 0,
        corrected_final_weight: detection.corrected_final_weight ?? detection.final_weight ?? 0,
        corrected_description: detection.corrected_description || detection.description || '',
        corrected_tray_id: detection.corrected_tray_id || detection.tray_id || undefined,
      });
      setShowReviewForm(false);
    }
  }, [detection?.id, detection?.review_status]);
  
  if (!isOpen || !detection) return null;

  const getImageUrl = (imagePath: string, imageType: string = 'food') => {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    
    // If imagePath exists, construct the static URL
    if (imagePath) {
      // Path should now be relative to storage directory (e.g., images/5/food_xxx.jpg)
      return `${baseUrl}/static/${imagePath}`;
    }
    
    // If no imagePath, return a placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzlhOWE5YSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIGltYWdlIGF2YWlsYWJsZTw+PHRleHQ+PC9zdmc+';
  };

  const displayValues = getDisplayValues(detection);

  const formatWeight = (weight?: number, rawText?: string) => {
    if (weight === undefined || weight === null) {
      return 'N/A';
    }
    return `${(weight / 1000).toFixed(2)}kg`;
  };

  const handleReviewSubmit = async () => {
    setSubmitting(true);
    try {
      const updatedDetection = await apiService.reviewDetection(detection.id, reviewData);
      toast.success('Review submitted successfully');
      setShowReviewForm(false);
      
      // Reload trays to ensure corrected tray is available
      try {
        const trays = await trayService.getTrays(true);
        setAvailableTrays(trays);
      } catch (error) {
        console.error('Failed to reload trays:', error);
      }
      
      if (onReviewUpdate) {
        onReviewUpdate(updatedDetection);
      }
    } catch (error) {
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const getReviewStatusColor = (status?: ReviewStatus) => {
    if (!status) return 'bg-green-100 text-green-800'; // Default to OK color
    switch (status) {
      case ReviewStatus.DETECTION_OK:
        return 'bg-green-100 text-green-800';
      case ReviewStatus.DETECTION_REJECTED:
        return 'bg-red-100 text-red-800';
      case ReviewStatus.NEED_REVISION:
        return 'bg-yellow-100 text-yellow-800';
      case ReviewStatus.REVISION_APPROVED:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-green-100 text-green-800'; // Default to OK color
    }
  };

  const getCategoryColor = (category: string) => {
    const categoryLower = category.toLowerCase();
    const colors: Record<string, string> = {
      protein: 'bg-red-100 text-red-800',
      carbohydrate: 'bg-yellow-100 text-yellow-800',
      vegetables: 'bg-green-100 text-green-800',
      fruits: 'bg-orange-100 text-orange-800',
      pastry: 'bg-purple-100 text-purple-800',
      others: 'bg-gray-100 text-gray-800',
      no_waste: 'bg-green-100 text-green-800',
    };
    return colors[categoryLower] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    const icons: Record<string, string> = {
      protein: '🥩',
      carbohydrate: '🍞',
      vegetables: '🥬',
      fruits: '🍎',
      pastry: '🧁',
      others: '🍽️',
      no_waste: '✅',
    };
    return icons[categoryLower] || '🍽️';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{getCategoryIcon(detection.category)}</span>
            <h2 className="text-xl font-semibold text-gray-900">Detection Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Detection Info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Detection Information</h3>
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Detection ID:</span>
                    <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">#{detection.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(displayValues.category)}`}>
                      {displayValues.category}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Item:</span>
                    <span className="font-medium">{displayValues.description || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Confidence:</span>
                    <span className="font-medium text-blue-600">{Math.round(detection.confidence * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Camera ID:</span>
                    <span className="font-medium">#{detection.camera_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Detected At:</span>
                    <span className="font-medium">
                      {format(new Date(detection.detected_at), 'MMM dd, yyyy HH:mm:ss')}
                    </span>
                  </div>
                  {(detection.tray_name || (detection.corrected_tray_id && availableTrays.find(t => t.id === detection.corrected_tray_id))) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tray:</span>
                      <span className="font-medium">
                        {detection.corrected_tray_id ? 
                          availableTrays.find(t => t.id === detection.corrected_tray_id)?.name : 
                          detection.tray_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Weight Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Weight Measurements</h3>
                {(() => {
                  // Use the detection's calculation method if available, otherwise default to 'difference'
                  // Note: detection.net_weight_calculation_method comes from the camera's configuration
                  const calculationMethod = detection.net_weight_calculation_method || 'difference';
                  
                  if (calculationMethod === 'subtract_tray') {
                    // Tray-based calculation: show weight and tray weight
                    const maxWeight = Math.max(displayValues.initial_weight || 0, displayValues.final_weight || 0);
                    // Get tray weight from corrected tray if reviewed, otherwise from detected tray
                    const trayWeight = detection.corrected_tray_id ? 
                      availableTrays.find(t => t.id === detection.corrected_tray_id)?.weight : 
                      detection.tray_weight;
                    
                    return (
                      <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-blue-600 font-medium">📊 Calculation Method: Tray Subtraction</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Weight:</span>
                          <span className="font-bold text-blue-700">{formatWeight(maxWeight)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Tray Weight:</span>
                          <span className="font-bold text-purple-700">
                            {trayWeight ? formatWeight(trayWeight) : 
                             (detection.tray_id || detection.corrected_tray_id ? formatWeight(0) : 
                              <span className="text-gray-500 italic">No tray detected</span>)}
                          </span>
                        </div>
                        <div className="border-t border-blue-200 pt-3">
                          <div className="flex justify-between bg-orange-50 -mx-4 px-4 py-2 rounded">
                            <span className="text-orange-800 font-medium">Net Food Weight:</span>
                            <span className={`font-bold text-lg ${displayValues.net_weight && displayValues.net_weight < 0 ? 'text-red-600' : displayValues.net_weight === 0 ? 'text-gray-600' : 'text-orange-600'}`}>
                              {formatWeight(displayValues.net_weight)}
                            </span>
                          </div>
                          {displayValues.net_weight && displayValues.net_weight < 0 && (
                            <div className="mt-2 p-3 bg-red-100 border border-red-200 rounded-lg">
                              <p className="text-sm text-red-700 flex items-center">
                                <span className="mr-2">🗑️</span>
                                <strong>Food waste detected:</strong>
                                <span className="ml-1 font-bold">{(Math.abs(displayValues.net_weight) / 1000).toFixed(2)}kg disposed</span>
                              </p>
                            </div>
                          )}
                          {displayValues.net_weight && displayValues.net_weight > 0 && (
                            <div className="mt-2 p-3 bg-green-100 border border-green-200 rounded-lg">
                              <p className="text-sm text-green-700 flex items-center">
                                <span className="mr-2">📈</span>
                                <strong>Weight increased:</strong>
                                <span className="ml-1 font-bold">{(displayValues.net_weight / 1000).toFixed(2)}kg added</span>
                              </p>
                            </div>
                          )}
                          {displayValues.net_weight === 0 && (
                            <div className="mt-2 p-3 bg-gray-100 border border-gray-200 rounded-lg">
                              <p className="text-sm text-gray-700 flex items-center">
                                <span className="mr-2">✅</span>
                                <strong>No waste detected</strong>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  } else {
                    // Difference-based calculation: show initial and final weights
                    return (
                      <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-blue-600 font-medium">📊 Calculation Method: Weight Difference</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Initial Weight:</span>
                          <span className="font-bold text-blue-700">{formatWeight(displayValues.initial_weight, detection.initial_ocr_raw_text)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Final Weight:</span>
                          <span className="font-bold text-green-700">{formatWeight(displayValues.final_weight, detection.final_ocr_raw_text)}</span>
                        </div>
                        <div className="border-t border-blue-200 pt-3">
                          <div className="flex justify-between">
                            <span className="text-gray-700 font-medium">Weight Difference:</span>
                            <span className={`font-bold text-lg ${displayValues.weight && displayValues.weight < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                              {formatWeight(displayValues.weight)}
                            </span>
                          </div>
                          {displayValues.net_weight !== undefined && displayValues.net_weight !== null && (
                            <div className="flex justify-between bg-orange-50 -mx-4 px-4 py-2 rounded">
                              <span className="text-orange-800 font-medium">Net Food Weight:</span>
                              <span className={`font-bold text-lg ${displayValues.net_weight < 0 ? 'text-red-600' : displayValues.net_weight === 0 ? 'text-gray-600' : 'text-orange-600'}`}>
                                {formatWeight(displayValues.net_weight)}
                              </span>
                            </div>
                          )}
                          {displayValues.net_weight === 0 && (
                            <div className="mt-2 p-3 bg-gray-100 border border-gray-200 rounded-lg">
                              <p className="text-sm text-gray-700 flex items-center">
                                <span className="mr-2">✅</span>
                                <strong>No waste detected</strong>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>


              {/* Raw OCR Results */}
              {canViewOCRResults && (detection.initial_ocr_raw_text || detection.final_ocr_raw_text) && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Raw OCR Results</h3>
                  <div className="space-y-3">
                    {detection.initial_ocr_raw_text && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">Initial Weight OCR</h4>
                        <div className="bg-white p-3 rounded border text-xs font-mono break-words">
                          {detection.initial_ocr_raw_text}
                        </div>
                        {detection.initial_ocr_confidence && (
                          <div className="text-xs text-blue-600 mt-2">
                            Confidence: {(detection.initial_ocr_confidence * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    )}
                    {detection.final_ocr_raw_text && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-green-800 mb-2">Final Weight OCR</h4>
                        <div className="bg-white p-3 rounded border text-xs font-mono break-words">
                          {detection.final_ocr_raw_text}
                        </div>
                        {detection.final_ocr_confidence && (
                          <div className="text-xs text-green-600 mt-2">
                            Confidence: {(detection.final_ocr_confidence * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* AI Tray Detection Results */}
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-purple-800 mb-2">AI Detected Tray Size</h4>
                      {(detection.ai_detected_shape || detection.ai_tray_bbox || detection.ai_estimated_dimensions) ? (
                        <div className="space-y-2">
                          {detection.ai_detected_shape && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Shape:</span>
                              <span className="text-sm font-medium bg-purple-100 px-2 py-1 rounded capitalize">
                                {detection.ai_detected_shape}
                              </span>
                            </div>
                          )}
                          {detection.ai_estimated_dimensions && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Size:</span>
                              <span className="text-sm font-medium">
                                {Math.round(detection.ai_estimated_dimensions.length || detection.ai_estimated_dimensions.width || 0)} × {Math.round(detection.ai_estimated_dimensions.width || detection.ai_estimated_dimensions.height || 0)} px
                              </span>
                            </div>
                          )}
                          {detection.ai_tray_bbox && (
                            <div>
                              <span className="text-sm text-gray-600 block mb-1">Bounding Box:</span>
                              <div className="bg-white p-2 rounded border text-xs font-mono break-words">
                                [{detection.ai_tray_bbox.map(coord => Math.round(coord)).join(', ')}]
                              </div>
                              <div className="text-xs text-purple-600 mt-1">
                                [ymin, xmin, ymax, xmax] in normalized coordinates
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          No AI tray detection data available for this detection. This feature is only available for new detections after the recent update.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Review Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Review Status</h3>
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getReviewStatusColor(detection.review_status)}`}>
                      {(() => {
                        switch (detection.review_status) {
                          case ReviewStatus.DETECTION_OK:
                            return 'Detection OK';
                          case ReviewStatus.NEED_REVISION:
                            return 'Need Revision';
                          case ReviewStatus.DETECTION_REJECTED:
                            return 'Detection Rejected';
                          case ReviewStatus.REVISION_APPROVED:
                            return 'Revision Approved';
                          default:
                            return 'Detection OK';
                        }
                      })()}
                    </span>
                  </div>
                  {detection.reviewed_by && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reviewed By:</span>
                      <span className="font-medium">User #{detection.reviewed_by}</span>
                    </div>
                  )}
                  {detection.reviewed_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reviewed At:</span>
                      <span className="font-medium">
                        {format(new Date(detection.reviewed_at), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                  )}
                  {detection.review_notes && (
                    <div className="pt-3 border-t border-gray-200">
                      <span className="text-gray-600 block mb-2">Notes:</span>
                      <p className="text-sm bg-white p-3 rounded border">{detection.review_notes}</p>
                    </div>
                  )}
                  
                  {canReview && (
                    <div className="pt-3 border-t border-gray-200">
                      {!showReviewForm ? (
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="btn btn-primary text-sm"
                        >
                          Review Detection
                        </button>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                              <select
                                value={reviewData.review_status}
                                onChange={(e) => setReviewData({...reviewData, review_status: e.target.value as ReviewStatus})}
                                className="input text-sm"
                              >
                                <option value={ReviewStatus.DETECTION_OK}>Detection OK</option>
                                <option value={ReviewStatus.NEED_REVISION}>Need Revision</option>
                                <option value={ReviewStatus.DETECTION_REJECTED}>Detection Rejected</option>
                                <option value={ReviewStatus.REVISION_APPROVED}>Revision Approved</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Corrected Category</label>
                              <select
                                value={reviewData.corrected_category}
                                onChange={(e) => setReviewData({...reviewData, corrected_category: e.target.value as FoodCategory})}
                                className="input text-sm"
                              >
                                {Object.values(FoodCategory).map(category => (
                                  <option key={category} value={category}>
                                    {category.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Corrected Initial Weight (kg)</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={reviewData.corrected_initial_weight ? (reviewData.corrected_initial_weight / 1000).toFixed(2) : ''}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                  setReviewData({...reviewData, corrected_initial_weight: isNaN(value) ? 0 : value * 1000});
                                }}
                                className="input text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Corrected Final Weight (kg)</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={reviewData.corrected_final_weight ? (reviewData.corrected_final_weight / 1000).toFixed(2) : ''}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                  setReviewData({...reviewData, corrected_final_weight: isNaN(value) ? 0 : value * 1000});
                                }}
                                className="input text-sm"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Corrected Menu/Item</label>
                              <select
                                value={reviewData.corrected_description}
                                onChange={(e) => setReviewData({...reviewData, corrected_description: e.target.value})}
                                className="input text-sm"
                                disabled={loadingMenuItems}
                              >
                                <option value="">Select menu item or leave blank</option>
                                {availableMenuItems.map(item => (
                                  <option key={item.id} value={item.name}>
                                    {item.name} ({item.category.toLowerCase().replace('_', ' ')})
                                  </option>
                                ))}
                              </select>
                              {loadingMenuItems && (
                                <p className="text-xs text-gray-500 mt-1">Loading menu items...</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">Select from menu or leave blank for free text</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Corrected Tray</label>
                              <select
                                value={reviewData.corrected_tray_id || ''}
                                onChange={(e) => setReviewData({...reviewData, corrected_tray_id: e.target.value ? parseInt(e.target.value) : undefined})}
                                className="input text-sm"
                                disabled={loadingTrays}
                              >
                                <option value="">No tray / Auto-detect</option>
                                {availableTrays.map(tray => (
                                  <option key={tray.id} value={tray.id}>
                                    {tray.name} ({(tray.weight / 1000).toFixed(2)}kg)
                                  </option>
                                ))}
                              </select>
                              {loadingTrays && (
                                <p className="text-xs text-gray-500 mt-1">Loading trays...</p>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Review Notes</label>
                            <textarea
                              value={reviewData.review_notes}
                              onChange={(e) => setReviewData({...reviewData, review_notes: e.target.value})}
                              rows={3}
                              className="input text-sm"
                              placeholder="Add any notes about this review..."
                            />
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={handleReviewSubmit}
                              disabled={submitting}
                              className="btn btn-primary text-sm"
                            >
                              {submitting ? 'Submitting...' : 'Submit Review'}
                            </button>
                            <button
                              onClick={() => setShowReviewForm(false)}
                              className="btn btn-secondary text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Motion Data (only in full details) */}
              {showFullDetails && detection.motion_data && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Motion Data</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-xs text-gray-600 overflow-x-auto">
                      {JSON.stringify(detection.motion_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Images */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Food Detection Image</h3>
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  <img
                    src={getImageUrl(detection.image_path, 'food')}
                    alt="Food detection"
                    className="w-full h-64 object-cover hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzlhOWE5YSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                    }}
                  />
                </div>
              </div>

              {/* OCR Images */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Weight Scale Images</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Before (Initial)</h4>
                    <div className="border rounded-lg overflow-hidden bg-blue-50 aspect-square relative">
                      {detection.initial_ocr_path ? (
                        <img
                          src={getImageUrl(detection.initial_ocr_path)}
                          alt="Initial OCR scale reading"
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="h-full flex flex-col items-center justify-center text-blue-600 p-2">
                                  <span class="text-2xl mb-1">⚖️</span>
                                  <span class="text-xs text-center">Initial OCR</span>
                                  <span class="text-xs text-center text-red-500">Image not found</span>
                                  <span class="font-bold text-sm">${formatWeight(displayValues.initial_weight)}</span>
                                </div>
                              `;
                            }
                          }}
                        />
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-blue-600 p-2">
                          <span className="text-2xl mb-1">⚖️</span>
                          <span className="text-xs text-center">Initial OCR</span>
                          <span className="text-xs text-center text-gray-500">No image captured</span>
                          <span className="font-bold text-sm">{formatWeight(displayValues.initial_weight)}</span>
                        </div>
                      )}
                      {/* Weight overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 text-center">
                        <span className="text-sm font-bold">{formatWeight(displayValues.initial_weight)}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">After (Final)</h4>
                    <div className="border rounded-lg overflow-hidden bg-green-50 aspect-square relative">
                      {detection.final_ocr_path ? (
                        <img
                          src={getImageUrl(detection.final_ocr_path)}
                          alt="Final OCR scale reading"
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="h-full flex flex-col items-center justify-center text-green-600 p-2">
                                  <span class="text-2xl mb-1">⚖️</span>
                                  <span class="text-xs text-center">Final OCR</span>
                                  <span class="text-xs text-center text-red-500">Image not found</span>
                                  <span class="font-bold text-sm">${formatWeight(displayValues.final_weight)}</span>
                                </div>
                              `;
                            }
                          }}
                        />
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-green-600 p-2">
                          <span className="text-2xl mb-1">⚖️</span>
                          <span className="text-xs text-center">Final OCR</span>
                          <span className="text-xs text-center text-gray-500">No image captured</span>
                          <span className="font-bold text-sm">{formatWeight(displayValues.final_weight)}</span>
                        </div>
                      )}
                      {/* Weight overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 text-center">
                        <span className="text-sm font-bold">{formatWeight(displayValues.final_weight)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Image URLs (only in full details) */}
              {showFullDetails && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Image URLs</h4>
                  <div className="bg-gray-50 p-3 rounded text-xs space-y-3">
                    
                    {/* Food Detection Images */}
                    <div>
                      <p className="mb-2 font-medium text-gray-600">🍽️ Food Detection Images:</p>
                      <div className="space-y-1 ml-2">
                        {detection.food_image_1_path && (
                          <div>
                            <span className="text-gray-500">Food 1: </span>
                            <a 
                              href={getImageUrl(detection.food_image_1_path)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline break-all"
                            >
                              {getImageUrl(detection.food_image_1_path)}
                            </a>
                          </div>
                        )}
                        {detection.food_image_2_path && (
                          <div>
                            <span className="text-gray-500">Food 2: </span>
                            <a 
                              href={getImageUrl(detection.food_image_2_path)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline break-all"
                            >
                              {getImageUrl(detection.food_image_2_path)}
                            </a>
                          </div>
                        )}
                        {/* Fallback to main image_path if specific food images not available */}
                        {!detection.food_image_1_path && detection.image_path && (
                          <div>
                            <span className="text-gray-500">Main: </span>
                            <a 
                              href={getImageUrl(detection.image_path)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline break-all"
                            >
                              {getImageUrl(detection.image_path)}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Initial OCR Images */}
                    <div>
                      <p className="mb-2 font-medium text-gray-600">⚖️ Initial Weight Scale Images:</p>
                      <div className="space-y-1 ml-2">
                        {detection.initial_ocr_path && (
                          <div>
                            <span className="text-gray-500">Initial 1: </span>
                            <a 
                              href={getImageUrl(detection.initial_ocr_path)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline break-all"
                            >
                              {getImageUrl(detection.initial_ocr_path)}
                            </a>
                          </div>
                        )}
                        {detection.initial_ocr_2_path && (
                          <div>
                            <span className="text-gray-500">Initial 2: </span>
                            <a 
                              href={getImageUrl(detection.initial_ocr_2_path)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline break-all"
                            >
                              {getImageUrl(detection.initial_ocr_2_path)}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Final OCR Images */}
                    <div>
                      <p className="mb-2 font-medium text-gray-600">⚖️ Final Weight Scale Images:</p>
                      <div className="space-y-1 ml-2">
                        {detection.final_ocr_path && (
                          <div>
                            <span className="text-gray-500">Final 1: </span>
                            <a 
                              href={getImageUrl(detection.final_ocr_path)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline break-all"
                            >
                              {getImageUrl(detection.final_ocr_path)}
                            </a>
                          </div>
                        )}
                        {detection.final_ocr_2_path && (
                          <div>
                            <span className="text-gray-500">Final 2: </span>
                            <a 
                              href={getImageUrl(detection.final_ocr_2_path)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline break-all"
                            >
                              {getImageUrl(detection.final_ocr_2_path)}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-gray-500 italic text-xs">
                        📷 Click any link to view the full-size image in a new tab
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetectionDetailsModal;