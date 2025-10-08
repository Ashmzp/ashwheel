import React from 'react';
import { useVideoEditorStore } from '@/stores/videoEditStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const InspectorPanel = () => {
  const { selectedTrackId, timeline, updateTrack, aspectRatio, setAspectRatio } = useVideoEditorStore();
  const selectedTrack = timeline.find(t => t.id === selectedTrackId);

  const handleUpdate = (key, value) => {
    if (selectedTrackId) {
      updateTrack(selectedTrackId, { [key]: value });
    }
  };

  const renderTrackProperties = () => {
    if (!selectedTrack) return <p className="text-sm text-muted-foreground">Select a clip on the timeline to see its properties.</p>;

    switch (selectedTrack.type) {
      case 'video':
      case 'audio':
        return (
          <>
            <div className="space-y-2">
              <Label>Speed ({selectedTrack.speed?.toFixed(1) || '1.0'}x)</Label>
              <Slider
                value={[selectedTrack.speed || 1]}
                min={0.1}
                max={4}
                step={0.1}
                onValueChange={(val) => handleUpdate('speed', val[0])}
              />
            </div>
            <div className="space-y-2">
              <Label>Volume ({Math.round((selectedTrack.volume ?? 1) * 100)}%)</Label>
              <Slider
                value={[selectedTrack.volume ?? 1]}
                min={0}
                max={2}
                step={0.05}
                onValueChange={(val) => handleUpdate('volume', val[0])}
              />
            </div>
          </>
        );
      case 'text':
        return (
          <>
            <div className="space-y-2">
              <Label>Text Content</Label>
              <Input
                value={selectedTrack.text || ''}
                onChange={(e) => handleUpdate('text', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Font Size</Label>
              <Input
                type="number"
                value={selectedTrack.fontSize || 32}
                onChange={(e) => handleUpdate('fontSize', parseInt(e.target.value, 10))}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Input
                type="color"
                value={selectedTrack.color || '#ffffff'}
                onChange={(e) => handleUpdate('color', e.target.value)}
                className="p-1 h-10 w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>Font Family</Label>
              <Select value={selectedTrack.fontFamily || 'Arial'} onValueChange={(val) => handleUpdate('fontFamily', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Impact">Impact</SelectItem>
                  <SelectItem value="Courier New">Courier New</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      default:
        return <p>No editable properties for this item.</p>;
    }
  };

  return (
    <aside className="w-80 border-l bg-muted/40 p-4 overflow-y-auto">
      <Card>
        <CardHeader>
          <CardTitle className="truncate">{selectedTrack ? selectedTrack.name : 'Properties'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Aspect Ratio</Label>
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger>
                <SelectValue placeholder="Select aspect ratio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16:9">16:9 (YouTube)</SelectItem>
                <SelectItem value="9:16">9:16 (TikTok, Reels)</SelectItem>
                <SelectItem value="1:1">1:1 (Instagram Post)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <hr className="my-4" />
          {renderTrackProperties()}
        </CardContent>
      </Card>
    </aside>
  );
};

export default InspectorPanel;