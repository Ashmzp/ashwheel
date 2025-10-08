import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const TemplatesTool = () => {
  const { toast } = useToast();

  const handleAddTemplate = (templateName) => {
    toast({
      title: `🚧 ${templateName} Template Coming Soon!`,
      description: "This feature isn't implemented yet—but stay tuned! 🚀",
    });
  };

  const templates = [
    { name: 'Reels Opener' },
    { name: 'YouTube Intro' },
    { name: 'Product Showcase' },
    { name: 'Birthday Wish' },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Templates</h3>
      <div className="grid grid-cols-2 gap-2">
        {templates.map((template) => (
          <Button
            key={template.name}
            variant="outline"
            className="w-full h-24 flex items-center justify-center text-center"
            onClick={() => handleAddTemplate(template.name)}
          >
            {template.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default TemplatesTool;