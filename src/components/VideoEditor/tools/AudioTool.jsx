import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const AudioTool = () => {
  const { toast } = useToast();

  const handleAddAudio = (audioName) => {
    toast({
      title: `🚧 ${audioName} Coming Soon!`,
      description: "This feature isn't implemented yet—but stay tuned! 🚀",
    });
  };

  const audioOptions = [
    { name: 'Music Library' },
    { name: 'Sound Effects' },
    { name: 'Record Voiceover' },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Audio</h3>
      <div className="space-y-2">
        {audioOptions.map((audio) => (
          <Button
            key={audio.name}
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleAddAudio(audio.name)}
          >
            {audio.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default AudioTool;