import React, { useState } from 'react';
    import ToolWrapper from '@/components/ToolWrapper';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Textarea } from '@/components/ui/textarea';

    const TextCaseConverterPage = () => {
      const [text, setText] = useState('');

      const toSentenceCase = () => {
        setText(text.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, c => c.toUpperCase()));
      };

      const toTitleCase = () => {
        setText(text.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '));
      };

      const howToUse = (
        <div>
          <p>1. Paste or type your text into the text area.</p>
          <p>2. Click one of the buttons (e.g., UPPERCASE, lowercase, Title Case, Sentence case) to convert your text.</p>
          <p>3. The text in the box will be instantly converted to the selected case.</p>
        </div>
      );

      return (
        <ToolWrapper title="Text Case Converter" howToUse={howToUse}>
          <Card className="max-w-3xl mx-auto">
            <CardHeader><CardTitle>Text Case Converter</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter your text here..."
                rows={10}
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button onClick={() => setText(text.toUpperCase())}>UPPERCASE</Button>
                <Button onClick={() => setText(text.toLowerCase())}>lowercase</Button>
                <Button onClick={toTitleCase}>Title Case</Button>
                <Button onClick={toSentenceCase}>Sentence case</Button>
              </div>
            </CardContent>
          </Card>
        </ToolWrapper>
      );
    };

    export default TextCaseConverterPage;