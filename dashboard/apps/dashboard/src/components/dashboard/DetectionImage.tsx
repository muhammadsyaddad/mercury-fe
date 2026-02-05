"use client";

import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { cn } from "@vision_dashboard/ui/cn";
import { Spinner } from "@vision_dashboard/ui/spinner";

interface DetectionImageProps {
  detectionId: number;
  imageType:
    | "food_1"
    | "food_2"
    | "initial_ocr"
    | "initial_ocr_2"
    | "final_ocr"
    | "final_ocr_2";
  fallbackPath?: string;
  alt: string;
  className?: string;
  onError?: (error: Error) => void;
  placeholderText?: string;
}

// Global cache for successful image loads
const imageCache = new Map<string, string>();

export function DetectionImage({
  detectionId,
  imageType,
  fallbackPath,
  alt,
  className = "",
  onError,
  placeholderText = "Image not available",
}: DetectionImageProps) {
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  // Initialize from cache immediately
  const cacheKey = `${detectionId}-${imageType}`;
  const cachedUrl = imageCache.get(cacheKey);

  const [imageUrl, setImageUrl] = useState<string | null>(cachedUrl || null);
  const [loading, setLoading] = useState(!cachedUrl);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const nextCachedUrl = imageCache.get(cacheKey) || null;
    setImageUrl(nextCachedUrl);
    setLoading(!nextCachedUrl);
    setError(null);
    setRetryCount(0);
  }, [cacheKey]);

  useEffect(() => {
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
        console.warn(
          `Failed to get GCS URL for detection ${detectionId}, type ${imageType}:`,
          err
        );

        if (mounted) {
          if (fallbackPath) {
            const fallbackUrl = apiService.getImageUrl(fallbackPath);
            setImageUrl(fallbackUrl);
            setLoading(false);
            imageCache.set(cacheKey, fallbackUrl);
          } else {
            setImageUrl(null);
            setError("Image URL not available");
            setLoading(false);
          }
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, [detectionId, imageType, cacheKey, fallbackPath, retryCount]);

  const handleImageError = () => {
    if (retryCount < maxRetries) {
      // Retry with a delay
      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
      }, 1000);
    } else {
      // Final fallback - show placeholder
      setError("Image could not be loaded");
      if (onError) {
        onError(new Error("Image could not be loaded after retries"));
      }
    }
  };

  if (loading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted",
          className
        )}
      >
        <div className="flex flex-col items-center space-y-2">
          <Spinner className="h-8 w-8" />
          <span className="text-sm text-muted-foreground">Loading image...</span>
        </div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted",
          className
        )}
      >
        <div className="text-center p-4">
          <div className="text-2xl mb-2">📷</div>
          <div className="text-sm text-muted-foreground">{placeholderText}</div>
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
}

export default DetectionImage;
