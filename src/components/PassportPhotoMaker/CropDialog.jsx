import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import Cropper from 'react-easy-crop';

const CropDialog = ({
    isOpen,
    onClose,
    photo,
    crop,
    setCrop,
    zoom,
    setZoom,
    rotation,
    setRotation,
    onCropComplete,
    onFinishCropping,
    aspect,
    initialCrop
}) => {
    if (!isOpen || !photo) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-[95vw] h-[80vh] flex flex-col p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle>Crop Your Photo</DialogTitle>
                </DialogHeader>
                <div className="relative flex-1 my-4 bg-muted rounded-md">
                    <Cropper
                        image={photo.source}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={aspect}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onRotationChange={setRotation}
                        onCropComplete={onCropComplete}
                        showGrid={true}
                        cropShape="rect"
                        objectFit="contain"
                        initialCroppedAreaPixels={initialCrop}
                    />
                </div>
                <div className="flex flex-col gap-4">
                    <div>
                        <Label>Zoom</Label>
                        <Slider value={[zoom]} min={1} max={10} step={0.1} onValueChange={(val) => setZoom(val[0])} />
                    </div>
                    <div>
                        <Label>Rotation</Label>
                        <Slider value={[rotation]} min={0} max={360} step={1} onValueChange={(val) => setRotation(val[0])} />
                    </div>
                </div>
                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={onFinishCropping}>Crop & Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CropDialog;