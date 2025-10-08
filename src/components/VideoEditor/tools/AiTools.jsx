import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2 } from 'lucide-react';
import { useVideoEditorStore } from '@/stores/videoEditStore';
import { supabase } from '@/lib/customSupabaseClient';

const AiTools = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addMultipleToTimeline } = useVideoEditorStore();

  const handleGenerateVideo = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt is empty",
        description: "Please enter some text to generate a video.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('text-to-video', {
        body: { prompt },
      });

      if (error) throw error;

      addMultipleToTimeline(data.scenes);

      toast({
        title: "✅ Video Generated!",
        description: "AI-generated clips have been added to your timeline.",
      });

    } catch (error) {
      console.error("AI Generation Error:", error);
      toast({
        title: "Error generating video",
        description: error.message || "Could not connect to the AI service.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Sparkles className="text-primary" />
        AI Tools
      </h3>
      <div className="space-y-4">
        <div>
          <Label htmlFor="text-to-video-prompt" className="text-md font-medium">Text to Video</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Describe a scene or story in Hindi, English, or Hinglish.
          </p>
          <Textarea
            id="text-to-video-prompt"
            placeholder="e.g., 'a cinematic shot of a computer screen with code'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <Button onClick={handleGenerateVideo} disabled={isLoading} className="w-full">
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : 'Generate Video'}
        </Button>
      </div>
    </div>
  );
};

export default AiTools;