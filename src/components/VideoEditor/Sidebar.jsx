import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Text, Scissors, Music, Image as ImageIcon, Star, LayoutTemplate, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useVideoEditorStore } from '@/stores/videoEditStore';

const Sidebar = () => {
  const { toast } = useToast();
  const { activeTab, setActiveTab } = useVideoEditorStore();

  const handleFeatureClick = (tabName) => {
    if (['transitions', 'elements'].includes(tabName)) {
      toast({
        title: "🚧 Feature Coming Soon!",
        description: "This feature isn't implemented yet—but stay tuned! 🚀",
      });
    } else {
      setActiveTab(tabName);
    }
  };

  const tools = [
    { name: 'media', icon: <Upload />, label: 'Media' },
    { name: 'ai', icon: <Sparkles />, label: 'AI Tools' },
    { name: 'templates', icon: <LayoutTemplate />, label: 'Templates' },
    { name: 'audio', icon: <Music />, label: 'Audio' },
    { name: 'text', icon: <Text />, label: 'Text' },
    { name: 'elements', icon: <ImageIcon />, label: 'Elements' },
    { name: 'transitions', icon: <Scissors />, label: 'Transitions' },
    { name: 'effects', icon: <Star />, label: 'Effects' },
  ];

  return (
    <aside className="w-20 flex flex-col items-center border-r bg-muted/40 p-2 space-y-2">
      {tools.map((tool) => (
        <Button
          key={tool.name}
          variant={activeTab === tool.name ? 'secondary' : 'ghost'}
          className="flex flex-col items-center justify-center h-16 w-full"
          onClick={() => handleFeatureClick(tool.name)}
        >
          {tool.icon}
          <span className="text-xs mt-1">{tool.label}</span>
        </Button>
      ))}
    </aside>
  );
};

export default Sidebar;