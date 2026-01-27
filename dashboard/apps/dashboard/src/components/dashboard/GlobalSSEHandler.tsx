"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { Detection } from "@/types";
import { UserRole } from "@/types";
import { FullscreenDetectionModal } from "./FullscreenDetectionModal";

interface GlobalSSEHandlerProps {
  newDetection: Detection | null;
  onDetectionProcessed: () => void;
}

export function GlobalSSEHandler({
  newDetection,
  onDetectionProcessed,
}: GlobalSSEHandlerProps) {
  const { hasAnyRole } = useAuth();
  const [showDetectionModal, setShowDetectionModal] = useState(false);

  // Only show popup for users who can review detections
  const canReviewDetections = hasAnyRole([
    UserRole.WORKER,
    UserRole.ADMIN,
  ]);

  useEffect(() => {
    if (newDetection && canReviewDetections) {
      setShowDetectionModal(true);
    }
  }, [newDetection, canReviewDetections]);

  const handleDetectionAction = (
    detectionId: number,
    action: "accept" | "review" | "cancel"
  ) => {
    console.log(`Detection ${detectionId} ${action}ed`);
  };

  const closeDetectionModal = () => {
    setShowDetectionModal(false);
    onDetectionProcessed();
  };

  if (!canReviewDetections) {
    return null;
  }

  return (
    <FullscreenDetectionModal
      detection={newDetection}
      isOpen={showDetectionModal}
      onClose={closeDetectionModal}
      onAction={handleDetectionAction}
    />
  );
}

export default GlobalSSEHandler;
