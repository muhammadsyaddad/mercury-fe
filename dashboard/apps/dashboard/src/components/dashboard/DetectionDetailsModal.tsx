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
import { getCategoryColorClass, getCategoryIcon } from "@/utils/categoryUtils";
import { formatWeight } from "@/utils/weightUtils";
import { ReviewForm, type ReviewData } from "./ReviewForm";
import { DetectionImageGallery } from "./DetectionImageGallery";

interface DetectionDetailsModalProps {
  detection: Detection | null;
  isOpen: boolean;
  onClose: () => void;
  showFullDetails?: boolean;
  onReviewUpdate?: (updatedDetection: Detection) => void;
}

function getReviewStatusColor(status?: ReviewStatus) {
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
}

function getReviewStatusLabel(status?: ReviewStatus) {
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
}

export function DetectionDetailsModal({
  detection,
  isOpen,
  onClose,
  showFullDetails = false,
  onReviewUpdate,
}: DetectionDetailsModalProps) {
  const { hasAnyRole } = useAuth();
  const canViewOCRResults = hasAnyRole([UserRole.ADMIN]);
  const canReview = hasAnyRole([UserRole.ADMIN, UserRole.WORKER]);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState<ReviewData>({
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

  useEffect(() => {
    const loadData = async () => {
      if (!isOpen) return;

      setLoadingTrays(true);
      setLoadingMenuItems(true);

      const [traysResult, menuItemsResult] = await Promise.allSettled([
        trayService.getTrays(true),
        apiService.getActiveMenuItems(),
      ]);

      if (traysResult.status === "fulfilled") {
        setAvailableTrays(traysResult.value);
      } else {
        console.error("Failed to load trays:", traysResult.reason);
        toast.error("Failed to load available trays");
      }

      if (menuItemsResult.status === "fulfilled") {
        setAvailableMenuItems(menuItemsResult.value);
      } else {
        console.error("Failed to load menu items:", menuItemsResult.reason);
        toast.error("Failed to load menu items");
      }

      setLoadingTrays(false);
      setLoadingMenuItems(false);
    };

    loadData();
  }, [isOpen]);

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

  const missingImageDataUri =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzlhOWE5YSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIGltYWdlIGF2YWlsYWJsZTwvdGV4dD48L3N2Zz4=";

  const getImageUrl = (imagePath?: string) =>
    imagePath ? apiService.getImageUrl(imagePath) : missingImageDataUri;

  const displayValues = getDisplayValues(detection);

  const handleReviewSubmit = async () => {
    setSubmitting(true);
    try {
      const updatedDetection = await apiService.reviewDetection(
        detection.id,
        reviewData
      );
      toast.success("Review submitted successfully");
      setShowReviewForm(false);

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
            {/* Detection Information */}
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
                  <Badge className={getCategoryColorClass(displayValues.category)}>
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

            {/* Weight Measurements */}
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
                      <OcrResultBlock
                        label="Initial Weight OCR"
                        rawText={detection.initial_ocr_raw_text}
                        confidence={detection.initial_ocr_confidence}
                        colorScheme="blue"
                      />
                    )}
                    {detection.final_ocr_raw_text && (
                      <OcrResultBlock
                        label="Final Weight OCR"
                        rawText={detection.final_ocr_raw_text}
                        confidence={detection.final_ocr_confidence}
                        colorScheme="green"
                      />
                    )}
                  </div>
                </div>
              )}

            {/* Review Status */}
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
                      <ReviewForm
                        reviewData={reviewData}
                        onReviewDataChange={setReviewData}
                        onSubmit={handleReviewSubmit}
                        onCancel={() => setShowReviewForm(false)}
                        submitting={submitting}
                        availableTrays={availableTrays}
                        loadingTrays={loadingTrays}
                        availableMenuItems={availableMenuItems}
                        loadingMenuItems={loadingMenuItems}
                      />
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
          <DetectionImageGallery
            imagePath={detection.image_path}
            initialOcrPath={detection.initial_ocr_path}
            finalOcrPath={detection.final_ocr_path}
            initialWeight={displayValues.initial_weight}
            finalWeight={displayValues.final_weight}
            getImageUrl={getImageUrl}
          />
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

/** Displays a single OCR result block (initial or final) */
function OcrResultBlock({
  label,
  rawText,
  confidence,
  colorScheme,
}: {
  label: string;
  rawText: string;
  confidence?: number;
  colorScheme: "blue" | "green";
}) {
  const colors = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-950/30",
      heading: "text-blue-800 dark:text-blue-300",
      detail: "text-blue-600 dark:text-blue-400",
    },
    green: {
      bg: "bg-green-50 dark:bg-green-950/30",
      heading: "text-green-800 dark:text-green-300",
      detail: "text-green-600 dark:text-green-400",
    },
  } as const;
  const c = colors[colorScheme];

  return (
    <div className={`${c.bg} p-4 rounded-lg`}>
      <h4 className={`text-sm font-medium ${c.heading} mb-2`}>{label}</h4>
      <div className="bg-background p-3 rounded border text-xs font-mono break-words">
        {rawText}
      </div>
      {confidence && (
        <div className={`text-xs ${c.detail} mt-2`}>
          Confidence: {(confidence * 100).toFixed(1)}%
        </div>
      )}
    </div>
  );
}

export default DetectionDetailsModal;
