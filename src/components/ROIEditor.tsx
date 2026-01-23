import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Transformer, Image as KonvaImage } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { toast } from 'react-hot-toast';
import { Camera, ROIConfig } from '../types';
import { apiService } from '../services/api';

interface ROIEditorProps {
  camera: Camera;
  onSave: (roiConfig: ROIConfig[]) => void;
  onCancel: () => void;
}

interface ROIRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  enabled: boolean;
  type: 'motion' | 'food' | 'ocr';
}

const ROIEditor: React.FC<ROIEditorProps> = ({ camera, onSave, onCancel }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [rois, setRois] = useState<ROIRect[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [responsiveStageSize, setResponsiveStageSize] = useState({ width: 800, height: 600 });
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [selectedROIType, setSelectedROIType] = useState<'motion' | 'food' | 'ocr'>('motion');
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const imageRef = useRef<any>(null);

  useEffect(() => {
    loadCameraPreview();
    updateResponsiveSize();
    window.addEventListener('resize', updateResponsiveSize);
    return () => window.removeEventListener('resize', updateResponsiveSize);
  }, [camera]);

  useEffect(() => {
    updateResponsiveSize();
  }, [stageSize]);

  useEffect(() => {
    // Load existing ROI after image and responsive size are available
    if (image && responsiveStageSize.width > 0 && responsiveStageSize.height > 0) {
      loadExistingROI();
    }
  }, [image, responsiveStageSize, camera]);

  const updateResponsiveSize = () => {
    const maxWidth = Math.min(800, window.innerWidth - 120);
    const maxHeight = Math.min(600, window.innerHeight - 400);
    
    const aspectRatio = stageSize.width / stageSize.height;
    let width = Math.min(maxWidth, stageSize.width);
    let height = width / aspectRatio;
    
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
    
    setResponsiveStageSize({ width, height });
  };

  useEffect(() => {
    if (selectedId) {
      const transformer = transformerRef.current;
      const stage = stageRef.current;
      const selectedNode = stage.findOne(`#${selectedId}`);
      
      if (selectedNode && transformer) {
        transformer.nodes([selectedNode]);
        transformer.getLayer().batchDraw();
      }
    }
  }, [selectedId]);

  const loadCameraPreview = async () => {
    try {
      // For demo purposes, we'll use a placeholder image
      // In production, you'd get a live frame from the camera
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setImage(img);
        // Adjust stage size to fit image while maintaining aspect ratio
        const aspectRatio = img.width / img.height;
        const maxWidth = 800;
        const maxHeight = 600;
        
        let width = maxWidth;
        let height = maxWidth / aspectRatio;
        
        if (height > maxHeight) {
          height = maxHeight;
          width = maxHeight * aspectRatio;
        }
        
        setStageSize({ width, height });
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
          <rect width="800" height="600" fill="#f0f0f0"/>
          <text x="400" y="300" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#666666">
            Camera Preview
          </text>
        </svg>
      `);
    } catch (error) {
      toast.error('Failed to load camera preview');
    }
  };

  const captureScreenshot = async () => {
    setIsCapturingScreenshot(true);
    try {
      const screenshotUrl = await apiService.captureScreenshot(camera.id);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setImage(img);
        // Adjust stage size to fit image while maintaining aspect ratio
        const aspectRatio = img.width / img.height;
        const maxWidth = 800;
        const maxHeight = 600;
        
        let width = maxWidth;
        let height = maxWidth / aspectRatio;
        
        if (height > maxHeight) {
          height = maxHeight;
          width = maxHeight * aspectRatio;
        }
        
        setStageSize({ width, height });
      };
      img.src = screenshotUrl;
      toast.success('Screenshot captured successfully');
    } catch (error) {
      toast.error('Failed to capture screenshot. Make sure the camera is active.');
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  const loadExistingROI = () => {
    if (camera.roi_config && image) {
      try {
        const existingRois = Array.isArray(camera.roi_config) 
          ? camera.roi_config 
          : [camera.roi_config];
        
        // Calculate scale factors to convert from original image coordinates to canvas coordinates
        const scaleX = responsiveStageSize.width / image.width;
        const scaleY = responsiveStageSize.height / image.height;
        
        const roiRects = existingRois.map((roi, index) => ({
          id: `roi-${index}`,
          x: roi.x * scaleX,
          y: roi.y * scaleY,
          width: roi.width * scaleX,
          height: roi.height * scaleY,
          enabled: roi.enabled !== false,
          type: roi.type || 'motion'
        }));
        
        setRois(roiRects);
      } catch (error) {
        console.error('Failed to load existing ROI:', error);
      }
    }
  };

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      setSelectedId(null);
    }

    const pos = e.target.getStage()?.getPointerPosition();
    if (pos && !selectedId) {
      setIsDrawing(true);
      setDrawingStart(pos);
    }
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || !drawingStart) return;

    const pos = e.target.getStage()?.getPointerPosition();
    if (pos) {
      const tempRoi = {
        id: 'temp',
        x: Math.min(drawingStart.x, pos.x),
        y: Math.min(drawingStart.y, pos.y),
        width: Math.abs(pos.x - drawingStart.x),
        height: Math.abs(pos.y - drawingStart.y),
        enabled: true,
        type: selectedROIType
      };

      setRois(prev => prev.filter(roi => roi.id !== 'temp').concat(tempRoi));
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && drawingStart) {
      const tempRoi = rois.find(roi => roi.id === 'temp');
      if (tempRoi && tempRoi.width > 10 && tempRoi.height > 10) {
        const newRoi = {
          ...tempRoi,
          id: `roi-${Date.now()}-${selectedROIType}`
        };
        setRois(prev => prev.filter(roi => roi.id !== 'temp').concat(newRoi));
      } else {
        setRois(prev => prev.filter(roi => roi.id !== 'temp'));
      }
    }
    setIsDrawing(false);
    setDrawingStart(null);
  };

  const handleRectSelect = (id: string) => {
    setSelectedId(id);
  };

  const handleTransformEnd = (e: KonvaEventObject<Event>) => {
    const node = e.target;
    const id = node.id();
    
    setRois(prev => prev.map(roi => 
      roi.id === id 
        ? {
            ...roi,
            x: node.x(),
            y: node.y(),
            width: node.width() * node.scaleX(),
            height: node.height() * node.scaleY()
          }
        : roi
    ));

    // Reset scale after transform
    node.scaleX(1);
    node.scaleY(1);
  };

  const deleteSelectedROI = () => {
    if (selectedId) {
      setRois(prev => prev.filter(roi => roi.id !== selectedId));
      setSelectedId(null);
    }
  };

  const toggleROIEnabled = (id: string) => {
    setRois(prev => prev.map(roi => 
      roi.id === id ? { ...roi, enabled: !roi.enabled } : roi
    ));
  };

  const clearAllROIs = () => {
    setRois([]);
    setSelectedId(null);
  };

  const captureCanvasImage = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const stage = stageRef.current;
      if (!stage) {
        reject(new Error('Stage not available'));
        return;
      }

      try {
        const dataURL = stage.toDataURL({ pixelRatio: 1 });
        fetch(dataURL)
          .then(res => res.blob())
          .then(blob => resolve(blob))
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  };

  const handleSave = async () => {
    try {
      // Calculate scale factors to convert from canvas coordinates to original image coordinates
      const scaleX = image ? image.width / responsiveStageSize.width : 1;
      const scaleY = image ? image.height / responsiveStageSize.height : 1;
      
      const roiConfigs = rois.map(roi => ({
        x: Math.round(roi.x * scaleX),
        y: Math.round(roi.y * scaleY),
        width: Math.round(roi.width * scaleX),
        height: Math.round(roi.height * scaleY),
        enabled: roi.enabled,
        type: roi.type
      }));

      // Save ROI configuration
      await apiService.updateCameraROI(camera.id, roiConfigs);
      
      // Capture and save ROI image
      try {
        const imageBlob = await captureCanvasImage();
        await apiService.saveROIImage(camera.id, imageBlob);
        toast.success('ROI configuration and image saved successfully');
      } catch (imageError) {
        console.warn('Failed to save ROI image:', imageError);
        toast.success('ROI configuration saved successfully (image save failed)');
      }
      
      onSave(roiConfigs);
    } catch (error) {
      toast.error('Failed to save ROI configuration');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-3 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">ROI Editor - {camera.name}</h2>
              <p className="text-sm sm:text-base text-gray-600 hidden sm:block">Draw rectangles to define regions of interest for motion detection</p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-6 flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Canvas Area */}
          <div className="flex-1 lg:mr-6 mb-4 lg:mb-0">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 sm:p-4 bg-gray-50">
              <div className="overflow-auto">
                <Stage
                  ref={stageRef}
                  width={responsiveStageSize.width}
                  height={responsiveStageSize.height}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  style={{ background: '#f9fafb' }}
                >
                <Layer>
                  {image && (
                    <KonvaImage
                      ref={imageRef}
                      image={image}
                      width={responsiveStageSize.width}
                      height={responsiveStageSize.height}
                    />
                  )}
                  
                  {rois.map((roi) => {
                    const getROIColors = (type: string, enabled: boolean) => {
                      if (!enabled) return { fill: "rgba(156, 163, 175, 0.3)", stroke: "#9ca3af" };
                      
                      switch (type) {
                        case 'motion':
                          return { fill: "rgba(59, 130, 246, 0.3)", stroke: "#3b82f6" }; // Blue
                        case 'food':
                          return { fill: "rgba(34, 197, 94, 0.3)", stroke: "#22c55e" }; // Green
                        case 'ocr':
                          return { fill: "rgba(239, 68, 68, 0.3)", stroke: "#ef4444" }; // Red
                        default:
                          return { fill: "rgba(59, 130, 246, 0.3)", stroke: "#3b82f6" };
                      }
                    };
                    
                    const colors = getROIColors(roi.type, roi.enabled);
                    
                    return (
                      <Rect
                        key={roi.id}
                        id={roi.id}
                        x={roi.x}
                        y={roi.y}
                        width={roi.width}
                        height={roi.height}
                        fill={colors.fill}
                        stroke={colors.stroke}
                        strokeWidth={2}
                        onClick={() => handleRectSelect(roi.id)}
                        onTransformEnd={handleTransformEnd}
                        onDragEnd={(e) => {
                          const node = e.target;
                          const id = node.id();
                          setRois(prev => prev.map(r => 
                            r.id === id ? { ...r, x: node.x(), y: node.y() } : r
                          ));
                        }}
                        draggable
                      />
                    );
                  })}
                  
                  <Transformer
                    ref={transformerRef}
                    boundBoxFunc={(oldBox, newBox) => {
                      // Limit resize
                      if (newBox.width < 5 || newBox.height < 5) {
                        return oldBox;
                      }
                      return newBox;
                    }}
                  />
                </Layer>
                </Stage>
              </div>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="w-full lg:w-80 bg-gray-50 rounded-lg p-3 sm:p-4 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4">Controls</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <button
                  onClick={captureScreenshot}
                  disabled={isCapturingScreenshot}
                  className="w-full btn btn-primary disabled:opacity-50"
                >
                  {isCapturingScreenshot ? 'Capturing...' : 'Capture Screenshot'}
                </button>
                <div className="text-xs text-gray-500 text-center">
                  Camera must be active to capture screenshots
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">ROI Type</h4>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedROIType('motion')}
                      className={`flex-1 px-3 py-2 text-sm rounded ${
                        selectedROIType === 'motion'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      🔵 Motion
                    </button>
                    <button
                      onClick={() => setSelectedROIType('food')}
                      className={`flex-1 px-3 py-2 text-sm rounded ${
                        selectedROIType === 'food'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      🟢 Food
                    </button>
                    <button
                      onClick={() => setSelectedROIType('ocr')}
                      className={`flex-1 px-3 py-2 text-sm rounded ${
                        selectedROIType === 'ocr'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      🔴 OCR
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    Selected: <strong>{selectedROIType.toUpperCase()}</strong> - Draw new ROI rectangles of this type
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="text-sm text-gray-600">
                  <p className="mb-2">Instructions:</p>
                  <ul className="space-y-1">
                    <li>• Select ROI type above</li>
                    <li>• Click and drag to create ROI</li>
                    <li>• Click on ROI to select</li>
                    <li>• Drag corners to resize</li>
                    <li>• Drag center to move</li>
                  </ul>
                  <div className="mt-3 p-2 bg-yellow-50 rounded text-xs">
                    <p className="font-medium">ROI Types:</p>
                    <p>🔵 <strong>Motion</strong>: Detects food movement</p>
                    <p>🟢 <strong>Food</strong>: Crops for AI classification</p>
                    <p>🔴 <strong>OCR</strong>: Reads weight from scale</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">ROI List ({rois.length})</h4>
                <div className="space-y-2 max-h-32 sm:max-h-48 overflow-y-auto">
                  {rois.map((roi, index) => {
                    const getTypeIcon = (type: string) => {
                      switch (type) {
                        case 'motion': return '🔵';
                        case 'food': return '🟢';
                        case 'ocr': return '🔴';
                        default: return '⚫';
                      }
                    };
                    
                    return (
                      <div
                        key={roi.id}
                        className={`p-2 rounded border ${
                          selectedId === roi.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {getTypeIcon(roi.type)} {roi.type.toUpperCase()} {index + 1}
                          </span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleROIEnabled(roi.id)}
                              className={`w-4 h-4 rounded ${
                                roi.enabled ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                              title={roi.enabled ? 'Disable' : 'Enable'}
                            />
                            <button
                              onClick={() => setSelectedId(roi.id)}
                              className="text-blue-500 hover:text-blue-700"
                              title="Select"
                            >
                              📍
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {Math.round(roi.x)}, {Math.round(roi.y)} - {Math.round(roi.width)}x{Math.round(roi.height)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <button
                  onClick={deleteSelectedROI}
                  disabled={!selectedId}
                  className="w-full btn btn-danger disabled:opacity-50"
                >
                  Delete Selected
                </button>
                <button
                  onClick={clearAllROIs}
                  className="w-full btn btn-secondary"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 flex-shrink-0">
          <button
            onClick={onCancel}
            className="btn btn-ghost w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary w-full sm:w-auto order-1 sm:order-2"
          >
            Save ROI Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default ROIEditor;