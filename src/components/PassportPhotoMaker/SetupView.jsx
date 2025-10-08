import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Scissors, PlusCircle, Trash2 } from 'lucide-react';

const SetupView = ({
    photos,
    numberOfCopies,
    setNumberOfCopies,
    onImageUpload,
    onStartCropping,
    onRemovePhoto,
    onGenerateSheet,
    fileInputRef
}) => {
    return (
        <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Uploaded Photos</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <AnimatePresence>
                        {photos.map(photo => (
                            <motion.div layout key={photo.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="relative group">
                                <div className="aspect-[3.5/4.5] bg-muted rounded-md overflow-hidden border-2 border-transparent data-[cropped=false]:border-amber-500" data-cropped={!!photo.cropped}>
                                    <img src={photo.cropped || photo.source} alt="Uploaded" className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={() => onStartCropping(photo)}><Scissors className="h-4 w-4 mr-1" /> Crop</Button>
                                    <Button size="sm" variant="ghost" className="text-red-400 hover:bg-white/20" onClick={() => onRemovePhoto(photo.id)}><Trash2 className="h-4 w-4 mr-1" /> Remove</Button>
                                </div>
                                {!photo.cropped && <div className="absolute top-1 right-1 text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded-full">Needs Crop</div>}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-[3.5/4.5] border-2 border-dashed border-border rounded-md flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-accent hover:border-primary transition-colors"
                    >
                        <PlusCircle className="h-8 w-8 mb-1" />
                        <span className="text-sm text-center">Add Photo</span>
                    </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={onImageUpload} accept="image/jpeg,image/png" multiple className="hidden" />
            </div>

            <div className="my-6">
                <Label htmlFor="copies">Number of copies per photo</Label>
                <Input
                    id="copies"
                    type="number"
                    value={numberOfCopies}
                    onChange={(e) => setNumberOfCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-32 mt-1"
                    min="1"
                />
            </div>

            <div className="text-center mt-8">
                <Button onClick={onGenerateSheet} disabled={photos.length === 0 || photos.some(p => !p.cropped)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Photo Sheet
                </Button>
                {photos.length > 0 && photos.some(p => !p.cropped) && <p className="text-sm text-amber-600 mt-2">Some photos need to be cropped before generating the sheet.</p>}
            </div>
        </motion.div>
    );
};

export default SetupView;