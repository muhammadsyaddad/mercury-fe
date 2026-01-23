import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Detection, Camera, FoodCategory, UserRole, PaginatedDetectionResponse, ReviewStatus } from '../types';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import DetectionDetailsModal from '../components/DetectionDetailsModal';
import { getDisplayValues } from '../utils/detectionDisplay';
import { Download, Search, Filter, Clock, Scale, ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

const ReviewedDetections: React.FC = () => {
  const { user, hasAnyRole } = useAuth();
  const [paginatedData, setPaginatedData] = useState<PaginatedDetectionResponse | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    camera_id: '',
    category: '',
    start_date: '',
    end_date: '',
    review_status: 'NEED_REVISION', // Default to showing items that need revision
    page: 1,
    page_size: 25,
    include_no_waste: false
  });

  const canExportData = hasAnyRole([UserRole.REVIEWER, UserRole.MANAGER, UserRole.ADMIN]);

  useEffect(() => {
    loadCameras();
    loadDetections();
  }, []);

  useEffect(() => {
    loadDetections();
  }, [filters]);

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setFilters(prev => ({ ...prev, page: 1, page_size: newPageSize }));
  };

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const loadCameras = async () => {
    try {
      const data = await apiService.getCameras();
      setCameras(data);
    } catch (error) {
      toast.error('Failed to load cameras');
    }
  };

  const loadDetections = async () => {
    try {
      setLoading(true);
      const params = {
        page: filters.page,
        page_size: filters.page_size,
        camera_id: filters.camera_id ? parseInt(filters.camera_id) : undefined,
        category: filters.category || undefined,
        review_status: filters.review_status || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date ? `${filters.end_date}T23:59:59` : undefined,
        include_no_waste: filters.include_no_waste
      };
      
      const data = await apiService.getDetections(params);
      setPaginatedData(data);
    } catch (error) {
      toast.error('Failed to load detections');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!canExportData) return;
    
    try {
      const params = {
        camera_id: filters.camera_id ? parseInt(filters.camera_id) : undefined,
        review_status: filters.review_status || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date ? `${filters.end_date}T23:59:59` : undefined,
        include_no_waste: filters.include_no_waste
      };
      
      const exportData = await apiService.exportDetections(params);
      
      // Convert to CSV and download
      const csvContent = convertToCSV(exportData.data);
      downloadCSV(csvContent, 'reviewed_detections_export.csv');
      
      toast.success(`Exported ${exportData.count} reviewed detections`);
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => 
      Object.values(item).map(value => 
        typeof value === 'string' ? `"${value}"` : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryColor = (category: FoodCategory) => {
    const colors = {
      [FoodCategory.PROTEIN]: '#ef4444',
      [FoodCategory.CARBOHYDRATE]: '#f59e0b',
      [FoodCategory.VEGETABLES]: '#10b981',
      [FoodCategory.FRUITS]: '#8b5cf6',
      [FoodCategory.PASTRY]: '#ec4899',
      [FoodCategory.OTHERS]: '#6b7280',
      [FoodCategory.NO_WASTE]: '#9ca3af'
    };
    return colors[category] || '#6b7280';
  };

  const getCategoryIcon = (category: FoodCategory) => {
    const icons = {
      [FoodCategory.PROTEIN]: '🥩',
      [FoodCategory.CARBOHYDRATE]: '🍞',
      [FoodCategory.VEGETABLES]: '🥬',
      [FoodCategory.FRUITS]: '🍎',
      [FoodCategory.PASTRY]: '🧁',
      [FoodCategory.OTHERS]: '🍽️',
      [FoodCategory.NO_WASTE]: '✅'
    };
    return icons[category] || '🍽️';
  };

  const getCameraName = (cameraId: number) => {
    const camera = cameras.find(c => c.id === cameraId);
    return camera ? camera.name : `Camera ${cameraId}`;
  };

  const getReviewStatusIcon = (status?: ReviewStatus) => {
    switch (status) {
      case ReviewStatus.DETECTION_OK:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case ReviewStatus.DETECTION_REJECTED:
        return <XCircle className="w-5 h-5 text-red-500" />;
      case ReviewStatus.NEED_REVISION:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case ReviewStatus.REVISION_APPROVED:
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-400" />;
    }
  };

  const getReviewStatusColor = (status?: ReviewStatus) => {
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
        return 'bg-green-100 text-green-800';
    }
  };

  const getReviewStatusText = (status?: ReviewStatus) => {
    switch (status) {
      case ReviewStatus.DETECTION_OK:
        return 'Detection OK';
      case ReviewStatus.DETECTION_REJECTED:
        return 'Detection Rejected';
      case ReviewStatus.NEED_REVISION:
        return 'Need Revision';
      case ReviewStatus.REVISION_APPROVED:
        return 'Revision Approved';
      default:
        return 'Detection OK';
    }
  };

  const openDetectionDetails = (detection: Detection) => {
    setSelectedDetection(detection);
    setShowDetailsModal(true);
  };

  const closeDetectionDetails = () => {
    setSelectedDetection(null);
    setShowDetailsModal(false);
  };

  const handleReviewUpdate = (updatedDetection: Detection) => {
    setSelectedDetection(updatedDetection);
    loadDetections(); // Refresh the list to show updated review status
  };

  const formatWeight = (weight?: number) => {
    if (weight === undefined || weight === null) {
      return 'N/A';
    }
    return `${(weight / 1000).toFixed(2)}kg`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Waste Review
              </h1>
              <p className="text-gray-600 mt-2 text-lg">View and manage reviewed food waste detection records</p>
            </div>
            {canExportData && (
              <button
                onClick={handleExport}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Export Data
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Filter className="w-6 h-6" />
              Filters
            </h3>
            
            {/* Show No Waste Toggle */}
            <div className="flex items-center space-x-3">
              <label className="text-sm font-semibold text-gray-700">Show No Waste</label>
              <button
                onClick={() => handleFilterChange({ include_no_waste: !filters.include_no_waste })}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg ${
                  filters.include_no_waste ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md ${
                    filters.include_no_waste ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Camera
              </label>
              <select
                value={filters.camera_id}
                onChange={(e) => handleFilterChange({ camera_id: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
              >
                <option value="">All Cameras</option>
                {cameras.map(camera => (
                  <option key={camera.id} value={camera.id}>
                    {camera.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange({ category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
              >
                <option value="">All Categories</option>
                {Object.values(FoodCategory).map(category => (
                  <option key={category} value={category}>
                    {category === 'NO_WASTE' ? 'No Waste' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Review Status
              </label>
              <select
                value={filters.review_status}
                onChange={(e) => handleFilterChange({ review_status: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
              >
                <option value="">All Statuses</option>
                <option value="DETECTION_OK">Detection OK</option>
                <option value="NEED_REVISION">Need Revision</option>
                <option value="DETECTION_REJECTED">Detection Rejected</option>
                <option value="REVISION_APPROVED">Revision Approved</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange({ start_date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange({ end_date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Per Page
              </label>
              <select
                value={filters.page_size}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
          <div className="p-8 border-b border-gray-200/50">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Search className="w-6 h-6" />
                Waste Review {paginatedData && `(${paginatedData.total_count} total)`}
              </h3>
              {paginatedData && paginatedData.total_pages > 1 && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-xl">
                  <span>Page {paginatedData.page} of {paginatedData.total_pages}</span>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : !paginatedData || paginatedData.items.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 text-8xl mb-6">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No reviewed detections found</h3>
              <p className="text-gray-600 text-lg">Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 p-8">
                {paginatedData.items.map((detection) => (
                <div 
                  key={detection.id} 
                  className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl hover:bg-white/70 transition-all duration-200 cursor-pointer backdrop-blur-sm border border-gray-100/50 hover:shadow-lg transform hover:scale-[1.02]"
                  onClick={() => openDetectionDetails(detection)}
                >
                  <div className="flex items-center">
                    {/* Detection Image Thumbnail */}
                    <div className="w-16 h-16 bg-gray-200 rounded-2xl overflow-hidden mr-4 flex-shrink-0 shadow-md">
                      <img
                        src={`${import.meta.env.VITE_API_URL || ''}/static/${detection.image_path}`}
                        alt="Detection"
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-xl">${getCategoryIcon(detection.category)}</div>`;
                        }}
                      />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 capitalize text-lg">{(() => {
                        const displayValues = getDisplayValues(detection);
                        return displayValues.category === 'NO_WASTE' ? 'No Waste' : displayValues.category;
                      })()}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Clock className="w-4 h-4" />
                        {format(new Date(detection.detected_at), 'MMM dd, HH:mm')}
                      </p>
                      <p className="text-xs text-gray-500">{getCameraName(detection.camera_id)}</p>
                      {(() => {
                        const displayValues = getDisplayValues(detection);
                        return displayValues.description && (
                          <p className="text-xs text-gray-500">{displayValues.description}</p>
                        );
                      })()}
                      {/* Review Status */}
                      <div className="flex items-center gap-2 mt-2">
                        {getReviewStatusIcon(detection.review_status)}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getReviewStatusColor(detection.review_status)}`}>
                          {getReviewStatusText(detection.review_status)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-4">
                      {/* Initial Weight */}
                      <div className="text-center bg-blue-50 rounded-xl p-3">
                        <p className="text-sm font-bold text-blue-600">
                          {(() => {
                            const displayValues = getDisplayValues(detection);
                            return formatWeight(displayValues.initial_weight);
                          })()}
                        </p>
                        <p className="text-xs text-gray-600">initial</p>
                      </div>
                      {/* Confidence */}
                      <div className="text-center bg-gray-50 rounded-xl p-3">
                        <p className="text-sm font-bold text-gray-900">
                          {Math.round(detection.confidence * 100)}%
                        </p>
                        <p className="text-xs text-gray-600">confidence</p>
                      </div>
                      {/* Weight Difference */}
                      {(() => {
                        const displayValues = getDisplayValues(detection);
                        return displayValues.weight !== undefined && displayValues.weight !== null && (
                          <div className="text-center bg-purple-50 rounded-xl p-3">
                            <p className={`text-sm font-bold ${displayValues.weight < 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {displayValues.weight < 0 ? '-' : '+'}{(Math.abs(displayValues.weight) / 1000).toFixed(2)}kg
                            </p>
                            <p className="text-xs text-gray-600">change</p>
                          </div>
                        );
                      })()}
                      {/* Net Weight */}
                      {(() => {
                        const displayValues = getDisplayValues(detection);
                        return displayValues.net_weight !== undefined && displayValues.net_weight !== null && (
                          <div className="text-center bg-orange-50 rounded-xl p-3">
                            <p className={`text-sm font-bold ${displayValues.net_weight < 0 ? 'text-red-600' : 'text-orange-600'}`}>
                              <Scale className="w-4 h-4 inline mr-1" />
                              {(Math.abs(displayValues.net_weight) / 1000).toFixed(2)}kg
                            </p>
                            <p className="text-xs text-gray-600">net</p>
                          </div>
                        );
                      })()}
                    </div>
                    {/* Click indicator */}
                    <div className="mt-2 text-xs text-gray-500 text-center">
                      Click for details →
                    </div>
                  </div>
                </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {paginatedData && paginatedData.total_pages > 1 && (
                <div className="border-t border-gray-200/50 p-8">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-xl">
                      Showing {((paginatedData.page - 1) * paginatedData.page_size) + 1} to{' '}
                      {Math.min(paginatedData.page * paginatedData.page_size, paginatedData.total_count)} of{' '}
                      {paginatedData.total_count} results
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handlePageChange(paginatedData.page - 1)}
                        disabled={!paginatedData.has_prev}
                        className="px-4 py-2 text-sm bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-gray-200 hover:to-gray-300 transition-all duration-200 flex items-center gap-1 font-semibold shadow-sm"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>
                      
                      <div className="flex items-center space-x-2">
                        {Array.from({ length: Math.min(5, paginatedData.total_pages) }, (_, i) => {
                          let pageNum;
                          if (paginatedData.total_pages <= 5) {
                            pageNum = i + 1;
                          } else if (paginatedData.page <= 3) {
                            pageNum = i + 1;
                          } else if (paginatedData.page >= paginatedData.total_pages - 2) {
                            pageNum = paginatedData.total_pages - 4 + i;
                          } else {
                            pageNum = paginatedData.page - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-4 py-2 text-sm rounded-xl font-semibold shadow-sm transition-all duration-200 ${
                                pageNum === paginatedData.page
                                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                  : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => handlePageChange(paginatedData.page + 1)}
                        disabled={!paginatedData.has_next}
                        className="px-4 py-2 text-sm bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-gray-200 hover:to-gray-300 transition-all duration-200 flex items-center gap-1 font-semibold shadow-sm"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detection Details Modal */}
        <DetectionDetailsModal
          detection={selectedDetection}
          isOpen={showDetailsModal}
          onClose={closeDetectionDetails}
          showFullDetails={true}
          onReviewUpdate={handleReviewUpdate}
        />
      </div>
    </div>
  );
};

export default ReviewedDetections;