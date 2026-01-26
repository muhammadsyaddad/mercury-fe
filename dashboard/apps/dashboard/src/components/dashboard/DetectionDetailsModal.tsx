"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@vision_dashboard/ui/dialog";
import { Button } from "@vision_dashboard/ui/button";
import { Badge } from "@vision_dashboard/ui/badge";
import { Label } from "@vision_dashboard/ui/label";
import { Input } from "@vision_dashboard/ui/input";
import { Textarea } from "@vision_dashboard/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@vision_dashboard/ui/select";
import { Spinner } from "@vision_dashboard/ui/spinner";
import { cn } from "@vision_dashboard/ui/cn";
import { toast } from "sonner";
import {
  type Detection,
  UserRole,
  ReviewStatus,
  FoodCategory,
  type Tray,
  type MenuItem,
} from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { trayService } from "@/services/trayService";
import { getDisplayValues } from "@/utils/detectionDisplay";

interface DetectionDetailsModalProps {
  detection: Detection | null;
  isOpen: boolean;
  onClose: () => void;
  showFullDetails?: boolean;
  onReviewUpdate?: (updatedDetection: Detection) => void;
}

export function DetectionDetailsModal({
  detection,
  isOpen,
  onClose,
  showFullDetails = false,
  onReviewUpdate,
}: DetectionDetailsModalProps) {
  const { hasAnyRole } = useAuth();
  const canViewOCRResults = hasAnyRole([UserRole.ADMIN, UserRole.REVIEWER]);
  const canReview = hasAnyRole([
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.REVIEWER,
  ]);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    review_status: ReviewStatus.DETECTION_OK,
    review_notes: "",
    corrected_category: detection?.category || FoodCategory.OTHERS,
    corrected_initial_weight: detection?.initial_weight ?? 0,
    corrected_final_weight: detection?.final_weight ?? 0,
    corrected_description: detection?.description || "",
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
        console.error("Failed to load trays:", error);
        toast.error("Failed to load available trays");
      } finally {
        setLoadingTrays(false);
      }

      // Load menu items
      setLoadingMenuItems(true);
      try {
        const menuItems = await apiService.getActiveMenuItems();
        setAvailableMenuItems(menuItems);
      } catch (error) {
        console.error("Failed to load menu items:", error);
        toast.error("Failed to load menu items");
      } finally {
        setLoadingMenuItems(false);
      }
    };

    loadData();
  }, [isOpen]);

  // Reset review form when detection changes
  useEffect(() => {
    if (detection) {
      setReviewData({
        review_status: detection.review_status || ReviewStatus.DETECTION_OK,
        review_notes: detection.review_notes || "",
        corrected_category: detection.corrected_category || detection.category,
        corrected_initial_weight:
          detection.corrected_initial_weight ?? detection.initial_weight ?? 0,
        corrected_final_weight:
          detection.corrected_final_weight ?? detection.final_weight ?? 0,
        corrected_description:
          detection.corrected_description || detection.description || "",
        corrected_tray_id:
          detection.corrected_tray_id || detection.tray_id || undefined,
      });
      setShowReviewForm(false);
    }
  }, [detection?.id, detection?.review_status, detection]);

  if (!detection) return null;

  const getImageUrl = (imagePath: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

    if (imagePath) {
      return `${baseUrl}/static/${imagePath}`;
    }

    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzlhOWE5YSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIGltYWdlIGF2YWlsYWJsZTwvdGV4dD48L3N2Zz4=';
  };

  const displayValues = getDisplayValues(detection);

  const formatWeight = (weight?: number) => {
    if (weight === undefined || weight === null) {
      return "N/A";
    }
    return `${(weight / 1000).toFixed(2)}kg`;
  };

  const handleReviewSubmit = async () => {
    setSubmitting(true);
    try {
      const updatedDetection = await apiService.reviewDetection(
        detection.id,
        reviewData
      );
      toast.success("Review submitted successfully");
      setShowReviewForm(false);

      // Reload trays
      try {
        const trays = await trayService.getTrays(true);
        setAvailableTrays(trays);
      } catch (error) {
        console.error("Failed to reload trays:", error);
      }

      if (onReviewUpdate) {
        onReviewUpdate(updatedDetection);
      }
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const getReviewStatusColor = (status?: ReviewStatus) => {
    if (!status) return "bg-green-100 text-green-800";
    switch (status) {
      case ReviewStatus.DETECTION_OK:
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case ReviewStatus.DETECTION_REJECTED:
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case ReviewStatus.NEED_REVISION:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case ReviewStatus.REVISION_APPROVED:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const getCategoryColor = (category: string) => {
    const categoryLower = category.toLowerCase();
    const colors: Record<string, string> = {
      protein: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      carbohydrate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      vegetables: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      fruits: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      pastry: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      others: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
      no_waste: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    };
    return colors[categoryLower] || "bg-gray-100 text-gray-800";
  };

  const getCategoryIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    const icons: Record<string, string> = {
      protein: "🥩",
      carbohydrate: "🍞",
      vegetables: "🥬",
      fruits: "🍎",
      pastry: "🧁",
      others: "🍽️",
      no_waste: "✅",
    };
    return icons[categoryLower] || "🍽️";
  };

  const getReviewStatusLabel = (status?: ReviewStatus) => {
    switch (status) {
      case ReviewStatus.DETECTION_OK:
        return "Detection OK";
      case ReviewStatus.NEED_REVISION:
        return "Need Revision";
      case ReviewStatus.DETECTION_REJECTED:
        return "Detection Rejected";
      case ReviewStatus.REVISION_APPROVED:
        return "Revision Approved";
      default:
        return "Detection OK";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">
              {getCategoryIcon(detection.category)}
            </span>
            Detection Details
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Detection Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-3">Detection Information</h3>
              <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Detection ID:</span>
                  <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    #{detection.id}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Category:</span>
                  <Badge className={getCategoryColor(displayValues.category)}>
                    {displayValues.category}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Item:</span>
                  <span className="font-medium">
                    {displayValues.description || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Confidence:</span>
                  <span className="font-medium text-blue-600">
                    {Math.round(detection.confidence * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Camera ID:</span>
                  <span className="font-medium">#{detection.camera_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Detected At:</span>
                  <span className="font-medium">
                    {format(
                      new Date(detection.detected_at),
                      "MMM dd, yyyy HH:mm:ss"
                    )}
                  </span>
                </div>
                {(detection.tray_name ||
                  (detection.corrected_tray_id &&
                    availableTrays.find(
                      (t) => t.id === detection.corrected_tray_id
                    ))) && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tray:</span>
                    <span className="font-medium">
                      {detection.corrected_tray_id
                        ? availableTrays.find(
                            (t) => t.id === detection.corrected_tray_id
                          )?.name
                        : detection.tray_name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Weight Information */}
            <div>
              <h3 className="text-lg font-medium mb-3">Weight Measurements</h3>
              <div className="space-y-3 bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Initial Weight:</span>
                  <span className="font-bold text-blue-700 dark:text-blue-300">
                    {formatWeight(displayValues.initial_weight)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Final Weight:</span>
                  <span className="font-bold text-green-700 dark:text-green-300">
                    {formatWeight(displayValues.final_weight)}
                  </span>
                </div>
                <div className="border-t border-blue-200 dark:border-blue-800 pt-3">
                  <div className="flex justify-between bg-orange-50 dark:bg-orange-950/30 -mx-4 px-4 py-2 rounded">
                    <span className="text-orange-800 dark:text-orange-300 font-medium">
                      Net Food Weight:
                    </span>
                    <span
                      className={cn(
                        "font-bold text-lg",
                        displayValues.net_weight && displayValues.net_weight < 0
                          ? "text-red-600"
                          : displayValues.net_weight === 0
                          ? "text-gray-600"
                          : "text-orange-600"
                      )}
                    >
                      {formatWeight(displayValues.net_weight)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Raw OCR Results */}
            {canViewOCRResults &&
              (detection.initial_ocr_raw_text ||
                detection.final_ocr_raw_text) && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Raw OCR Results</h3>
                  <div className="space-y-3">
                    {detection.initial_ocr_raw_text && (
                      <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                          Initial Weight OCR
                        </h4>
                        <div className="bg-background p-3 rounded border text-xs font-mono break-words">
                          {detection.initial_ocr_raw_text}
                        </div>
                        {detection.initial_ocr_confidence && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                            Confidence:{" "}
                            {(detection.initial_ocr_confidence * 100).toFixed(
                              1
                            )}
                            %
                          </div>
                        )}
                      </div>
                    )}
                    {detection.final_ocr_raw_text && (
                      <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
                          Final Weight OCR
                        </h4>
                        <div className="bg-background p-3 rounded border text-xs font-mono break-words">
                          {detection.final_ocr_raw_text}
                        </div>
                        {detection.final_ocr_confidence && (
                          <div className="text-xs text-green-600 dark:text-green-400 mt-2">
                            Confidence:{" "}
                            {(detection.final_ocr_confidence * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Review Information */}
            <div>
              <h3 className="text-lg font-medium mb-3">Review Status</h3>
              <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={getReviewStatusColor(detection.review_status)}>
                    {getReviewStatusLabel(detection.review_status)}
                  </Badge>
                </div>
                {detection.reviewed_by && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reviewed By:</span>
                    <span className="font-medium">
                      User #{detection.reviewed_by}
                    </span>
                  </div>
                )}
                {detection.reviewed_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reviewed At:</span>
                    <span className="font-medium">
                      {format(
                        new Date(detection.reviewed_at),
                        "MMM dd, yyyy HH:mm"
                      )}
                    </span>
                  </div>
                )}
                {detection.review_notes && (
                  <div className="pt-3 border-t border-border">
                    <span className="text-muted-foreground block mb-2">
                      Notes:
                    </span>
                    <p className="text-sm bg-background p-3 rounded border">
                      {detection.review_notes}
                    </p>
                  </div>
                )}

                {canReview && (
                  <div className="pt-3 border-t border-border">
                    {!showReviewForm ? (
                      <Button onClick={() => setShowReviewForm(true)} size="sm">
                        Review Detection
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Status</Label>
                            <Select
                              value={reviewData.review_status}
                              onValueChange={(value) =>
                                setReviewData({
                                  ...reviewData,
                                  review_status: value as ReviewStatus,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={ReviewStatus.DETECTION_OK}>
                                  Detection OK
                                </SelectItem>
                                <SelectItem value={ReviewStatus.NEED_REVISION}>
                                  Need Revision
                                </SelectItem>
                                <SelectItem
                                  value={ReviewStatus.DETECTION_REJECTED}
                                >
                                  Detection Rejected
                                </SelectItem>
                                <SelectItem
                                  value={ReviewStatus.REVISION_APPROVED}
                                >
                                  Revision Approved
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Corrected Category</Label>
                            <Select
                              value={reviewData.corrected_category}
                              onValueChange={(value) =>
                                setReviewData({
                                  ...reviewData,
                                  corrected_category: value as FoodCategory,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(FoodCategory).map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category
                                      .replace("_", " ")
                                      .toLowerCase()
                                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Corrected Initial Weight (kg)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={
                                reviewData.corrected_initial_weight
                                  ? (
                                      reviewData.corrected_initial_weight / 1000
                                    ).toFixed(2)
                                  : ""
                              }
                              onChange={(e) => {
                                const value =
                                  e.target.value === ""
                                    ? 0
                                    : Number.parseFloat(e.target.value);
                                setReviewData({
                                  ...reviewData,
                                  corrected_initial_weight: Number.isNaN(value)
                                    ? 0
                                    : value * 1000,
                                });
                              }}
                            />
                          </div>
                          <div>
                            <Label>Corrected Final Weight (kg)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={
                                reviewData.corrected_final_weight
                                  ? (
                                      reviewData.corrected_final_weight / 1000
                                    ).toFixed(2)
                                  : ""
                              }
                              onChange={(e) => {
                                const value =
                                  e.target.value === ""
                                    ? 0
                                    : Number.parseFloat(e.target.value);
                                setReviewData({
                                  ...reviewData,
                                  corrected_final_weight: Number.isNaN(value)
                                    ? 0
                                    : value * 1000,
                                });
                              }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Corrected Menu/Item</Label>
                            <Select
                              value={reviewData.corrected_description}
                              onValueChange={(value) =>
                                setReviewData({
                                  ...reviewData,
                                  corrected_description: value,
                                })
                              }
                              disabled={loadingMenuItems}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select menu item" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">
                                  Select menu item or leave blank
                                </SelectItem>
                                {availableMenuItems.map((item) => (
                                  <SelectItem key={item.id} value={item.name}>
                                    {item.name} (
                                    {item.category
                                      .toLowerCase()
                                      .replace("_", " ")}
                                    )
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {loadingMenuItems && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Loading menu items...
                              </p>
                            )}
                          </div>
                          <div>
                            <Label>Corrected Tray</Label>
                            <Select
                              value={
                                reviewData.corrected_tray_id?.toString() || ""
                              }
                              onValueChange={(value) =>
                                setReviewData({
                                  ...reviewData,
                                  corrected_tray_id: value
                                    ? Number.parseInt(value)
                                    : undefined,
                                })
                              }
                              disabled={loadingTrays}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select tray" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">
                                  No tray / Auto-detect
                                </SelectItem>
                                {availableTrays.map((tray) => (
                                  <SelectItem
                                    key={tray.id}
                                    value={tray.id.toString()}
                                  >
                                    {tray.name} (
                                    {(tray.weight / 1000).toFixed(2)}kg)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {loadingTrays && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Loading trays...
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label>Review Notes</Label>
                          <Textarea
                            value={reviewData.review_notes}
                            onChange={(e) =>
                              setReviewData({
                                ...reviewData,
                                review_notes: e.target.value,
                              })
                            }
                            rows={3}
                            placeholder="Add any notes about this review..."
                          />
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            onClick={handleReviewSubmit}
                            disabled={submitting}
                            size="sm"
                          >
                            {submitting ? (
                              <>
                                <Spinner className="mr-2 h-4 w-4" />
                                Submitting...
                              </>
                            ) : (
                              "Submit Review"
                            )}
                          </Button>
                          <Button
                            onClick={() => setShowReviewForm(false)}
                            variant="outline"
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Motion Data */}
            {showFullDetails && detection.motion_data && (
              <div>
                <h3 className="text-lg font-medium mb-3">Motion Data</h3>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <pre className="text-xs text-muted-foreground overflow-x-auto">
                    {JSON.stringify(detection.motion_data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Images */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-3">Food Detection Image</h3>
              <div className="border-2 border-border rounded-lg overflow-hidden bg-muted">
                <img
                  src={getImageUrl(detection.image_path)}
                  alt="Food detection"
                  className="w-full h-64 object-cover hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzlhOWE5YSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                  }}
                />
              </div>
            </div>

            {/* OCR Images */}
            <div>
              <h3 className="text-lg font-medium mb-3">Weight Scale Images</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Before (Initial)</h4>
                  <div className="border rounded-lg overflow-hidden bg-blue-50 dark:bg-blue-950/30 aspect-square relative">
                    {detection.initial_ocr_path ? (
                      <img
                        src={getImageUrl(detection.initial_ocr_path)}
                        alt="Initial OCR scale reading"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-blue-600 dark:text-blue-400 p-2">
                        <span className="text-2xl mb-1">⚖️</span>
                        <span className="text-xs text-center">Initial OCR</span>
                        <span className="text-xs text-center text-muted-foreground">
                          No image captured
                        </span>
                        <span className="font-bold text-sm">
                          {formatWeight(displayValues.initial_weight)}
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white p-2 text-center">
                      <span className="text-sm font-bold">
                        {formatWeight(displayValues.initial_weight)}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">After (Final)</h4>
                  <div className="border rounded-lg overflow-hidden bg-green-50 dark:bg-green-950/30 aspect-square relative">
                    {detection.final_ocr_path ? (
                      <img
                        src={getImageUrl(detection.final_ocr_path)}
                        alt="Final OCR scale reading"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-green-600 dark:text-green-400 p-2">
                        <span className="text-2xl mb-1">⚖️</span>
                        <span className="text-xs text-center">Final OCR</span>
                        <span className="text-xs text-center text-muted-foreground">
                          No image captured
                        </span>
                        <span className="font-bold text-sm">
                          {formatWeight(displayValues.final_weight)}
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white p-2 text-center">
                      <span className="text-sm font-bold">
                        {formatWeight(displayValues.final_weight)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DetectionDetailsModal;
