import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileImage, FileText, Loader2 } from 'lucide-react';
import PhotoSheetCanvas from './PhotoSheetCanvas';

const ResultView = ({
    photos,
    numberOfCopies,
    onSheetUpdate,
    onReset,
    onDownload,
    isProcessing,
    sheetDataUrl,
    imagePositions,
    setImagePositions
}) => {
    return (
        <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="text-lg font-semibold text-center mb-4">Preview & Arrange Your A4 Photo Sheet</h3>
            <div className="mb-6 p-4 bg-muted/40 rounded-lg">
                <PhotoSheetCanvas
                    photos={photos}
                    numberOfCopies={numberOfCopies}
                    onSheetUpdate={onSheetUpdate}
                    isVisible={true}
                    imagePositions={imagePositions}
                    setImagePositions={setImagePositions}
                />
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <Button onClick={onReset} variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Start Over</Button>
                <Button onClick={() => onDownload('jpeg')} disabled={isProcessing || !sheetDataUrl}><FileImage className="mr-2 h-4 w-4" /> Download JPEG</Button>
                <Button onClick={() => onDownload('pdf')} disabled={isProcessing || !sheetDataUrl}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {!isProcessing && <FileText className="mr-2 h-4 w-4" />}
                    Download PDF
                </Button>
            </div>
        </motion.div>
    );
};

export default ResultView;