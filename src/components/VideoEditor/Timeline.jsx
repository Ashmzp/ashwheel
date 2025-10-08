import React, { useRef, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { useVideoEditorStore } from '@/stores/videoEditStore';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import WaveSurfer from 'wavesurfer.js';
import { Music, Image as ImageIcon, Film, Trash2, Scissors } from 'lucide-react';
import { Resizable } from 're-resizable';
import { Button } from '@/components/ui/button';

const Track = ({ track }) => {
  const { zoomLevel, removeTrack, setSelectedTrackId, selectedTrackId, updateTrack } = useVideoEditorStore();
  const waveformRef = useRef(null);
  const isSelected = selectedTrackId === track.id;

  useEffect(() => {
    if (track.type === 'audio' && waveformRef.current) {
      const wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#A8B5C4',
        progressColor: '#F97316',
        url: track.src,
        height: 40,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        cursorWidth: 0,
        interact: false,
      });

      return () => {
        wavesurfer.destroy();
      };
    }
  }, [track.src, track.type]);

  const getIcon = () => {
    switch (track.type) {
      case 'video': return <Film className="w-4 h-4 mr-2" />;
      case 'audio': return <Music className="w-4 h-4 mr-2" />;
      case 'image': return <ImageIcon className="w-4 h-4 mr-2" />;
      case 'text': return <span className="font-bold text-lg mr-2">T</span>;
      default: return null;
    }
  };

  const handleResize = (e, direction, ref, d) => {
    const newDuration = track.duration + (d.width / (50 * zoomLevel));
    updateTrack(track.id, { duration: newDuration });
  };

  const handleResizeStart = (e) => {
    e.stopPropagation();
    setSelectedTrackId(track.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute h-12"
      style={{
        left: `${track.start * 50 * zoomLevel}px`,
        top: `${track.layer * 55 + 5}px`,
        zIndex: isSelected ? 10 : 1,
      }}
      onClick={() => setSelectedTrackId(track.id)}
    >
      <Resizable
        size={{ width: track.duration * 50 * zoomLevel, height: 48 }}
        minWidth={20}
        onResize={handleResize}
        onResizeStart={handleResizeStart}
        enable={{ right: true }}
        className={`h-full flex items-center rounded-md cursor-pointer border ${isSelected ? 'border-primary ring-2 ring-primary' : 'border-border'}`}
        style={{
          backgroundColor: track.type === 'video' ? 'hsl(var(--primary)/0.2)' : track.type === 'audio' ? 'hsl(var(--accent))' : track.type === 'text' ? 'hsl(100, 60%, 80%)' : 'hsl(var(--secondary))',
        }}
      >
        <div className="flex items-center w-full h-full px-2 truncate">
          {getIcon()}
          {track.type === 'audio' ? (
            <div ref={waveformRef} className="w-full h-full"></div>
          ) : (
            <span className="text-xs font-medium truncate">{track.name}</span>
          )}
        </div>
        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeTrack(track.id);
            }}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 z-20"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </Resizable>
    </motion.div>
  );
};

const Timeline = () => {
  const { timeline, addToTimeline, zoomLevel, setZoomLevel, currentTime, selectedTrackId, splitTrack } = useVideoEditorStore();
  const timelineWrapperRef = useRef(null);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'media',
    drop: (item, monitor) => {
      if (!timelineWrapperRef.current) return;
      const dropPosition = monitor.getClientOffset();
      const timelineRect = timelineWrapperRef.current.getBoundingClientRect();
      const scrollLeft = timelineWrapperRef.current.scrollLeft;
      const start = (dropPosition.x - timelineRect.left + scrollLeft) / (50 * zoomLevel);
      addToTimeline(item, { start });
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const handleSplit = () => {
    if (selectedTrackId) {
      splitTrack(selectedTrackId, currentTime);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 border-b flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSplit} disabled={!selectedTrackId}>
            <Scissors className="w-4 h-4 mr-2" /> Split
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="zoom" className="text-sm">Zoom:</label>
          <input
            type="range"
            id="zoom"
            min="0.1"
            max="5"
            step="0.1"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
            className="w-32"
          />
        </div>
      </div>
      <div ref={drop} className="flex-1 overflow-auto relative p-2" ref={timelineWrapperRef}>
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
          style={{ left: `${currentTime * 50 * zoomLevel}px` }}
        ></div>
        {timeline.length === 0 ? (
          <div className={`h-full flex items-center justify-center border-2 border-dashed rounded-lg ${isOver ? 'border-primary bg-primary/10' : 'border-border'}`}>
            <p className="text-muted-foreground">Drag media here to add to timeline</p>
          </div>
        ) : (
          <div className="relative h-full" style={{ width: `${Math.max(...timeline.map(t => t.start + t.duration), 10) * 50 * zoomLevel}px` }}>
            {timeline.map((track) => (
              <Track key={track.id} track={track} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;