import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { Button } from '@/components/ui/button';
import { RotateCw, Check, X, ZoomIn, ZoomOut, Move } from 'lucide-react';

const ProfessionalImageCropper = ({ imageSrc, onCancel, onSave, initialAspectRatio = null }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [fabricCanvas, setFabricCanvas] = useState(null);
    const [cropRect, setCropRect] = useState(null);
    const [imageObj, setImageObj] = useState(null);
    const [isImageLoading, setIsImageLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    // Initialize Canvas
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width: containerWidth,
            height: containerHeight,
            backgroundColor: '#1a1a1a', // Dark background for professional feel
            selection: false, // Disable group selection
        });

        // Add Mouse Wheel Zoom
        canvas.on('mouse:wheel', function (opt) {
            const delta = opt.e.deltaY;
            let zoom = canvas.getZoom();
            zoom *= 0.999 ** delta;
            if (zoom > 20) zoom = 20;
            if (zoom < 0.01) zoom = 0.01;
            canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
            opt.e.preventDefault();
            opt.e.stopPropagation();
        });

        setFabricCanvas(canvas);

        const handleResize = () => {
            if (containerRef.current) {
                canvas.setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            canvas.dispose();
        };
    }, []);

    // Load Image and Setup Crop Box
    useEffect(() => {
        if (!fabricCanvas || !imageSrc) return;

        setIsImageLoading(true);
        setLoadError(null);

        fabric.Image.fromURL(imageSrc, (img) => {
            if (!img) {
                setLoadError('Failed to load image');
                setIsImageLoading(false);
                return;
            }

            // Calculate scale to fit image in canvas with padding
            const padding = 40;
            const canvasWidth = fabricCanvas.getWidth();
            const canvasHeight = fabricCanvas.getHeight();

            const scaleX = (canvasWidth - padding * 2) / img.width;
            const scaleY = (canvasHeight - padding * 2) / img.height;
            const scale = Math.min(scaleX, scaleY, 1); // Don't scale up if smaller

            img.set({
                scaleX: scale,
                scaleY: scale,
                left: canvasWidth / 2,
                top: canvasHeight / 2,
                originX: 'center',
                originY: 'center',
                selectable: true, // Allow user to move/rotate image
                hasControls: true,
                hasBorders: true,
                lockUniScaling: true,
            });

            fabricCanvas.add(img);
            fabricCanvas.setActiveObject(img);
            setImageObj(img);

            // Create Crop Rect
            let cropWidth, cropHeight;

            if (initialAspectRatio) {
                // Determine size based on aspect ratio
                // Try to fit within 50% of canvas
                if (initialAspectRatio > 1) {
                    cropWidth = canvasWidth * 0.5;
                    cropHeight = cropWidth / initialAspectRatio;
                } else {
                    cropHeight = canvasHeight * 0.5;
                    cropWidth = cropHeight * initialAspectRatio;
                }
            } else {
                cropWidth = img.getScaledWidth() * 0.8;
                cropHeight = img.getScaledHeight() * 0.8;
            }

            const rect = new fabric.Rect({
                left: canvasWidth / 2,
                top: canvasHeight / 2,
                originX: 'center',
                originY: 'center',
                width: cropWidth,
                height: cropHeight,
                fill: 'transparent',
                stroke: '#fff',
                strokeWidth: 2,
                strokeDashArray: [5, 5],
                cornerColor: 'white',
                cornerStrokeColor: 'gray',
                cornerSize: 12,
                transparentCorners: false,
                hasRotatingPoint: false, // Crop box usually doesn't rotate
                lockRotation: true,
                lockUniScaling: !!initialAspectRatio, // Lock aspect ratio if provided
                selectable: true,
                evented: true,
            });

            fabricCanvas.add(rect);
            setCropRect(rect);
            fabricCanvas.renderAll();

            // Bring crop box to front
            rect.bringToFront();

            // Image loaded successfully
            setIsImageLoading(false);

        }, { crossOrigin: 'anonymous' });
    }, [fabricCanvas, imageSrc, initialAspectRatio]);

    // Handle Cropping
    const handleCrop = () => {
        if (!fabricCanvas || !cropRect) return;

        const rect = cropRect.getBoundingRect();

        const dataUrl = fabricCanvas.toDataURL({
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            format: 'png',
            multiplier: 2,
        });

        onSave(dataUrl);
    };

    // Helper functions for controls
    const rotateImage = (angle) => {
        if (imageObj) {
            imageObj.rotate((imageObj.angle || 0) + angle);
            fabricCanvas.requestRenderAll();
        }
    };

    const zoom = (factor) => {
        if (fabricCanvas) {
            // Smoother zoom steps
            const newZoom = fabricCanvas.getZoom() * factor;
            fabricCanvas.setZoom(newZoom);
            fabricCanvas.requestRenderAll();
        }
    }

    return (
        <div className="flex flex-col h-full w-full bg-background text-foreground">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between p-2 sm:p-4 border-b bg-card gap-2">
                <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto">
                    <Button variant="ghost" size="sm" onClick={() => rotateImage(-90)} className="h-8 px-2 text-xs sm:text-sm">
                        <RotateCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 -scale-x-100" /> <span className="hidden sm:inline">Rotate Left</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => rotateImage(90)} className="h-8 px-2 text-xs sm:text-sm">
                        <RotateCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> <span className="hidden sm:inline">Rotate Right</span>
                    </Button>
                    <div className="h-4 w-px bg-border mx-1 sm:mx-2" />
                    <Button variant="ghost" size="icon" onClick={() => zoom(1.05)} className="h-8 w-8">
                        <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => zoom(0.95)} className="h-8 w-8">
                        <ZoomOut className="w-4 h-4" />
                    </Button>
                </div>
                <div className="flex items-center space-x-2 ml-auto">
                    <Button variant="outline" size="sm" onClick={onCancel} className="h-8 px-2 text-xs sm:text-sm">
                        <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Cancel
                    </Button>
                    <Button size="sm" onClick={handleCrop} className="h-8 px-2 text-xs sm:text-sm">
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Crop <span className="hidden sm:inline">& Save</span>
                    </Button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative bg-[#1a1a1a] overflow-hidden touch-none" ref={containerRef}>
                <canvas ref={canvasRef} />

                {/* Loading Overlay */}
                {isImageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]/80 backdrop-blur-sm z-50">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                            <p className="text-white text-sm sm:text-base font-medium">Loading image...</p>
                            <p className="text-white/60 text-xs sm:text-sm">Please wait while we prepare your image</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {loadError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]/90 z-50">
                        <div className="flex flex-col items-center gap-4 max-w-md mx-4">
                            <div className="text-red-500 text-4xl">⚠️</div>
                            <p className="text-white text-sm sm:text-base font-medium text-center">{loadError}</p>
                            <p className="text-white/60 text-xs sm:text-sm text-center">Please close and try again with a different image</p>
                        </div>
                    </div>
                )}

                {/* Help Text - Only show when image is loaded */}
                {!isImageLoading && !loadError && (
                    <div className="absolute top-4 left-0 right-0 text-center pointer-events-none">
                        <span className="bg-black/50 text-white text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-1 rounded-full">
                            Drag/Resize Box or Scroll/Pinch to Zoom
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfessionalImageCropper;
