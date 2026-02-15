"use client";

import { Button } from "@vision_dashboard/ui/button";
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
import {
  ReviewStatus,
  FoodCategory,
  type Tray,
  type MenuItem,
} from "@/types";

export interface ReviewData {
  review_status: ReviewStatus;
  review_notes: string;
  corrected_category: FoodCategory;
  corrected_initial_weight: number;
  corrected_final_weight: number;
  corrected_description: string;
  corrected_tray_id: number | undefined;
}

interface ReviewFormProps {
  reviewData: ReviewData;
  onReviewDataChange: (data: ReviewData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  availableTrays: Tray[];
  loadingTrays: boolean;
  availableMenuItems: MenuItem[];
  loadingMenuItems: boolean;
}

function WeightInput({
  label,
  valueInGrams,
  onChange,
}: {
  label: string;
  valueInGrams: number;
  onChange: (grams: number) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        value={valueInGrams ? (valueInGrams / 1000).toFixed(2) : ""}
        onChange={(e) => {
          const value =
            e.target.value === "" ? 0 : Number.parseFloat(e.target.value);
          onChange(Number.isNaN(value) ? 0 : value * 1000);
        }}
      />
    </div>
  );
}

export function ReviewForm({
  reviewData,
  onReviewDataChange,
  onSubmit,
  onCancel,
  submitting,
  availableTrays,
  loadingTrays,
  availableMenuItems,
  loadingMenuItems,
}: ReviewFormProps) {
  const update = (partial: Partial<ReviewData>) =>
    onReviewDataChange({ ...reviewData, ...partial });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Status</Label>
          <Select
            value={reviewData.review_status}
            onValueChange={(value) =>
              update({ review_status: value as ReviewStatus })
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
              <SelectItem value={ReviewStatus.DETECTION_REJECTED}>
                Detection Rejected
              </SelectItem>
              <SelectItem value={ReviewStatus.REVISION_APPROVED}>
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
              update({ corrected_category: value as FoodCategory })
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
        <WeightInput
          label="Corrected Initial Weight (kg)"
          valueInGrams={reviewData.corrected_initial_weight}
          onChange={(grams) => update({ corrected_initial_weight: grams })}
        />
        <WeightInput
          label="Corrected Final Weight (kg)"
          valueInGrams={reviewData.corrected_final_weight}
          onChange={(grams) => update({ corrected_final_weight: grams })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Corrected Menu/Item</Label>
          <Select
            value={reviewData.corrected_description}
            onValueChange={(value) =>
              update({ corrected_description: value })
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
                  {item.category.toLowerCase().replace("_", " ")})
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
            value={reviewData.corrected_tray_id?.toString() || ""}
            onValueChange={(value) =>
              update({
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
              <SelectItem value="">No tray / Auto-detect</SelectItem>
              {availableTrays.map((tray) => (
                <SelectItem key={tray.id} value={tray.id.toString()}>
                  {tray.name} ({(tray.weight / 1000).toFixed(2)}kg)
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
          onChange={(e) => update({ review_notes: e.target.value })}
          rows={3}
          placeholder="Add any notes about this review..."
        />
      </div>

      <div className="flex space-x-2">
        <Button onClick={onSubmit} disabled={submitting} size="sm">
          {submitting ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Submitting...
            </>
          ) : (
            "Submit Review"
          )}
        </Button>
        <Button onClick={onCancel} variant="outline" size="sm">
          Cancel
        </Button>
      </div>
    </div>
  );
}
