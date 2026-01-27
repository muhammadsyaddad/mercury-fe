"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Download, Search, Filter, Clock, Scale, ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@vision_dashboard/ui/card";
import { Button } from "@vision_dashboard/ui/button";
import { Input } from "@vision_dashboard/ui/input";
import { Label } from "@vision_dashboard/ui/label";
import { Spinner } from "@vision_dashboard/ui/spinner";
import { Badge } from "@vision_dashboard/ui/badge";
import { Switch } from "@vision_dashboard/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@vision_dashboard/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { DetectionDetailsModal } from '@/components/dashboard/DetectionDetailsModal';
import { getDisplayValues } from '@/utils/detectionDisplay';
import type { Detection, Camera, PaginatedDetectionResponse } from '@/types';
import { FoodCategory, UserRole, ReviewStatus } from '@/types';
import { cn } from '@/lib/utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function ReviewedDetectionsPage() {
  const { hasAnyRole } = useAuth();
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
    review_status: 'NEED_REVISION',
    page: 1,
    page_size: 25,
    include_no_waste: false
  });

  const canExportData = true; // All logged-in users can export

  useEffect(() => {
    loadCameras();
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
        camera_id: filters.camera_id ? Number.parseInt(filters.camera_id, 10) : undefined,
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
        camera_id: filters.camera_id ? Number.parseInt(filters.camera_id, 10) : undefined,
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

  const getReviewStatusVariant = (status?: ReviewStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case ReviewStatus.DETECTION_OK:
        return 'default';
      case ReviewStatus.DETECTION_REJECTED:
        return 'destructive';
      case ReviewStatus.NEED_REVISION:
        return 'secondary';
      case ReviewStatus.REVISION_APPROVED:
        return 'default';
      default:
        return 'default';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Waste Review</h1>
          <p className="text-muted-foreground mt-1">
            View and manage reviewed food waste detection records
          </p>
        </div>

        {canExportData && (
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>

            {/* Show No Waste Toggle */}
            <div className="flex items-center space-x-2">
              <Label htmlFor="include_no_waste" className="text-sm">Show No Waste</Label>
              <Switch
                id="include_no_waste"
                checked={filters.include_no_waste}
                onCheckedChange={(checked) => handleFilterChange({ include_no_waste: checked })}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label>Camera</Label>
              <Select
                value={filters.camera_id}
                onValueChange={(value) => handleFilterChange({ camera_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Cameras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cameras</SelectItem>
                  {cameras.map(camera => (
                    <SelectItem key={camera.id} value={camera.id.toString()}>
                      {camera.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={filters.category}
                onValueChange={(value) => handleFilterChange({ category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.values(FoodCategory).map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'NO_WASTE' ? 'No Waste' : category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Review Status</Label>
              <Select
                value={filters.review_status}
                onValueChange={(value) => handleFilterChange({ review_status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="DETECTION_OK">Detection OK</SelectItem>
                  <SelectItem value="NEED_REVISION">Need Revision</SelectItem>
                  <SelectItem value="DETECTION_REJECTED">Detection Rejected</SelectItem>
                  <SelectItem value="REVISION_APPROVED">Revision Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange({ start_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange({ end_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Per Page</Label>
              <Select
                value={filters.page_size.toString()}
                onValueChange={(value) => handlePageSizeChange(Number.parseInt(value, 10))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Waste Review {paginatedData && `(${paginatedData.total_count} total)`}
            </CardTitle>
            {paginatedData && paginatedData.total_pages > 1 && (
              <div className="text-sm text-muted-foreground">
                Page {paginatedData.page} of {paginatedData.total_pages}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner className="h-12 w-12" />
            </div>
          ) : !paginatedData || paginatedData.items.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">🔍</div>
              <h3 className="text-xl font-semibold mb-3">No reviewed detections found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedData.items.map((detection) => {
                  const displayValues = getDisplayValues(detection);

                  return (
                    <div
                      key={detection.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer border"
                      onClick={() => openDetectionDetails(detection)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Detection Image Thumbnail */}
                        <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={`${API_BASE_URL}/static/${detection.image_path}`}
                            alt="Detection"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              if (target.parentElement) {
                                target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-xl">${getCategoryIcon(detection.category)}</div>`;
                              }
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-bold capitalize text-lg">
                            {displayValues.category === 'NO_WASTE' ? 'No Waste' : displayValues.category}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="w-4 h-4" />
                            {format(new Date(detection.detected_at), 'MMM dd, HH:mm')}
                          </p>
                          <p className="text-xs text-muted-foreground">{getCameraName(detection.camera_id)}</p>
                          {displayValues.description && (
                            <p className="text-xs text-muted-foreground">{displayValues.description}</p>
                          )}
                          {/* Review Status */}
                          <div className="flex items-center gap-2 mt-2">
                            {getReviewStatusIcon(detection.review_status)}
                            <Badge variant={getReviewStatusVariant(detection.review_status)}>
                              {getReviewStatusText(detection.review_status)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-4">
                          {/* Initial Weight */}
                          <div className="text-center bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
                            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                              {formatWeight(displayValues.initial_weight)}
                            </p>
                            <p className="text-xs text-muted-foreground">initial</p>
                          </div>
                          {/* Confidence */}
                          <div className="text-center bg-muted rounded-lg p-3">
                            <p className="text-sm font-bold">
                              {Math.round(detection.confidence * 100)}%
                            </p>
                            <p className="text-xs text-muted-foreground">confidence</p>
                          </div>
                          {/* Weight Difference */}
                          {displayValues.weight !== undefined && displayValues.weight !== null && (
                            <div className="text-center bg-purple-50 dark:bg-purple-950 rounded-lg p-3">
                              <p className={cn(
                                "text-sm font-bold",
                                displayValues.weight < 0 ? 'text-red-600' : 'text-green-600'
                              )}>
                                {displayValues.weight < 0 ? '-' : '+'}{(Math.abs(displayValues.weight) / 1000).toFixed(2)}kg
                              </p>
                              <p className="text-xs text-muted-foreground">change</p>
                            </div>
                          )}
                          {/* Net Weight */}
                          {displayValues.net_weight !== undefined && displayValues.net_weight !== null && (
                            <div className="text-center bg-orange-50 dark:bg-orange-950 rounded-lg p-3">
                              <p className={cn(
                                "text-sm font-bold flex items-center",
                                displayValues.net_weight < 0 ? 'text-red-600' : 'text-orange-600'
                              )}>
                                <Scale className="w-4 h-4 mr-1" />
                                {(Math.abs(displayValues.net_weight) / 1000).toFixed(2)}kg
                              </p>
                              <p className="text-xs text-muted-foreground">net</p>
                            </div>
                          )}
                        </div>
                        {/* Click indicator */}
                        <div className="mt-2 text-xs text-muted-foreground text-center">
                          Click for details →
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {paginatedData && paginatedData.total_pages > 1 && (
                <div className="border-t pt-6 mt-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {((paginatedData.page - 1) * paginatedData.page_size) + 1} to{' '}
                      {Math.min(paginatedData.page * paginatedData.page_size, paginatedData.total_count)} of{' '}
                      {paginatedData.total_count} results
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(paginatedData.page - 1)}
                        disabled={!paginatedData.has_prev}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>

                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, paginatedData.total_pages) }, (_, i) => {
                          let pageNum: number;
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
                            <Button
                              key={pageNum}
                              variant={pageNum === paginatedData.page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(paginatedData.page + 1)}
                        disabled={!paginatedData.has_next}
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detection Details Modal */}
      <DetectionDetailsModal
        detection={selectedDetection}
        isOpen={showDetailsModal}
        onClose={closeDetectionDetails}
        showFullDetails={true}
        onReviewUpdate={handleReviewUpdate}
      />
    </div>
  );
}
