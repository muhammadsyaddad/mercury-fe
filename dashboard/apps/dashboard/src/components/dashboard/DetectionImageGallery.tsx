"use client";

import Image from "next/image";
import { formatWeight } from "@/utils/weightUtils";

interface ScaleImageCardProps {
  label: string;
  colorScheme: "blue" | "green";
  imagePath?: string;
  weight: number | undefined;
  getImageUrl: (path?: string) => string;
}

const colorMap = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-600 dark:text-blue-400",
  },
  green: {
    bg: "bg-green-50 dark:bg-green-950/30",
    text: "text-green-600 dark:text-green-400",
  },
} as const;

function ScaleImageCard({
  label,
  colorScheme,
  imagePath,
  weight,
  getImageUrl,
}: ScaleImageCardProps) {
  const colors = colorMap[colorScheme];

  return (
    <div>
      <h4 className="text-sm font-medium mb-2">{label}</h4>
      <div
        className={`border rounded-lg overflow-hidden ${colors.bg} aspect-square relative`}
      >
        {imagePath ? (
          <Image
            src={getImageUrl(imagePath)}
            alt={`${label} OCR scale reading`}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = "none";
            }}
            width={200}
            height={200}
            sizes="(min-width: 1024px) 25vw, 50vw"
            unoptimized
          />
        ) : (
          <div
            className={`h-full flex flex-col items-center justify-center ${colors.text} p-2`}
          >
            <span className="text-2xl mb-1">&#x2696;&#xFE0F;</span>
            <span className="text-xs text-center">
              {colorScheme === "blue" ? "Initial" : "Final"} OCR
            </span>
            <span className="text-xs text-center text-muted-foreground">
              No image captured
            </span>
            <span className="font-bold text-sm">{formatWeight(weight)}</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white p-2 text-center">
          <span className="text-sm font-bold">{formatWeight(weight)}</span>
        </div>
      </div>
    </div>
  );
}

interface DetectionImageGalleryProps {
  imagePath: string;
  initialOcrPath?: string;
  finalOcrPath?: string;
  initialWeight: number | undefined;
  finalWeight: number | undefined;
  getImageUrl: (path?: string) => string;
}

export function DetectionImageGallery({
  imagePath,
  initialOcrPath,
  finalOcrPath,
  initialWeight,
  finalWeight,
  getImageUrl,
}: DetectionImageGalleryProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-3">Food Detection Image</h3>
        <div className="border-2 border-border rounded-lg overflow-hidden bg-muted">
          <Image
            src={getImageUrl(imagePath)}
            alt="Food detection"
            className="w-full h-64 object-cover hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.src =
                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzlhOWE5YSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+";
            }}
            width={400}
            height={256}
            sizes="(min-width: 1024px) 50vw, 100vw"
            unoptimized
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-3">Weight Scale Images</h3>
        <div className="grid grid-cols-2 gap-4">
          <ScaleImageCard
            label="Before (Initial)"
            colorScheme="blue"
            imagePath={initialOcrPath}
            weight={initialWeight}
            getImageUrl={getImageUrl}
          />
          <ScaleImageCard
            label="After (Final)"
            colorScheme="green"
            imagePath={finalOcrPath}
            weight={finalWeight}
            getImageUrl={getImageUrl}
          />
        </div>
      </div>
    </div>
  );
}
