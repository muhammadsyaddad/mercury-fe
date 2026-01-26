import { Detection, ReviewStatus } from '../types';

/**
 * Returns the appropriate values to display for a detection based on review status.
 * Shows corrected values only for REVISION_APPROVED status, original values otherwise.
 */
export function getDisplayValues(detection: Detection) {
  const shouldShowCorrected = detection.review_status === ReviewStatus.REVISION_APPROVED;
  
  return {
    category: shouldShowCorrected && detection.corrected_category 
      ? detection.corrected_category 
      : detection.category,
    
    description: shouldShowCorrected && detection.corrected_description 
      ? detection.corrected_description 
      : detection.description,
    
    initial_weight: shouldShowCorrected && detection.corrected_initial_weight !== undefined 
      ? detection.corrected_initial_weight 
      : detection.initial_weight,
    
    final_weight: shouldShowCorrected && detection.corrected_final_weight !== undefined 
      ? detection.corrected_final_weight 
      : detection.final_weight,
    
    // Calculate weight difference using the appropriate values
    weight: (() => {
      const initialWeight = shouldShowCorrected && detection.corrected_initial_weight !== undefined 
        ? detection.corrected_initial_weight 
        : detection.initial_weight;
      
      const finalWeight = shouldShowCorrected && detection.corrected_final_weight !== undefined 
        ? detection.corrected_final_weight 
        : detection.final_weight;
      
      return (initialWeight !== null && initialWeight !== undefined && finalWeight !== null && finalWeight !== undefined) ? finalWeight - initialWeight : detection.weight;
    })(),
    
    // Net weight - use the corrected net_weight which is recalculated by backend when corrected data is saved
    net_weight: detection.net_weight,
    
    // Indicate if showing corrected values
    isShowingCorrected: shouldShowCorrected && (
      detection.corrected_category ||
      detection.corrected_description ||
      detection.corrected_initial_weight !== undefined ||
      detection.corrected_final_weight !== undefined
    )
  };
}