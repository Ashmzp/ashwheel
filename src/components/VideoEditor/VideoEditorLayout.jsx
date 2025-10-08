import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Sidebar from '@/components/VideoEditor/Sidebar';
import MediaLibrary from '@/components/VideoEditor/MediaLibrary';
import Preview from '@/components/VideoEditor/Preview';
import Timeline from '@/components/VideoEditor/Timeline';
import { Button } from '@/components/ui/button';
import { Film, Share, Play, Pause, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useVideoEditorStore } from '@/stores/videoEditStore';
import InspectorPanel from '@/components/VideoEditor/InspectorPanel';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import TextTool from '@/components/VideoEditor/tools/TextTool';
import EffectsTool from '@/components/VideoEditor/tools/EffectsTool';
import AudioTool from '@/components/VideoEditor/tools/AudioTool';
import TemplatesTool from '@/components/VideoEditor/tools/TemplatesTool';
import AiTools from '@/components/VideoEditor/tools/AiTools';
import { exportVideo } from '@/utils/videoExport';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

const VideoEditorLayout = () => {
  const { toast } = useToast();
  const { isPlaying, togglePlay, activeTab, setActiveTab, timeline, aspectRatio } = useVideoEditorStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    try {
      await exportVideo(timeline, aspectRatio, (progress) => {
        setExportProgress(progress * 100);
      });
      toast({
        title: "✅ Export Complete!",
        description: "Your video has been downloaded.",
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "❌ Export Failed",
        description: "Something went wrong during the export.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleSave = () => {
    toast({
      title: "🚧 Feature Coming Soon!",
      description: "Project saving is not yet implemented. Stay tuned! 🚀",
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
        <header className="flex items-center justify-between p-2 border-b bg-muted/40 z-10">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Film /> Video Editor
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={togglePlay}>
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Share className="mr-2 h-4 w-4" />
              )}
              Export
            </Button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          
          <div className="w-80 border-r bg-muted/40 flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsContent value="media" className="flex-1 overflow-y-auto p-0 m-0">
                <MediaLibrary />
              </TabsContent>
               <TabsContent value="ai" className="flex-1 overflow-y-auto p-4 m-0">
                <AiTools />
              </TabsContent>
              <TabsContent value="text" className="flex-1 overflow-y-auto p-4 m-0">
                <TextTool />
              </TabsContent>
              <TabsContent value="audio" className="flex-1 overflow-y-auto p-4 m-0">
                <AudioTool />
              </TabsContent>
              <TabsContent value="effects" className="flex-1 overflow-y-auto p-4 m-0">
                <EffectsTool />
              </TabsContent>
              <TabsContent value="templates" className="flex-1 overflow-y-auto p-4 m-0">
                <TemplatesTool />
              </TabsContent>
            </Tabs>
          </div>

          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-4 flex items-center justify-center bg-black/90 relative">
              <Preview />
            </div>
            <div className="h-[280px] bg-muted/40 border-t overflow-hidden">
              <Timeline />
            </div>
          </main>
          <InspectorPanel />
        </div>
      </div>
      <Dialog open={isExporting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exporting Video</DialogTitle>
            <DialogDescription>
              Please wait while your video is being rendered. This may take a few moments.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4">
            <Progress value={exportProgress} className="w-full" />
            <p className="text-center mt-2">{Math.round(exportProgress)}%</p>
          </div>
        </DialogContent>
      </Dialog>
    </DndProvider>
  );
};

export default VideoEditorLayout;