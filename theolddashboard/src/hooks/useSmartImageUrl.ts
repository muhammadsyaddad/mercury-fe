import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export const useSmartImageUrl = (
  detectionId: number,
  imageType: 'food_1' | 'food_2' | 'initial_ocr' | 'initial_ocr_2' | 'final_ocr' | 'final_ocr_2',
  fallbackPath?: string
) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const getImageUrl = async () => {
      setLoading(true);
      setError(null);

      try {
        // First try to get GCS URL or new image endpoint
        const smartUrl = await apiService.getDetectionImageUrl(detectionId, imageType);
        
        if (mounted) {
          setUrl(smartUrl);
        }
      } catch (err) {
        console.warn(`Failed to get smart URL for detection ${detectionId}, type ${imageType}:`, err);
        
        if (mounted) {
          // Fallback to static URL if available
          if (fallbackPath) {
            setUrl(apiService.getImageUrl(fallbackPath));
          } else {
            setUrl(null);
            setError('Image URL not available');
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getImageUrl();

    return () => {
      mounted = false;
    };
  }, [detectionId, imageType, fallbackPath]);

  return { url, loading, error };
};

export default useSmartImageUrl;