import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const EffectsTool = () => {
  const { toast } = useToast();

  const handleAddEffect = (effectName) => {
    toast({
      title: `🚧 ${effectName} Effect Coming Soon!`,
      description: "This feature isn't implemented yet—but stay tuned! 🚀",
    });
  };

  const effects = [
    { name: 'Glitch' },
    { name: 'VHS' },
    { name: 'Blur' },
    { name: '3D Zoom' },
    { name: 'Retro' },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Video Effects</h3>
      <div className="space-y-2">
        {effects.map((effect) => (
          <Button
            key={effect.name}
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleAddEffect(effect.name)}
          >
            {effect.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default EffectsTool;