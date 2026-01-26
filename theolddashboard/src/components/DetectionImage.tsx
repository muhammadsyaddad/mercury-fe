import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';

interface DetectionImageProps {
  detectionId: number;
  imageType: 'food_1' | 'food_2' | 'initial_ocr' | 'initial_ocr_2' | 'final_ocr' | 'final_ocr_2';
  fallbackPath?: string; // Local path as fallback
  alt: string;
  className?: string;
  onError?: (error: Error) => void;
  placeholderText?: string;
}

// Global cache for successful image loads
const imageCache = new Map<string, string>();

const DetectionImage: React.FC<DetectionImageProps> = ({
  detectionId,
  imageType,
  fallbackPath,
  alt,
  className = '',
  onError,
  placeholderText = 'Image not available'
}) => {
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  // Initialize from cache immediately
  const cacheKey = `${detectionId}-${imageType}`;
  const cachedUrl = imageCache.get(cacheKey);
  
  const [imageUrl, setImageUrl] = useState<string | null>(cachedUrl || null);
  const [loading, setLoading] = useState(!cachedUrl);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip loading if we already have this image cached
    if (imageCache.has(cacheKey)) {
      return;
    }

    let mounted = true;

    const loadImage = async () => {
      setLoading(true);
      setError(null);

      try {
        // First try to get GCS URL or new image endpoint
        const url = await apiService.getDetectionImageUrl(detectionId, imageType);
        
        if (mounted) {
          setImageUrl(url);
          setLoading(false);
          // Cache successful load
          imageCache.set(cacheKey, url);
        }
      } catch (err) {
        console.warn(`Failed to get GCS URL for detection ${detectionId}, type ${imageType}:`, err);
        
        if (mounted) {
          // Fallback to static URL if available
          let fallbackUrl: string;
          if (fallbackPath) {
            fallbackUrl = apiService.getImageUrl(fallbackPath);
          } else {
            // Try to construct a likely static URL
            const likelyPath = `images/${detectionId}/${imageType}_*.jpg`;
            fallbackUrl = apiService.getImageUrl(likelyPath);
          }
          setImageUrl(fallbackUrl);
          setLoading(false);
          // Cache fallback URL too
          imageCache.set(cacheKey, fallbackUrl);
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, [detectionId, imageType]);

  const handleImageError = () => {
    if (retryCount < maxRetries) {
      // Retry with a delay
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 1000);
    } else {
      // Final fallback - show placeholder
      setError('Image could not be loaded');
      if (onError) {
        onError(new Error('Image could not be loaded after retries'));
      }
    }
  };

  const generatePlaceholder = () => {
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="#9a9a9a" text-anchor="middle" dy=".3em">
          ${placeholderText}
        </text>
      </svg>
    `)}`;
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="flex flex-col items-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-500">Loading image...</span>
        </div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center p-4">
          <div className="text-2xl mb-2">📷</div>
          <div className="text-sm text-gray-500">{placeholderText}</div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onError={handleImageError}
      loading="lazy"
    />
  );
};

export default DetectionImage;