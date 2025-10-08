import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';

const useVideoEditorStore = create(
  immer((set, get) => ({
    media: [],
    timeline: [],
    selectedTrackId: null,
    isPlaying: false,
    currentTime: 0,
    zoomLevel: 1,
    aspectRatio: '16:9',
    activeTab: 'media',

    addMedia: (newMedia) =>
      set((state) => {
        state.media.push(newMedia);
      }),

    addToTimeline: (mediaItem, options = {}) =>
      set((state) => {
        const newTrack = {
          id: uuidv4(),
          mediaId: mediaItem.id,
          type: mediaItem.type,
          src: mediaItem.src,
          name: mediaItem.name || mediaItem.text,
          start: options.start || get().currentTime,
          duration: mediaItem.duration || 5,
          layer: state.timeline.filter(t => t.type === mediaItem.type).length,
          speed: 1,
          volume: 1,
          ...mediaItem,
        };
        state.timeline.push(newTrack);
      }),
    
    addMultipleToTimeline: (tracks) =>
      set((state) => {
        const newTracks = tracks.map(track => ({
          ...track,
          id: uuidv4(),
          name: track.text || track.name,
          layer: state.timeline.filter(t => t.type === track.type).length,
          speed: 1,
          volume: 1,
        }));
        state.timeline.push(...newTracks);
      }),

    updateTrack: (trackId, updates) =>
      set((state) => {
        const trackIndex = state.timeline.findIndex((t) => t.id === trackId);
        if (trackIndex !== -1) {
          Object.assign(state.timeline[trackIndex], updates);
        }
      }),
      
    removeTrack: (trackId) =>
      set((state) => {
        state.timeline = state.timeline.filter((t) => t.id !== trackId);
        if (state.selectedTrackId === trackId) {
          state.selectedTrackId = null;
        }
      }),

    splitTrack: (trackId, time) =>
      set((state) => {
        const trackIndex = state.timeline.findIndex((t) => t.id === trackId);
        if (trackIndex === -1) return;

        const originalTrack = state.timeline[trackIndex];
        if (time <= originalTrack.start || time >= originalTrack.start + originalTrack.duration) {
          return;
        }

        const splitPoint = time - originalTrack.start;

        const firstPart = {
          ...originalTrack,
          duration: splitPoint,
        };

        const secondPart = {
          ...originalTrack,
          id: uuidv4(),
          start: time,
          duration: originalTrack.duration - splitPoint,
        };

        state.timeline.splice(trackIndex, 1, firstPart, secondPart);
        state.selectedTrackId = secondPart.id;
      }),

    setSelectedTrackId: (trackId) =>
      set((state) => {
        state.selectedTrackId = trackId;
      }),

    togglePlay: () =>
      set((state) => {
        state.isPlaying = !state.isPlaying;
      }),

    setCurrentTime: (time) =>
      set((state) => {
        state.currentTime = time;
      }),

    setZoomLevel: (level) =>
      set((state) => {
        state.zoomLevel = Math.max(0.1, Math.min(5, level));
      }),
    
    setAspectRatio: (ratio) =>
      set((state) => {
        state.aspectRatio = ratio;
      }),
      
    setActiveTab: (tab) =>
      set((state) => {
        state.activeTab = tab;
      }),
  }))
);

export { useVideoEditorStore };