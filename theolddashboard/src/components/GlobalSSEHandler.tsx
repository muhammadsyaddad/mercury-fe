import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Detection, UserRole } from '../types';
import FullscreenDetectionModal from './FullscreenDetectionModal';

interface GlobalSSEHandlerProps {
  newDetection: Detection | null;
  onDetectionProcessed: () => void;
}

const GlobalSSEHandler: React.FC<GlobalSSEHandlerProps> = ({ 
  newDetection, 
  onDetectionProcessed 
}) => {
  const { hasAnyRole } = useAuth();
  const [showDetectionModal, setShowDetectionModal] = useState(false);

  // Only show popup for users who can review detections
  const canReviewDetections = hasAnyRole([UserRole.STAFF, UserRole.REVIEWER, UserRole.MANAGER, UserRole.ADMIN]);

  useEffect(() => {
    if (newDetection && canReviewDetections) {
      setShowDetectionModal(true);
    }
  }, [newDetection, canReviewDetections]);

  const handleDetectionAction = (detectionId: number, action: 'accept' | 'review' | 'cancel') => {
    // The action is already handled in the modal component
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
};

export default GlobalSSEHandler;