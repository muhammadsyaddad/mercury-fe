"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@vision_dashboard/ui/card";
import { Button } from "@vision_dashboard/ui/button";
import { Badge } from "@vision_dashboard/ui/badge";
import { Input } from "@vision_dashboard/ui/input";
import { Label } from "@vision_dashboard/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@vision_dashboard/ui/select";
import { Switch } from "@vision_dashboard/ui/switch";
import { Spinner } from "@vision_dashboard/ui/spinner";
import { ScrollArea } from "@vision_dashboard/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@vision_dashboard/ui/dialog";
import { cn } from "@vision_dashboard/ui/cn";
import {
  Download,
  Search,
  Filter,
  Clock,
  Scale,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { getDisplayValues } from "@/utils/detectionDisplay";
import { useHistoryQueries } from "@/lib/history-queries";
import { DetectionImage } from "@/components/dashboard/DetectionImage";
import { DetectionDetailsModal } from "@/components/dashboard/DetectionDetailsModal";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types";
import type { Detection, Camera, FoodCategory, MealPeriod } from "@/types";

interface PaginatedDetectionResponse {
  items: Detection[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_prev: boolean;
  has_next: boolean;
}

interface Filters {
  camera_id: string;
  category: string;
  meal_period: string;
  start_date: string;
  end_date: string;
  page: number;
  page_size: number;
  include_no_waste: boolean;
}

const FOOD_CATEGORIES = [
  "PROTEIN",
  "CARBOHYDRATE",
  "VEGETABLES",
  "FRUITS",
  "PASTRY",
  "OTHERS",
  "NO_WASTE",
];

const getMealPeriodInfo = (mealPeriod?: string) => {
  switch (mealPeriod) {
    case "BREAKFAST":
      return { label: "Breakfast", variant: "secondary" as const };
    case "LUNCH":
      return { label: "Lunch", variant: "default" as const };
    case "DINNER":
      return { label: "Dinner", variant: "outline" as const };
    default:
      return { label: "Unknown", variant: "secondary" as const };
  }
};

const formatCategoryName = (category: string): string => {
  if (!category) return "Unknown";
  if (category === "NO_WASTE") return "No Waste";
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
};

const formatWeight = (weight?: number) => {
  if (weight === undefined || weight === null) return "N/A";
  return `${(weight / 1000).toFixed(2)}kg`;
};

export default function HistoryPage() {
  const { hasAnyRole } = useAuth();

  const [filters, setFilters] = useState<Filters>({
    camera_id: "",
    category: "",
    meal_period: "",
    start_date: "",
    end_date: "",
    page: 1,
    page_size: 25,
    include_no_waste: false,
  });

  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [detectionToDelete, setDetectionToDelete] = useState<Detection | null>(null);

  const canDeleteDetections = hasAnyRole([UserRole.ADMIN]);
  const canExportData = true; // All logged-in users can export

  const { camerasQuery, detectionsQuery } = useHistoryQueries(filters);

  const cameras = camerasQuery.data ?? [];
  const paginatedData = detectionsQuery.data;
  const isLoading = detectionsQuery.isLoading;
  const refetch = detectionsQuery.refetch;

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setFilters((prev) => ({ ...prev, page: 1, page_size: Number.parseInt(newPageSize) }));
  };

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleDeleteDetection = async (detectionId: number) => {
    if (!canDeleteDetections) return;

    try {
      await apiService.deleteDetection(detectionId);
      toast.success("Detection deleted successfully");
      refetch();
      setSelectedDetection(null);
      setShowDeleteModal(false);
      setDetectionToDelete(null);
    } catch {
      toast.error("Failed to delete detection");
    }
  };

  const openDeleteModal = (detection: Detection) => {
    setDetectionToDelete(detection);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDetectionToDelete(null);
  };

  const confirmDelete = () => {
    if (detectionToDelete) {
      handleDeleteDetection(detectionToDelete.id);
    }
  };

  const handleExport = async () => {
    if (!canExportData) return;

    try {
      const params = {
        camera_id: filters.camera_id ? Number.parseInt(filters.camera_id) : undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date ? `${filters.end_date}T23:59:59` : undefined,
        include_no_waste: filters.include_no_waste,
      };

      const exportData = await apiService.exportDetections(params);

      // Convert to CSV and download
      const csvContent = convertToCSV(exportData.data);
      downloadCSV(csvContent, "detections_export.csv");

      toast.success(`Exported ${exportData.count} detections`);
    } catch {
      toast.error("Failed to export data");
    }
  };

  const convertToCSV = (data: Record<string, unknown>[]) => {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0] || {}).join(",");
    const rows = data.map((item) =>
      Object.values(item)
        .map((value) => (typeof value === "string" ? `"${value}"` : value))
        .join(",")
    );

    return [headers, ...rows].join("\n");
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCameraName = (cameraId: number) => {
    const camera = cameras.find((c: Camera) => c.id === cameraId);
    return camera ? camera.name : `Camera ${cameraId}`;
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
    refetch();
  };

  // Generate pagination numbers
  const getPaginationNumbers = () => {
    if (!paginatedData) return [];
    const { page, total_pages } = paginatedData;
    const pages: number[] = [];

    if (total_pages <= 5) {
      for (let i = 1; i <= total_pages; i++) pages.push(i);
    } else if (page <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i);
    } else if (page >= total_pages - 2) {
      for (let i = total_pages - 4; i <= total_pages; i++) pages.push(i);
    } else {
      for (let i = page - 2; i <= page + 2; i++) pages.push(i);
    }

    return pages;
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-amber-50 via-orange-50/80 to-yellow-50/60 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-yellow-950/20 border-amber-200/60 dark:border-amber-800/40">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center ring-1 ring-amber-200 dark:ring-amber-800">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-amber-900 dark:text-amber-100">Detection History</h1>
                <p className="text-amber-700/70 dark:text-amber-300/70 mt-1">View and manage food waste detection records</p>
              </div>
            </div>
            {canExportData && (
              <Button onClick={handleExport} className="gap-2">
                <Download className="h-4 w-4" />
                Export Data
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-amber-200/30 dark:border-amber-800/20">
        <CardHeader className="bg-gradient-to-r from-amber-50/40 to-orange-50/20 dark:from-amber-950/10 dark:to-orange-950/5 rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <Filter className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              Filters
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="include-no-waste" className="text-sm font-medium">
                Show No Waste
              </Label>
              <Switch
                id="include-no-waste"
                checked={filters.include_no_waste}
                onCheckedChange={(checked) => handleFilterChange({ include_no_waste: checked })}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Camera</Label>
              <Select
                value={filters.camera_id || "all"}
                onValueChange={(value) => handleFilterChange({ camera_id: value === "all" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Cameras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cameras</SelectItem>
                  {cameras.map((camera: Camera) => (
                    <SelectItem key={camera.id} value={camera.id.toString()}>
                      {camera.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Category</Label>
              <Select
                value={filters.category || "all"}
                onValueChange={(value) => handleFilterChange({ category: value === "all" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {FOOD_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {formatCategoryName(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Meal Period</Label>
              <Select
                value={filters.meal_period || "all"}
                onValueChange={(value) => handleFilterChange({ meal_period: value === "all" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Periods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Periods</SelectItem>
                  <SelectItem value="BREAKFAST">Breakfast</SelectItem>
                  <SelectItem value="LUNCH">Lunch</SelectItem>
                  <SelectItem value="DINNER">Dinner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Start Date</Label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange({ start_date: e.target.value })}
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">End Date</Label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange({ end_date: e.target.value })}
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Per Page</Label>
              <Select value={filters.page_size.toString()} onValueChange={handlePageSizeChange}>
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
      <Card className="border-amber-200/30 dark:border-amber-800/20">
        <CardHeader className="bg-gradient-to-r from-amber-50/30 to-orange-50/15 dark:from-amber-950/10 dark:to-orange-950/5 rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <Search className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              Detection Results {paginatedData && `(${paginatedData.total_count} total)`}
            </CardTitle>
            {paginatedData && paginatedData.total_pages > 1 && (
              <Badge variant="secondary">
                Page {paginatedData.page} of {paginatedData.total_pages}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Spinner className="h-12 w-12 mx-auto mb-4" />
                <p className="text-muted-foreground">Loading detections...</p>
              </div>
            </div>
          ) : !paginatedData || paginatedData.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-br from-amber-50/40 to-orange-50/20 dark:from-amber-950/10 dark:to-orange-950/5 rounded-lg">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-amber-500 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No detections found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedData.items.map((detection: Detection) => {
                  const displayValues = getDisplayValues(detection);
                  const mealInfo = getMealPeriodInfo(detection.meal_period);

                  return (
                    <div
                      key={detection.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors cursor-pointer border-l-2 border-transparent hover:border-l-amber-400"
                      onClick={() => openDetectionDetails(detection)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Detection Image Thumbnail */}
                        <div className="w-14 h-14 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          <DetectionImage
                            detectionId={detection.id}
                            imageType="food_1"
                            alt="Detection"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold capitalize">
                              {displayValues.category === "NO_WASTE"
                                ? "No Waste"
                                : formatCategoryName(displayValues.category)}
                            </p>
                            {detection.meal_period && (
                              <Badge variant={mealInfo.variant} className="text-xs">
                                {mealInfo.label}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(detection.detected_at), "MMM dd, HH:mm")}
                          </p>
                          <p className="text-xs text-muted-foreground">{getCameraName(detection.camera_id)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Initial Weight */}
                        <div className="text-center bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2 min-w-[70px]">
                          <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {formatWeight(displayValues.initial_weight)}
                          </p>
                          <p className="text-xs text-muted-foreground">initial</p>
                        </div>
                        {/* Confidence */}
                        <div className="text-center bg-muted rounded-lg p-2 min-w-[70px]">
                          <p className="text-sm font-bold">{Math.round(detection.confidence * 100)}%</p>
                          <p className="text-xs text-muted-foreground">confidence</p>
                        </div>
                        {/* Net Weight */}
                        {displayValues.net_weight !== undefined && displayValues.net_weight !== null && (
                          <div className="text-center bg-orange-50 dark:bg-orange-950/30 rounded-lg p-2 min-w-[70px]">
                            <p className="text-sm font-bold text-orange-600 dark:text-orange-400 flex items-center justify-center gap-1">
                              <Scale className="h-3 w-3" />
                              {(Math.abs(displayValues.net_weight) / 1000).toFixed(2)}kg
                            </p>
                            <p className="text-xs text-muted-foreground">net</p>
                          </div>
                        )}
                        {/* Delete Button */}
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteModal(detection);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {paginatedData && paginatedData.total_pages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {(paginatedData.page - 1) * paginatedData.page_size + 1} to{" "}
                    {Math.min(paginatedData.page * paginatedData.page_size, paginatedData.total_count)} of{" "}
                    {paginatedData.total_count} results
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(paginatedData.page - 1)}
                      disabled={!paginatedData.has_prev}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {getPaginationNumbers().map((pageNum) => (
                        <Button
                          key={pageNum}
                          variant={pageNum === paginatedData.page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-9"
                        >
                          {pageNum}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(paginatedData.page + 1)}
                      disabled={!paginatedData.has_next}
                      className="gap-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Detection
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this detection? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {detectionToDelete && (
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                <DetectionImage
                  detectionId={detectionToDelete.id}
                  imageType="food_1"
                  alt="Detection"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-semibold capitalize">
                  {(() => {
                    const displayValues = getDisplayValues(detectionToDelete);
                    return displayValues.category === "NO_WASTE"
                      ? "No Waste"
                      : formatCategoryName(displayValues.category);
                  })()}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(detectionToDelete.detected_at), "MMM dd, HH:mm")}
                </p>
                <p className="text-xs text-muted-foreground">Detection ID: #{detectionToDelete.id}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Detection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
