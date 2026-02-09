"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@vision_dashboard/ui/card";
import { Button } from "@vision_dashboard/ui/button";
import { Badge } from "@vision_dashboard/ui/badge";
import { Input } from "@vision_dashboard/ui/input";
import { Label } from "@vision_dashboard/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@vision_dashboard/ui/select";
import { Switch } from "@vision_dashboard/ui/switch";
import { Skeleton } from "@vision_dashboard/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@vision_dashboard/ui/dialog";
import { cn } from "@vision_dashboard/ui/cn";
import {
  Plus,
  Camera as CameraIcon,
  Play,
  Square,
  RotateCcw,
  Target,
  Edit,
  Trash2,
  MapPin,
  Wifi,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { apiService } from "@/services/api";
import { trayService } from "@/services/trayService";
import { useAuth } from "@/contexts/AuthContext";
import type { Camera, Tray } from "@/types";
import { UserRole } from "@/types";
import { hasGroup } from "@/lib/helper";

interface CameraFormData {
  name: string;
  ip_address: string;
  port: number;
  username: string;
  password: string;
  rtsp_path: string;
  camera_type: string;
  location?: string;
  ocr_capture_delay: number;
  net_weight_calculation_method: "difference" | "subtract_tray";
  pixels_per_cm: number;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "active":
      return "default" as const;
    case "stopping":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
};

const getDefaultRTSPPath = (cameraType: string) => {
  const defaults: Record<string, string> = {
    hikvision: "/Streaming/Channels/101",
    dahua: "/cam/realmonitor?channel=1&subtype=0",
    axis: "/axis-media/media.amp",
    bosch: "/rtsp_tunnel",
    generic: "/stream",
  };
  return defaults[cameraType] || "/Streaming/Channels/101";
};

export default function CamerasPage() {
  const {data: session} = useSession()
  const queryClient = useQueryClient();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Camera | null>(null);

  const canManageCameras = hasGroup(session?.user?.groups ?? [], "engineer");
  console.log("Debug Condition:", {
      value: canManageCameras,
      type: typeof hasGroup,
      timestamp: new Date().toISOString(),
      isNotNull: canManageCameras !== null,
    });
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CameraFormData>({
    defaultValues: {
      camera_type: "hikvision",
      rtsp_path: "/Streaming/Channels/101",
      port: 554,
      ocr_capture_delay: 5,
      net_weight_calculation_method: "difference",
      pixels_per_cm: 37.8,
    },
  });

  // Fetch cameras
  const {
    data: cameras = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["cameras"],
    queryFn: () => apiService.getCameras(),
    staleTime: 30 * 1000,
  });

  // Fetch camera statuses
  const { data: cameraStatuses = {} } = useQuery({
    queryKey: ["cameraStatuses"],
    queryFn: () => apiService.getCameraStatuses(),
    refetchInterval: 10000,
    staleTime: 5 * 1000,
  });

  // Fetch trays
  const { data: trays = [] } = useQuery({
    queryKey: ["trays"],
    queryFn: () => trayService.getTrays(),
    staleTime: 5 * 60 * 1000,
  });

  const handleAddCamera = async (data: CameraFormData) => {
    try {
      await apiService.createCamera(data);
      toast.success("Camera added successfully");
      setShowAddModal(false);
      reset();
      refetch();
    } catch {
      toast.error("Failed to add camera");
    }
  };

  const handleEditCamera = async (data: CameraFormData) => {
    if (!editingCamera) return;

    try {
      await apiService.updateCamera(editingCamera.id, data);
      toast.success("Camera updated successfully");
      setEditingCamera(null);
      reset();
      refetch();
    } catch {
      toast.error("Failed to update camera");
    }
  };

  const handleDeleteCamera = async (camera: Camera) => {
    try {
      await apiService.deleteCamera(camera.id);
      toast.success("Camera deleted successfully");
      setShowDeleteModal(null);
      refetch();
    } catch {
      toast.error("Failed to delete camera");
    }
  };

  const handleStartMonitoring = async (cameraId: number) => {
    try {
      await apiService.startCameraMonitoring(cameraId);
      toast.success("Camera monitoring started");
      queryClient.invalidateQueries({ queryKey: ["cameraStatuses"] });
    } catch {
      toast.error("Failed to start monitoring");
    }
  };

  const handleStopMonitoring = async (cameraId: number) => {
    try {
      await apiService.stopCameraMonitoring(cameraId);
      toast.success("Camera monitoring stopped");
      queryClient.invalidateQueries({ queryKey: ["cameraStatuses"] });
    } catch {
      toast.error("Failed to stop monitoring");
    }
  };

  const handleRestartMonitoring = async (cameraId: number) => {
    try {
      await apiService.restartCameraMonitoring(cameraId);
      toast.success("Camera monitoring restarted");
      queryClient.invalidateQueries({ queryKey: ["cameraStatuses"] });
    } catch {
      toast.error("Failed to restart monitoring");
    }
  };

  const openEditModal = (camera: Camera) => {
    setEditingCamera(camera);
    setValue("name", camera.name);
    setValue("ip_address", camera.ip_address);
    setValue("port", camera.port);
    setValue("username", camera.username);
    setValue("password", camera.password);
    setValue("rtsp_path", camera.rtsp_path || "/Streaming/Channels/101");
    setValue("camera_type", camera.camera_type || "hikvision");
    setValue("location", camera.location || "");
    setValue("ocr_capture_delay", camera.ocr_capture_delay || 5);
    setValue("net_weight_calculation_method", camera.net_weight_calculation_method || "difference");
    setValue("pixels_per_cm", camera.pixels_per_cm || 37.8);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingCamera(null);
    reset();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Camera Management</h1>
              <p className="text-muted-foreground mt-1">Manage your IP cameras and monitoring</p>
            </div>
            {canManageCameras && (
              <Button onClick={() => setShowAddModal(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Camera
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cameras Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cameras.map((camera: Camera) => {
          const status = cameraStatuses[camera.id] || { status: "inactive" };
          return (
            <Card key={camera.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <CameraIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold">{camera.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Wifi className="h-3 w-3" />
                        {camera.ip_address}:{camera.port}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getStatusBadgeVariant(status.status)}>{status.status}</Badge>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Location:
                    </span>
                    <span className="font-medium">{camera.location || "Not set"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium capitalize">{camera.camera_type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium">{camera.is_active ? "Active" : "Inactive"}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {status.status === "active" ? (
                    <Button variant="destructive" size="sm" onClick={() => handleStopMonitoring(camera.id)} className="gap-1">
                      <Square className="h-3 w-3" />
                      Stop
                    </Button>
                  ) : (
                    <Button variant="default" size="sm" onClick={() => handleStartMonitoring(camera.id)} className="gap-1">
                      <Play className="h-3 w-3" />
                      Start
                    </Button>
                  )}

                  <Button variant="secondary" size="sm" onClick={() => handleRestartMonitoring(camera.id)} className="gap-1">
                    <RotateCcw className="h-3 w-3" />
                    Restart
                  </Button>

                  <Button variant="outline" size="sm" className="gap-1">
                    <Target className="h-3 w-3" />
                    ROI
                  </Button>

                  {canManageCameras && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => openEditModal(camera)} className="gap-1">
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setShowDeleteModal(camera)} className="gap-1">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {cameras.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CameraIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No cameras configured</h3>
            <p className="text-muted-foreground mb-4">Add your first camera to start monitoring</p>
            {canManageCameras && (
              <Button onClick={() => setShowAddModal(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Camera
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Camera Dialog */}
      <Dialog open={showAddModal || !!editingCamera} onOpenChange={() => closeModal()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCamera ? "Edit Camera" : "Add New Camera"}</DialogTitle>
            <DialogDescription>Configure your IP camera settings for monitoring.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(editingCamera ? handleEditCamera : handleAddCamera)} className="space-y-4">
            <div>
              <Label>Camera Name</Label>
              <Input {...register("name", { required: "Camera name is required" })} placeholder="Enter camera name" />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <Label>IP Address</Label>
              <Input {...register("ip_address", { required: "IP address is required" })} placeholder="192.168.1.100" />
              {errors.ip_address && <p className="text-sm text-red-500 mt-1">{errors.ip_address.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Port</Label>
                <Input
                  type="number"
                  {...register("port", { required: "Port is required", valueAsNumber: true })}
                  placeholder="554"
                />
              </div>
              <div>
                <Label>Camera Type</Label>
                <select
                  {...register("camera_type")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  onChange={(e) => setValue("rtsp_path", getDefaultRTSPPath(e.target.value))}
                >
                  <option value="hikvision">Hikvision</option>
                  <option value="dahua">Dahua</option>
                  <option value="axis">Axis</option>
                  <option value="bosch">Bosch</option>
                  <option value="generic">Generic</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Username</Label>
              <Input {...register("username", { required: "Username is required" })} placeholder="admin" />
            </div>

            <div>
              <Label>Password</Label>
              <Input type="password" {...register("password", { required: "Password is required" })} placeholder="Password" />
            </div>

            <div>
              <Label>RTSP Path</Label>
              <Input {...register("rtsp_path")} placeholder="/Streaming/Channels/101" />
            </div>

            <div>
              <Label>Location (Optional)</Label>
              <Input {...register("location")} placeholder="Kitchen, Office, etc." />
            </div>

            <div>
              <Label>OCR Capture Delay (seconds)</Label>
              <Input type="number" {...register("ocr_capture_delay", { valueAsNumber: true })} placeholder="5" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit">{editingCamera ? "Update" : "Add"} Camera</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteModal} onOpenChange={() => setShowDeleteModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Camera
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{showDeleteModal?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => showDeleteModal && handleDeleteCamera(showDeleteModal)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
