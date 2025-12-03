import React, { useState, useMemo } from 'react';
import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { ArrowLeft, FileScan, Trash2 } from 'lucide-react';

const StatCard = ({ title, value }) => (
  <div className="bg-muted/50 p-4 rounded-lg text-center">
    <p className="text-sm text-muted-foreground">{title}</p>
    <p className="text-2xl font-bold text-primary">{value}</p>
  </div>
);

const WordCounterPage = () => {
  const faqSchema = {
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "How do I count words in my text?", "acceptedAnswer": { "@type": "Answer", "text": "Simply paste or type your text in the text area. Word, character, sentence, and paragraph counts update instantly." } },
      { "@type": "Question", "name": "Does it count characters with spaces?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, the character count includes all characters including spaces, punctuation, and line breaks." } },
      { "@type": "Question", "name": "Can I clear the text easily?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, click the 'Clear Text' button to remove all content and start fresh." } }
    ]
  };

  const [text, setText] = useState('');

  const stats = useMemo(() => {
    const trimmedText = text.trim();
    const words = trimmedText ? trimmedText.split(/\s+/).filter(Boolean) : [];
    const characters = text.length;
    const sentences = text ? (text.match(/[.!?]+(?!\s*\w)/g) || []).length : 0;
    const paragraphs = trimmedText ? trimmedText.split(/\n+/).filter(p => p.trim().length > 0).length : 0;
    
    return {
      words: words.length,
      characters,
      sentences: sentences === 0 && words.length > 0 ? 1 : sentences,
      paragraphs,
    };
  }, [text]);

  const handleClear = () => {
    setText('');
  };

  return (
    <>
      <SEO path="/tools/word-counter" faqSchema={faqSchema} />
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-secondary/20 to-background p-4 sm:p-6">
        <header className="flex items-center justify-between mb-8">
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tools
            </Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-primary">Word & Text Counter</h1>
        </header>

        <main className="flex-1 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-4xl"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileScan className="text-primary" />
                  <span>Analyze Your Text</span>
                </CardTitle>
                <CardDescription>Paste your text below to get instant statistics.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard title="Words" value={stats.words} />
                  <StatCard title="Characters" value={stats.characters} />
                  <StatCard title="Sentences" value={stats.sentences} />
                  <StatCard title="Paragraphs" value={stats.paragraphs} />
                </div>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Start typing or paste your text here..."
                  className="h-64 text-base"
                />
                <div className="flex justify-end">
                  <Button variant="outline" onClick={handleClear} disabled={!text}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear Text
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="w-full max-w-4xl mt-8">
                <CardHeader>
                    <CardTitle>How to Use the Word Counter</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                    <p>Get detailed statistics about your text in real-time. This tool is perfect for writers, students, and professionals.</p>
                    <ol>
                        <li><strong>Enter Text:</strong> Type or paste your content directly into the text area.</li>
                        <li><strong>View Live Stats:</strong> As you type, the counters for words, characters, sentences, and paragraphs will update instantly at the top.</li>
                        <li><strong>Clear Text:</strong> Click the "Clear Text" button to easily start over with a new piece of text.</li>
                    </ol>
                </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default WordCounterPage;