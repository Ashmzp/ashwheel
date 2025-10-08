import React from 'react';
import { Helmet } from 'react-helmet-async';
import VideoEditorLayout from '@/components/VideoEditor/VideoEditorLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const VideoEditorPage = () => {
  return (
    <>
      <Helmet>
        <title>Free Online Video Editor - AI Features | Ashwheel</title>
        <meta name="description" content="Edit videos like a pro with Ashwheel's free online video editor. Trim, add text, transitions, and use AI features. No download required." />
        <meta name="keywords" content="video editor, online video editor, free video editor, AI video editor, capcut alternative, video maker, create videos" />
      </Helmet>
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