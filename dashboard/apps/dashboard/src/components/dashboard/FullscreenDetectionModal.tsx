"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  X,
  CheckCircle,
  AlertCircle,
  XCircle,
  Scale,
  Camera,
  Clock,
  Gauge,
  UtensilsCrossed,
  Loader2,
} from "lucide-react";
import { cn } from "@vision_dashboard/ui/cn";
import Image from "next/image";
import type { Detection } from "@/types";
import { FoodCategory, ReviewStatus } from "@/types";
import { apiService } from "@/services/api";

interface FullscreenDetectionModalProps {
  detection: Detection | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (
    detectionId: number,
    action: "accept" | "review" | "cancel"
  ) => void;
}

// Category helpers
const getCategoryIcon = (category: FoodCategory | string) => {
  const icons: Record<string, string> = {
    [FoodCategory.PROTEIN]: "🥩",
    [FoodCategory.CARBOHYDRATE]: "🍞",
    [FoodCategory.VEGETABLES]: "🥬",
    [FoodCategory.FRUITS]: "🍎",
    [FoodCategory.PASTRY]: "🧁",
    [FoodCategory.OTHERS]: "🍽️",
    [FoodCategory.NO_WASTE]: "✅",
  };
  const key = typeof category === "string" ? category : String(category);
  return icons[key] || "🍽️";
};

const getCategoryColor = (category: FoodCategory | string) => {
  const colors: Record<string, string> = {
    [FoodCategory.PROTEIN]: "#ef4444",
    [FoodCategory.CARBOHYDRATE]: "#f59e0b",
    [FoodCategory.VEGETABLES]: "#10b981",
    [FoodCategory.FRUITS]: "#8b5cf6",
    [FoodCategory.PASTRY]: "#ec4899",
    [FoodCategory.OTHERS]: "#6b7280",
    [FoodCategory.NO_WASTE]: "#9ca3af",
  };
  const key = typeof category === "string" ? category : String(category);
  return colors[key] || "#6b7280";
};

const formatWeight = (weight?: number | null) =>
  weight == null ? "N/A" : `${(weight / 1000).toFixed(3)}kg`;

const categoryLabel = (category?: FoodCategory | string) => {
  const key = typeof category === "string" ? category : String(category);
  return key === "NO_WASTE" ? "No Waste" : key.toLowerCase();
};

const getItemName = (d: Detection | null) => {
  if (!d) return "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyD = d as any;
  return (
    anyD.item ||
    anyD.food_item ||
    anyD.item_name ||
    anyD.product_name ||
    d.description ||
    ""
  );
};

const getProcessingStatus = (d: Detection | null) => {
  if (!d) return "unknown";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyD = d as any;
  const status = anyD.status;

  if (status) return status;

  if (!d.category || d.description === "Analyzing...") return "analyzing";
  if (d.category && !d.initial_weight) return "food_classified";
  if (d.initial_weight && !d.final_weight) return "initial_ocr_complete";
  if (d.final_weight) return "complete";

  return "unknown";
};

const getStatusInfo = (status: string) => {
  switch (status) {
    case "analyzing":
      return {
        text: "Analyzing Food...",
        color: "text-blue-300",
        bgColor: "bg-blue-500/20",
        spinning: true,
      };
    case "food_classified":
      return {
        text: "Reading Initial Weight...",
        color: "text-green-300",
        bgColor: "bg-green-500/20",
        spinning: true,
      };
    case "initial_ocr_complete":
      return {
        text: "Awaiting Final Weight...",
        color: "text-yellow-300",
        bgColor: "bg-yellow-500/20",
        spinning: false,
      };
    case "complete":
      return {
        text: "Processing Complete",
        color: "text-green-300",
        bgColor: "bg-green-500/20",
        spinning: false,
      };
    case "ai_error":
      return {
        text: "AI Processing Failed",
        color: "text-red-300",
        bgColor: "bg-red-500/20",
        spinning: false,
      };
    default:
      return {
        text: "Unknown Status",
        color: "text-gray-300",
        bgColor: "bg-gray-500/20",
        spinning: false,
      };
  }
};

export function FullscreenDetectionModal({
  detection,
  isOpen,
  onClose,
  onAction,
}: FullscreenDetectionModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = useCallback(
    async (action: "accept" | "review" | "cancel") => {
      if (!detection) return;
      setIsProcessing(true);
      try {
        let reviewStatus: ReviewStatus;
        let reviewNotes: string;
        switch (action) {
          case "accept":
            reviewStatus = ReviewStatus.DETECTION_OK;
            reviewNotes = "Detection automatically approved via SSE popup";
            break;
          case "review":
            reviewStatus = ReviewStatus.NEED_REVISION;
            reviewNotes = "Detection marked for review via SSE popup";
            break;
          case "cancel":
            reviewStatus = ReviewStatus.DETECTION_REJECTED;
            reviewNotes = "Detection rejected via SSE popup";
            break;
        }

        await apiService.reviewDetection(detection.id, {
          review_status: reviewStatus,
          review_notes: reviewNotes,
        });

        const actionText =
          action === "accept"
            ? "approved"
            : action === "review"
              ? "marked for review"
              : "cancelled";
        toast.success(`Detection ${actionText} successfully`);
        onAction(detection.id, action);
        onClose();
      } catch {
        const actionText =
          action === "accept"
            ? "approve"
            : action === "review"
              ? "mark for review"
              : "cancel";
        toast.error(`Failed to ${actionText} detection`);
      } finally {
        setIsProcessing(false);
      }
    },
    [detection, onAction, onClose]
  );

  // Escape to close + body scroll lock
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) onClose();
      if (!detection || isProcessing) return;
      const k = event.key.toLowerCase();
      if (k === "a") handleAction("accept");
      if (k === "r") handleAction("review");
      if (k === "c") handleAction("cancel");
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, detection, isProcessing, handleAction]);

  // Auto-close logic
  useEffect(() => {
    if (!isOpen || !detection) return;

    const processingStatus = getProcessingStatus(detection);

    if (processingStatus === "complete" || processingStatus === "ai_error") {
      const delay =
        detection.category === FoodCategory.NO_WASTE ? 1000 : 10000;

      const autoCloseTimer = setTimeout(() => {
        onClose();
      }, delay);

      return () => {
        clearTimeout(autoCloseTimer);
      };
    }
  }, [isOpen, onClose, detection]);

  // Weight calculations
  const weights = useMemo(() => {
    if (!detection) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyD = detection as any;
    const initialWeight = detection.initial_weight ?? null;
    const finalWeight = detection.final_weight ?? null;
    const trayWeight = anyD.tray_weight ?? anyD.tray?.weight ?? 0;
    const netWeight = anyD.net_weight ?? 0;
    return { initialWeight, finalWeight, trayWeight, netWeight };
  }, [detection]);

  if (!isOpen || !detection) return null;

  const color = getCategoryColor(detection.category);
  const icon = getCategoryIcon(detection.category);
  const itemName = getItemName(detection);
  const processingStatus = getProcessingStatus(detection);
  const statusInfo = getStatusInfo(processingStatus);


  const actionsEnabled =
    processingStatus === "complete" || processingStatus === "ai_error";

  return (
    <>
      {/* Blink animation for buttons */}
      <style>{`
        @keyframes btnBlink { 0%,100%{opacity:1} 50%{opacity:.65} }
        .btn-blink { animation: btnBlink 1.15s ease-in-out infinite; }
      `}</style>

      <div className="fixed inset-0 z-[9999] bg-black/95 text-white">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 h-14 px-4 flex items-center justify-between border-b border-white/10 bg-gradient-to-b from-black/60 to-transparent backdrop-blur-sm">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex items-center gap-2 text-sm text-white/80">
              <Camera className="w-4 h-4" />
              <span className="truncate max-w-[28vw]">
                {detection.camera?.name || `Camera ${detection.camera_id}`}
              </span>
            </span>
            <span className="hidden md:inline-block w-px h-4 bg-white/10" />

            {/* Processing Status */}
            <span
              className={cn(
                "inline-flex items-center gap-2 text-sm px-2 py-1 rounded-md",
                statusInfo.bgColor,
                statusInfo.color
              )}
            >
              {statusInfo.spinning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : processingStatus === "complete" ? (
                <CheckCircle className="w-4 h-4" />
              ) : processingStatus === "ai_error" ? (
                <XCircle className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
              <span className="font-medium">{statusInfo.text}</span>
            </span>

            {detection.confidence && (
              <>
                <span className="hidden md:inline-block w-px h-4 bg-white/10" />
                <span className="hidden md:inline-flex items-center gap-2 text-sm text-white/70">
                  <Gauge className="w-4 h-4" /> Confidence{" "}
                  <b className="ml-1">
                    {Math.round((detection.confidence ?? 0) * 100)}%
                  </b>
                </span>
              </>
            )}

            {detection.category && (
              <>
                <span className="hidden md:inline-block w-px h-4 bg-white/10" />
                <span
                  className="text-xs md:text-sm font-semibold px-2 py-1 rounded-md"
                  style={{ backgroundColor: color }}
                >
                  {categoryLabel(detection.category)}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-2 text-sm text-white/70">
              <Clock className="w-4 h-4" /> {format(new Date(), "PP p")}
            </span>
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-white/10 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="absolute inset-x-0 top-14 bottom-4 grid grid-cols-12 gap-4 p-4 min-h-0">
          {/* LEFT: Image + Info */}
          <div className="col-span-8 lg:col-span-8 2xl:col-span-9 min-h-0 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 h-full min-h-0">
              {/* Image panel */}
              <div className="col-span-5 xl:col-span-5 min-h-[240px] space-y-3">
                <div className="relative w-full h-[36vh] md:h-[40vh] xl:h-[48vh] rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border border-white/10">
                  <Image
                    src={apiService.getImageUrl(detection.image_path ?? "")}
                    alt="Detection"
                    className="absolute inset-0 w-full h-full object-contain select-none"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = "none";
                    }}
                    draggable={false}
                    fill
                    sizes="(min-width: 1536px) 75vw, (min-width: 1024px) 66vw, 100vw"
                    unoptimized
                  />
                  {/* Fallback icon */}
                  <div
                    className="absolute inset-0 grid place-items-center text-8xl"
                    aria-hidden
                  >
                    <span className="opacity-40">{icon}</span>
                  </div>
                  {/* Overlays */}
                  <div className="absolute left-4 top-4 px-2 py-1 text-xs rounded-md bg-black/70 border border-white/10">
                    {detection.camera?.name || `Camera ${detection.camera_id}`}
                  </div>
                  <div className="absolute right-4 top-4 px-2 py-1 text-xs font-bold rounded-md bg-white/10 border border-white/20">
                    {Math.round((detection.confidence ?? 0) * 100)}%
                  </div>
                  {/* Category chip */}
                  <div
                    className="absolute left-4 bottom-4 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg"
                    style={{ backgroundColor: color }}
                  >
                    <span className="text-xl leading-none">{icon}</span>
                    <span className="text-sm font-semibold capitalize">
                      {categoryLabel(detection.category)}
                    </span>
                  </div>
                </div>

                {/* OCR Images */}
                {(detection.initial_ocr_path || detection.final_ocr_path) && (
                  <div className="grid grid-cols-2 gap-3">
                    {detection.initial_ocr_path && (
                      <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Scale className="w-4 h-4 text-blue-300" />
                          <span className="text-xs text-blue-200/80 font-medium">
                            Initial Scale
                          </span>
                        </div>
                        <div className="relative w-full h-16 rounded-lg overflow-hidden bg-gradient-to-br from-blue-900/20 to-blue-800/20">
                          <Image
                            src={apiService.getImageUrl(detection.initial_ocr_path)}
                            alt="Initial OCR"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.display = "none";
                            }}
                            width={160}
                            height={64}
                            sizes="(min-width: 1024px) 12vw, 25vw"
                            unoptimized
                          />
                        </div>
                      </div>
                    )}

                    {detection.final_ocr_path && (
                      <div className="rounded-xl border border-green-400/20 bg-green-500/10 p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Scale className="w-4 h-4 text-green-300" />
                          <span className="text-xs text-green-200/80 font-medium">
                            Final Scale
                          </span>
                        </div>
                        <div className="relative w-full h-16 rounded-lg overflow-hidden bg-gradient-to-br from-green-900/20 to-green-800/20">
                          <Image
                            src={apiService.getImageUrl(detection.final_ocr_path)}
                            alt="Final OCR"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.display = "none";
                            }}
                            width={160}
                            height={64}
                            sizes="(min-width: 1024px) 12vw, 25vw"
                            unoptimized
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right of image: Food + Net Waste */}
              <div className="col-span-7 xl:col-span-7 min-h-0 overflow-auto space-y-4 pr-1">
                {/* Food Classification */}
                <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-2 justify-between">
                    <h3 className="text-sm font-semibold opacity-80 flex items-center gap-2 mr-2">
                      <UtensilsCrossed className="w-4 h-4" /> Food Classification
                    </h3>
                  </div>

                  <div className="mt-3">
                    {processingStatus === "analyzing" ? (
                      <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-md text-base md:text-lg font-semibold bg-blue-500/20 border border-blue-400/30 text-blue-300">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Analyzing food...</span>
                      </div>
                    ) : detection.category ? (
                      <span
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-base md:text-lg font-semibold"
                        style={{ backgroundColor: color }}
                      >
                        <span className="text-xl leading-none">{icon}</span>
                        <span className="capitalize">
                          {categoryLabel(detection.category)}
                        </span>
                      </span>
                    ) : (
                      <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-md text-base md:text-lg font-semibold bg-gray-500/20 border border-gray-400/30 text-gray-300">
                        <Clock className="w-5 h-5" />
                        <span>Classification pending...</span>
                      </div>
                    )}
                  </div>

                  {itemName && itemName !== "Analyzing..." && (
                    <div className="mt-3 text-2xl md:text-3xl font-extrabold text-white break-words leading-tight">
                      {itemName}
                    </div>
                  )}
                </section>

                {/* Net Waste */}
                <section className="rounded-2xl border border-red-400/40 bg-red-500/10 p-5 ring-2 ring-red-400/40">
                  <p className="text-sm text-red-200/90 tracking-wide">
                    Net Waste
                  </p>
                  {processingStatus === "analyzing" ||
                  processingStatus === "food_classified" ? (
                    <div className="flex items-center gap-3 text-4xl md:text-5xl font-black text-gray-400 leading-tight">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span>Calculating...</span>
                    </div>
                  ) : weights?.netWeight !== undefined &&
                    weights?.netWeight !== null ? (
                    <p className="text-4xl md:text-5xl font-black text-red-300 leading-tight drop-shadow">
                      {formatWeight(weights.netWeight)}
                    </p>
                  ) : (
                    <p className="text-4xl md:text-5xl font-black text-gray-400 leading-tight">
                      Pending...
                    </p>
                  )}
                </section>
              </div>

              {/* Weights row */}
              <div className="col-span-12">
                <section className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-3">
                    <p className="text-xs text-blue-200/80">Initial Weight</p>
                    {processingStatus === "analyzing" ||
                    (processingStatus === "food_classified" &&
                      !weights?.initialWeight) ? (
                      <div className="flex items-center gap-2 text-lg font-bold text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Reading...</span>
                      </div>
                    ) : (
                      <p className="text-lg font-bold text-blue-300">
                        {formatWeight(weights?.initialWeight)}
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-green-400/20 bg-green-500/10 p-3">
                    <p className="text-xs text-green-200/80">Final Weight</p>
                    {processingStatus !== "complete" &&
                    !weights?.finalWeight ? (
                      <div className="flex items-center gap-2 text-lg font-bold text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>Awaiting...</span>
                      </div>
                    ) : (
                      <p className="text-lg font-bold text-green-300">
                        {formatWeight(weights?.finalWeight)}
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
                    <p className="text-xs text-amber-200/80">Tray Weight</p>
                    <p className="text-lg font-bold text-amber-300">
                      {formatWeight(weights?.trayWeight)}
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </div>

          {/* RIGHT: Action Buttons */}
          <aside className="col-span-4 lg:col-span-4 2xl:col-span-3 min-h-0">
            <div className="h-full w-full rounded-2xl border border-white/10 bg-white/5 p-3 grid grid-rows-3 gap-3 overflow-y-auto">
              {actionsEnabled ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleAction("accept")}
                    disabled={isProcessing}
                    className="btn-blink h-full min-h-[110px] bg-green-600/30 hover:bg-green-600/40 text-white rounded-xl font-semibold text-2xl flex items-center justify-center gap-3 border border-green-500/30 disabled:opacity-60"
                  >
                    <CheckCircle className="w-7 h-7" /> Accept{" "}
                    <kbd className="ml-1 px-2 py-0.5 rounded-md text-xs border border-white/20 bg-black/30">
                      A
                    </kbd>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction("review")}
                    disabled={isProcessing}
                    className="btn-blink h-full min-h-[110px] bg-yellow-600/30 hover:bg-yellow-600/40 text-white rounded-xl font-semibold text-2xl flex items-center justify-center gap-3 border border-yellow-500/30 disabled:opacity-60"
                  >
                    <AlertCircle className="w-7 h-7" /> Review{" "}
                    <kbd className="ml-1 px-2 py-0.5 rounded-md text-xs border border-white/20 bg-black/30">
                      R
                    </kbd>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction("cancel")}
                    disabled={isProcessing}
                    className="btn-blink h-full min-h-[110px] bg-red-600/30 hover:bg-red-600/40 text-white rounded-xl font-semibold text-2xl flex items-center justify-center gap-3 border border-red-500/30 disabled:opacity-60"
                  >
                    <XCircle className="w-7 h-7" /> Cancel{" "}
                    <kbd className="ml-1 px-2 py-0.5 rounded-md text-xs border border-white/20 bg-black/30">
                      C
                    </kbd>
                  </button>
                </>
              ) : (
                <>
                  <div className="h-full min-h-[110px] bg-gray-600/20 text-gray-400 rounded-xl font-semibold text-xl flex items-center justify-center gap-3 border border-gray-500/30">
                    <CheckCircle className="w-6 h-6" /> Accept (disabled)
                  </div>
                  <div className="h-full min-h-[110px] bg-gray-600/20 text-gray-400 rounded-xl font-semibold text-xl flex items-center justify-center gap-3 border border-gray-500/30">
                    <AlertCircle className="w-6 h-6" /> Review (disabled)
                  </div>
                  <div className="h-full min-h-[110px] bg-gray-600/20 text-gray-400 rounded-xl font-semibold text-xl flex items-center justify-center gap-3 border border-gray-500/30">
                    <XCircle className="w-6 h-6" /> Cancel (disabled)
                  </div>
                </>
              )}

              {isProcessing && (
                <div className="row-span-1 self-center text-sm text-white/70">
                  Processing action...
                </div>
              )}

              {!actionsEnabled && !isProcessing && (
                <div className="row-span-1 self-center text-center">
                  <p className="text-sm text-white/60 mb-1">
                    AI processing in progress...
                  </p>
                  <p className="text-xs text-white/40">
                    Actions will be available when complete
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

export default FullscreenDetectionModal;
