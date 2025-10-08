import React, { useState } from 'react';
    import ToolWrapper from '@/components/ToolWrapper';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Textarea } from '@/components/ui/textarea';
    import { Slider } from '@/components/ui/slider';
    import { Label } from '@/components/ui/label';

    const TextSummarizerPage = () => {
      const [text, setText] = useState('');
      const [summary, setSummary] = useState('');
      const [numSentences, setNumSentences] = useState(3);

      const summarizeText = () => {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        if (sentences.length <= numSentences) {
          setSummary(text);
          return;
        }

        const wordFrequencies = {};
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        words.forEach(word => {
          wordFrequencies[word] = (wordFrequencies[word] || 0) + 1;
        });

        const sentenceScores = sentences.map(sentence => {
          const sentenceWords = sentence.toLowerCase().match(/\b\w+\b/g) || [];
          return sentenceWords.reduce((score, word) => score + (wordFrequencies[word] || 0), 0);
        });

        const rankedSentences = sentences
          .map((sentence, index) => ({ sentence, score: sentenceScores[index], index }))
          .sort((a, b) => b.score - a.score);

        const topSentences = rankedSentences.slice(0, numSentences).sort((a, b) => a.index - b.index);
        setSummary(topSentences.map(s => s.sentence).join(' '));
      };

      const howToUse = (
        <div>
          <p>1. Paste the long text you want to summarize into the text area.</p>
          <p>2. Use the slider to select the desired number of sentences for your summary.</p>
          <p>3. Click the "Summarize" button.</p>
          <p>4. The generated summary will appear below.</p>
          <p><strong>Note:</strong> This is a basic summarizer and works by ranking sentences based on word frequency. It may not be perfect for all types of text.</p>
        </div>
      );

      return (
        <ToolWrapper title="Basic Text Summarizer" howToUse={howToUse}>
          <Card className="max-w-3xl mx-auto">
            <CardHeader><CardTitle>Basic Text Summarizer</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your long text here..."
                rows={10}
              />
              <div className="space-y-2">
                <Label htmlFor="num-sentences">Number of sentences in summary: {numSentences}</Label>
                <Slider
                  id="num-sentences"
                  min={1}
                  max={10}
                  step={1}
                  value={[numSentences]}
                  onValueChange={(value) => setNumSentences(value[0])}
                />
              </div>
              <Button onClick={summarizeText} className="w-full">Summarize</Button>
              {summary && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Summary:</h3>
                  <div className="p-4 bg-muted rounded-lg">{summary}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </ToolWrapper>
      );
    };

    export default TextSummarizerPage;