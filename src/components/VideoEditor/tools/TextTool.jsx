import React from 'react';
import { Button } from '@/components/ui/button';
import { useVideoEditorStore } from '@/stores/videoEditStore';

const TextTool = () => {
  const { addToTimeline, setSelectedTrackId } = useVideoEditorStore();

  const addText = (style) => {
    const newId = `text-${Date.now()}`;
    const textItem = {
      id: newId,
      type: 'text',
      name: style.name,
      duration: 5,
      text: 'Your Text Here',
      fontSize: style.fontSize,
      color: style.color,
      fontFamily: style.fontFamily,
      x: 100,
      y: 100,
    };
    addToTimeline(textItem);
    setSelectedTrackId(newId);
  };

  const textStyles = [
    { name: 'Basic Title', fontSize: 48, color: '#FFFFFF', fontFamily: 'Arial' },
    { name: 'Subtitle', fontSize: 24, color: '#FFFFFF', fontFamily: 'Arial' },
    { name: 'Funky Text', fontSize: 52, color: '#F97316', fontFamily: 'Impact' },
    { name: 'Elegant Script', fontSize: 40, color: '#FFFFFF', fontFamily: 'Georgia' },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Add Text</h3>
      <div className="space-y-2">
        {textStyles.map((style) => (
          <Button
            key={style.name}
            variant="outline"
            className="w-full justify-start h-16 text-left"
            onClick={() => addText(style)}
          >
            <span style={{ fontFamily: style.fontFamily, fontSize: '1.2rem', color: style.color, textShadow: '1px 1px 2px black' }}>
              {style.name}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default TextTool;