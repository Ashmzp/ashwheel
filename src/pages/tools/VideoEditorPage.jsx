import React from 'react';
import SEO from '@/components/SEO';
import VideoEditorLayout from '@/components/VideoEditor/VideoEditorLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const VideoEditorPage = () => {
  const faqSchema = {
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "Is this video editor really free?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, our online video editor is completely free with no watermarks or time limits." } },
      { "@type": "Question", "name": "What video formats are supported?", "acceptedAnswer": { "@type": "Answer", "text": "We support MP4, MOV, AVI, and most common video formats for upload and export." } },
      { "@type": "Question", "name": "Can I add music to my videos?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, upload audio files to the media library and add them to your timeline as background music." } }
    ]
  };

  return (
    <>
      <SEO path="/tools/video-editor" faqSchema={faqSchema} />
      <VideoEditorLayout />
      <div className="container mx-auto px-4 py-8">
          <Card className="w-full">
            <CardHeader>
                <CardTitle>How to Use the Video Editor</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>Create professional-quality videos right in your browser with our powerful and intuitive video editor.</p>
                <ol>
                    <li><strong>Upload Media:</strong> Start by uploading your video clips, images, and audio files to the Media Library.</li>
                    <li><strong>Arrange on Timeline:</strong> Drag and drop your media files from the library onto the timeline at the bottom. You can trim clips, change their order, and layer them.</li>
                    <li><strong>Add Effects & Text:</strong> Use the tools in the sidebar to add text overlays, apply visual effects, and insert transitions between clips.</li>
                    <li><strong>Preview Your Work:</strong> Watch the live preview window to see your changes in real-time.</li>
                    <li><strong>Export:</strong> Once you are happy with your video, click the "Export" button to render and download your final creation.</li>
                </ol>
            </CardContent>
        </Card>
      </div>
    </>
  );
};

export default VideoEditorPage;