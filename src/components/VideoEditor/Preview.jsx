import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage } from 'react-konva';
import { useVideoEditorStore } from '@/stores/videoEditStore';

const Preview = () => {
  const { timeline, currentTime, isPlaying, setCurrentTime, aspectRatio } = useVideoEditorStore();
  const videoRef = useRef(null);
  const animationRef = useRef();
  const [videoElement, setVideoElement] = useState(null);
  const [imageElements, setImageElements] = useState({});
  const [stageSize, setStageSize] = useState({ width: 800, height: 450 });
  const containerRef = useRef(null);

  const videoTrack = timeline.find(t => t.type === 'video');

  useEffect(() => {
    if (videoTrack && !videoElement) {
      const vid = document.createElement('video');
      vid.src = videoTrack.src;
      vid.crossOrigin = "anonymous";
      vid.muted = true; // Mute preview video to avoid echo with audio tracks
      setVideoElement(vid);
    }
  }, [videoTrack, videoElement]);

  useEffect(() => {
    const imageTracks = timeline.filter(t => t.type === 'image');
    imageTracks.forEach(track => {
      if (!imageElements[track.id]) {
        const img = new window.Image();
        img.src = track.src;
        img.onload = () => {
          setImageElements(prev => ({ ...prev, [track.id]: img }));
        };
      }
    });
  }, [timeline, imageElements]);

  useEffect(() => {
    const animate = (now) => {
      if (videoElement) {
        setCurrentTime(videoElement.currentTime);
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      videoElement?.play();
      animationRef.current = requestAnimationFrame(animate);
    } else {
      videoElement?.pause();
      cancelAnimationFrame(animationRef.current);
    }

    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying, setCurrentTime, videoElement]);

  useEffect(() => {
    if (videoElement && Math.abs(videoElement.currentTime - currentTime) > 0.1) {
      videoElement.currentTime = currentTime;
    }
  }, [currentTime, videoElement]);

  useEffect(() => {
    if (videoElement && videoTrack) {
      videoElement.playbackRate = videoTrack.speed || 1;
    }
  }, [videoElement, videoTrack, videoTrack?.speed]);

  const getAspectRatioValue = () => {
    const parts = aspectRatio.split(':');
    return parts[0] / parts[1];
  };

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;
        const ratio = getAspectRatioValue();
        
        let width = containerWidth;
        let height = containerWidth / ratio;

        if (height > containerHeight) {
          height = containerHeight;
          width = containerHeight * ratio;
        }
        setStageSize({ width, height });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [aspectRatio]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center">
      <div className="bg-black relative" style={{ width: stageSize.width, height: stageSize.height }}>
        <Stage width={stageSize.width} height={stageSize.height}>
          <Layer>
            {videoElement && videoTrack && currentTime >= videoTrack.start && currentTime < videoTrack.start + videoTrack.duration && (
              <KonvaImage
                image={videoElement}
                width={stageSize.width}
                height={stageSize.height}
              />
            )}
            {(!videoElement || !videoTrack) && (
              <Rect width={stageSize.width} height={stageSize.height} fill="black" />
            )}
            
            {timeline.filter(t => t.type === 'text' && currentTime >= t.start && currentTime < t.start + t.duration).map(track => (
              <Text
                key={track.id}
                text={track.text}
                x={track.x}
                y={track.y}
                fontSize={track.fontSize}
                fontFamily={track.fontFamily}
                fill={track.color}
                draggable
              />
            ))}

            {timeline.filter(t => t.type === 'image' && currentTime >= t.start && currentTime < t.start + t.duration).map(track => (
              imageElements[track.id] && <KonvaImage
                key={track.id}
                image={imageElements[track.id]}
                x={100}
                y={100}
                width={150}
                height={150}
                draggable
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default Preview;