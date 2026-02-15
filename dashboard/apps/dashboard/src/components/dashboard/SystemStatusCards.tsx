import { Card, CardContent, CardHeader, CardTitle } from "@vision_dashboard/ui/card";
import { Badge } from "@vision_dashboard/ui/badge";
import { ScrollArea } from "@vision_dashboard/ui/scroll-area";
import { Camera as CameraIcon, Activity } from "lucide-react";
import type { Camera } from "@/types";

interface SystemStatusCardProps {
  activeCameraCount: number;
  totalCameraCount: number;
  todayDetectionCount: number;
}

export function SystemStatusCard({
  activeCameraCount,
  totalCameraCount,
  todayDetectionCount,
}: SystemStatusCardProps) {
  return (
    <Card className="border-teal-200/40 dark:border-teal-800/30">
      <CardHeader className="bg-gradient-to-r from-teal-50/60 to-emerald-50/40 dark:from-teal-950/20 dark:to-emerald-950/10 rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-7 h-7 bg-teal-100 dark:bg-teal-900/40 rounded-lg flex items-center justify-center">
              <Activity className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            </div>
            System Status
          </CardTitle>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Active Cameras</span>
            <span className="font-semibold text-green-600">
              {activeCameraCount}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Cameras</span>
            <span className="font-semibold">{totalCameraCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Today's Detections</span>
            <span className="font-semibold text-blue-600">{todayDetectionCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CameraStatusCardProps {
  cameras: Camera[];
  cameraStatuses: Record<string, { status: string }>;
}

export function CameraStatusCard({
  cameras,
  cameraStatuses,
}: CameraStatusCardProps) {
  return (
    <Card className="border-sky-200/40 dark:border-sky-800/30">
      <CardHeader className="bg-gradient-to-r from-sky-50/60 to-cyan-50/40 dark:from-sky-950/20 dark:to-cyan-950/10 rounded-t-lg">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="w-7 h-7 bg-sky-100 dark:bg-sky-900/40 rounded-lg flex items-center justify-center">
            <CameraIcon className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
          </div>
          Camera Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-40">
          <div className="space-y-2 pr-4">
            {cameras.slice(0, 5).map((camera) => {
              const status = cameraStatuses[camera.id] || { status: "inactive" };
              return (
                <div
                  key={camera.id}
                  className="flex items-center justify-between p-2 bg-sky-50/40 dark:bg-sky-950/10 rounded-lg border border-sky-100/40 dark:border-sky-900/20"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                      <CameraIcon className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-xs">{camera.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {camera.location || "No location"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={status.status === "active" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {status.status.toUpperCase()}
                  </Badge>
                </div>
              );
            })}
            {cameras.length > 5 && (
              <div className="text-center text-xs text-muted-foreground mt-1">
                +{cameras.length - 5} more cameras
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
