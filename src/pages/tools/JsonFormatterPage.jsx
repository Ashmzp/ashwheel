import React, { useState } from 'react';
    import SEO from '@/components/SEO';
    import ToolWrapper from '@/components/ToolWrapper';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Textarea } from '@/components/ui/textarea';
    import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
    import { AlertCircle, CheckCircle } from 'lucide-react';

    const JsonFormatterPage = () => {
      const faqSchema = {
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "How do I format JSON?", "acceptedAnswer": { "@type": "Answer", "text": "Paste your raw JSON in the left box, click Format JSON, and the beautified version appears on the right." } },
          { "@type": "Question", "name": "Does it validate JSON?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, it checks if your JSON is valid and shows error messages if there are syntax issues." } },
          { "@type": "Question", "name": "What if my JSON has errors?", "acceptedAnswer": { "@type": "Answer", "text": "The tool will display a detailed error message indicating what's wrong with your JSON syntax." } }
        ]
      };

      const [jsonInput, setJsonInput] = useState('');
      const [formattedJson, setFormattedJson] = useState('');
      const [error, setError] = useState('');

      const formatJson = () => {
        try {
          const parsed = JSON.parse(jsonInput);
          setFormattedJson(JSON.stringify(parsed, null, 2));
          setError('');
        } catch (e) {
          setError(e.message);
          setFormattedJson('');
        }
      };

      const howToUse = (
        <div>
          <p>1. Paste your raw JSON data into the left text area.</p>
          <p>2. Click the "Format JSON" button.</p>
          <p>3. The formatted and beautified JSON will appear in the right text area.</p>
          <p>4. A status message below will indicate if the JSON is valid or contains errors.</p>
        </div>
      );

      return (
        <>
        <SEO path="/tools/json-formatter" faqSchema={faqSchema} />
        <ToolWrapper title="JSON Formatter & Validator" howToUse={howToUse}>
          <Card className="max-w-4xl mx-auto">
            <CardHeader><CardTitle>JSON Formatter & Validator</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Paste your JSON here..."
                  rows={15}
                  className="font-mono"
                />
                <Textarea
                  readOnly
                  value={formattedJson}
                  placeholder="Formatted JSON will appear here..."
                  rows={15}
                  className="font-mono bg-muted"
                />
              </div>
              <Button onClick={formatJson} className="w-full">Format JSON</Button>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Invalid JSON</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {!error && formattedJson && (
                <Alert variant="default" className="bg-green-100 dark:bg-green-900">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle>Valid JSON</AlertTitle>
                  <AlertDescription>Your JSON is well-formed.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </ToolWrapper>
        </>
      );
    };

    export default JsonFormatterPage;