import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';
import ResumeTemplate from './templates/ResumeTemplate';

const templates = [
    { id: 'classic', name: 'Classic' },
    { id: 'modern', name: 'Modern' },
    { id: 'creative', name: 'Creative' },
    { id: 'professional', name: 'Professional' },
    { id: 'minimalist', name: 'Minimalist' },
    { id: 'corporate', name: 'Corporate' },
    { id: 'academic', name: 'Academic' },
    { id: 'technical', name: 'Technical' },
    { id: 'elegant', name: 'Elegant' },
    { id: 'bold', name: 'Bold' },
];

const ResumePreview = ({ resumePreviewRef, activeTemplate, setActiveTemplate, resumeData }) => {
  return (
    <div className="md:h-[calc(100vh-100px)] md:overflow-y-auto bg-gray-100 p-4 rounded-lg">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Palette /> Templates</CardTitle>
                <CardDescription>Choose a template for your resume.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {templates.map(template => (
                    <Button 
                        key={template.id} 
                        variant={activeTemplate === template.id ? 'default' : 'outline'}
                        onClick={() => setActiveTemplate(template.id)}
                        className="w-full"
                    >
                        {template.name}
                    </Button>
                ))}
            </CardContent>
        </Card>
        <div className="mt-4 bg-white shadow-lg mx-auto" style={{ width: '210mm' }}>
            <div ref={resumePreviewRef} className="A4-container">
                <ResumeTemplate 
                    templateId={activeTemplate}
                    {...resumeData}
                />
            </div>
        </div>
    </div>
  );
};

export default ResumePreview;