import React, { useState, useCallback } from 'react';
    import ToolWrapper from '@/components/ToolWrapper';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { useToast } from '@/components/ui/use-toast';
    import { Copy, RefreshCw } from 'lucide-react';
    import { HexColorPicker } from 'react-colorful';

    const ColorPickerPage = () => {
      const [color, setColor] = useState("#aabbcc");
      const [palette, setPalette] = useState([]);
      const { toast } = useToast();

      const generatePalette = useCallback(() => {
        const newPalette = Array.from({ length: 5 }, () => {
          return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        });
        setPalette(newPalette);
      }, []);

      const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast({
          title: 'Copied!',
          description: `${text} copied to clipboard.`,
        });
      };

      const howToUse = (
        <div>
          <p><strong>Color Picker:</strong></p>
          <p>1. Drag the selector on the color panel to pick a color.</p>
          <p>2. The HEX code is displayed below and can be copied by clicking the "Copy HEX" button.</p>
          <p><strong>Palette Generator:</strong></p>
          <p>1. Click "Generate Palette" to create a random 5-color palette.</p>
          <p>2. Click on any color in the palette preview or the list below to copy its HEX code.</p>
        </div>
      );

      return (
        <ToolWrapper title="Color Picker & Palette Generator" howToUse={howToUse}>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader><CardTitle>Color Picker</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <HexColorPicker color={color} onChange={setColor} style={{ width: '100%', height: '200px' }} />
                <div className="w-full p-4 rounded-lg text-center font-mono text-lg" style={{ backgroundColor: color }}>
                  {color}
                </div>
                <Button onClick={() => copyToClipboard(color)} className="w-full">
                  <Copy className="mr-2 h-4 w-4" /> Copy HEX
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Palette Generator</CardTitle>
                <Button variant="ghost" size="icon" onClick={generatePalette}>
                  <RefreshCw className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex h-32 rounded-lg overflow-hidden">
                  {palette.length > 0 ? palette.map((c, i) => (
                    <div key={i} style={{ backgroundColor: c }} className="flex-1 h-full cursor-pointer" onClick={() => copyToClipboard(c)} />
                  )) : <div className="flex-1 bg-muted flex items-center justify-center text-muted-foreground">Click generate</div>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {palette.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded-md text-sm cursor-pointer" onClick={() => copyToClipboard(c)}>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c }}></div>
                      {c}
                    </div>
                  ))}
                </div>
                <Button onClick={generatePalette} className="w-full">Generate Palette</Button>
              </CardContent>
            </Card>
          </div>
        </ToolWrapper>
      );
    };

    export default ColorPickerPage;