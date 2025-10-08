import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useVideoEditorStore } from '@/stores/videoEditStore';
import { useToast } from '@/components/ui/use-toast';
import { Film, Music, Image as ImageIcon, Upload } from 'lucide-react';
import { useDrag } from 'react-dnd';

const MediaItem = ({ item }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'media',
    item: { ...item },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const getIcon = () => {
    switch (item.type) {
      case 'video': return <Film className="w-full h-full text-primary" />;
      case 'audio': return <Music className="w-full h-full text-green-500" />;
      case 'image': return <ImageIcon className="w-full h-full text-blue-500" />;
      default: return null;
    }
  };

  return (
    <div
      ref={drag}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="relative w-full pt-[100%] cursor-grab bg-muted rounded-md overflow-hidden"
    >
      <div className="absolute inset-0 p-2">{getIcon()}</div>
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
        {item.name}
      </div>
    </div>
  );
};

const MediaLibrary = () => {
  const { toast } = useToast();
  const { media, addMedia } = useVideoEditorStore((state) => ({
    media: state.media,
    addMedia: state.addMedia,
  }));

  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const fileType = file.type.split('/')[0];
      const mediaObject = {
        id: Date.now() + file.name,
        name: file.name,
        type: fileType,
        src: URL.createObjectURL(file),
        file,
      };

      if (fileType === 'video' || fileType === 'audio') {
        const mediaElement = document.createElement(fileType);
        mediaElement.src = mediaObject.src;
        mediaElement.onloadedmetadata = () => {
          mediaObject.duration = mediaElement.duration;
          addMedia(mediaObject);
          toast({ title: "File Added", description: `${file.name} has been added.` });
        };
      } else if (fileType === 'image') {
        addMedia(mediaObject);
        toast({ title: "File Added", description: `${file.name} has been added.` });
      } else {
        toast({
          title: "Unsupported File",
          description: `${file.name} is not a supported media type.`,
          variant: 'destructive',
        });
      }
    });
  }, [addMedia, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.webm'],
      'audio/*': ['.mp3', '.wav'],
      'image/*': ['.jpeg', '.png'],
    },
  });

  return (
    <div className="p-4 flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">Media Library</h2>
      <div {...getRootProps()} className={`p-4 border-2 border-dashed rounded-lg text-center cursor-pointer ${isDragActive ? 'border-primary' : 'border-border'}`}>
        <input {...getInputProps()} />
        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">Drag & drop or click to browse</p>
      </div>
      <div className="mt-4 flex-1 overflow-y-auto space-y-2 grid grid-cols-2 gap-2 pr-2">
        {media.length === 0 ? (
          <p className="text-sm text-center text-muted-foreground col-span-2 mt-4">Your media will appear here.</p>
        ) : (
          media.map((item) => <MediaItem key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
};

export default MediaLibrary;