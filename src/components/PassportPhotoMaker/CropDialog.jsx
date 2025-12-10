import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ProfessionalImageCropper from '@/components/common/ProfessionalImageCropper';

const CropDialog = ({
    isOpen,
    onClose,
    photo,
    onFinishCropping,
    aspect,
}) => {
    if (!isOpen || !photo) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-none w-[98vw] h-[95vh] !top-[2vh] !translate-y-0 p-0 overflow-hidden flex flex-col bg-background border-none gap-0">
                <ProfessionalImageCropper
                    imageSrc={photo.source}
                    onCancel={onClose}
                    onSave={onFinishCropping}
                    initialAspectRatio={aspect}
                />
            </DialogContent>
        </Dialog>
    );
};

export default CropDialog;