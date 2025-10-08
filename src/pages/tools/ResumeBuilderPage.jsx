import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';
import { generateDocx, generatePdf } from '@/utils/resumeUtils';
import ResumeForm from '@/components/Resume/ResumeForm';
import ResumePreview from '@/components/Resume/ResumePreview';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, FileText, FileDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ResumeBuilderPage = () => {
  const { toast } = useToast();
  const resumePreviewRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState('classic');

  const [personalDetails, setPersonalDetails] = useState({
    name: 'Harsh Kumar',
    email: 'harsh.kumar@example.com',
    phone: '+91 98765 43210',
    address: 'Bengaluru, India',
    linkedin: 'linkedin.com/in/harshkumar',
  });
  const [summary, setSummary] = useState(
    'A passionate and creative software developer with 5+ years of experience in building scalable web applications. Proficient in React, Node.js, and cloud technologies. Eager to solve complex problems and contribute to innovative projects.'
  );
  const [experience, setExperience] = useState([
    { id: uuidv4(), jobTitle: 'Senior Frontend Developer', company: 'Innovatech Solutions', startDate: '2021-01-01', endDate: 'Present', description: 'Led the development of a new client-facing dashboard using React and Redux, improving user engagement by 25%.\nMentored junior developers and conducted code reviews to maintain high-quality standards.' },
    { id: uuidv4(), jobTitle: 'Software Engineer', company: 'TechGenix', startDate: '2019-06-01', endDate: '2020-12-31', description: 'Developed and maintained RESTful APIs with Node.js and Express.\nContributed to a 15% reduction in API response time through performance optimization.' },
  ]);
  const [education, setEducation] = useState([
    { id: uuidv4(), degree: 'Bachelor of Technology in Computer Science', institution: 'Indian Institute of Technology, Delhi', startDate: '2015-08-01', endDate: '2019-05-31', description: 'Graduated with a CGPA of 8.5. President of the Coding Club.' },
  ]);
  const [skills, setSkills] = useState('React, Node.js, JavaScript, TypeScript, HTML/CSS, TailwindCSS, PostgreSQL, Docker, AWS');
  
  const resumeData = { personalDetails, summary, experience, education, skills };

  const handleDownloadDocx = async () => {
    setIsDownloading(true);
    try {
      await generateDocx(resumeData, activeTemplate);
      toast({ title: 'Download Started', description: 'Your DOCX resume is being downloaded.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Download Error', description: 'Could not generate DOCX file.', variant: 'destructive' });
    }
    setIsDownloading(false);
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      await generatePdf(resumePreviewRef.current, personalDetails.name);
      toast({ title: 'Download Started', description: 'Your PDF resume is being downloaded.' });
    } catch (e) {
      toast({ title: 'Download Error', description: 'Could not generate PDF file.', variant: 'destructive' });
    }
    setIsDownloading(false);
  };

  return (
    <>
      <Helmet>
        <title>Resume Builder - Ashwheel Tools</title>
        <meta name="description" content="Build a professional resume in minutes with multiple templates and download it as a PDF or DOCX file." />
        <meta name="keywords" content="resume builder, cv builder, free resume maker, professional resume, cv template" />
      </Helmet>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-secondary/20 to-background">
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm shadow-sm">
            <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                <Button variant="ghost" asChild>
                    <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Tools</Link>
                </Button>
                <div className="flex items-center gap-2">
                    <Button onClick={handleDownloadDocx} disabled={isDownloading}>
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileText className="mr-2 h-4 w-4"/>}
                        Download DOCX
                    </Button>
                    <Button onClick={handleDownloadPdf} disabled={isDownloading}>
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileDown className="mr-2 h-4 w-4"/>}
                        Download PDF
                    </Button>
                </div>
            </div>
        </header>

        <main className="flex-1 grid md:grid-cols-2 gap-8 container mx-auto p-4 sm:p-6">
            <ResumeForm
                personalDetails={personalDetails} setPersonalDetails={setPersonalDetails}
                summary={summary} setSummary={setSummary}
                experience={experience} setExperience={setExperience}
                education={education} setEducation={setEducation}
                skills={skills} setSkills={setSkills}
            />
            <div className="flex flex-col gap-8">
                <ResumePreview
                    resumePreviewRef={resumePreviewRef}
                    activeTemplate={activeTemplate}
                    setActiveTemplate={setActiveTemplate}
                    resumeData={resumeData}
                />
                <Card>
                    <CardHeader>
                        <CardTitle>How to Use the Resume Builder</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                        <p>Create a job-winning resume that stands out to employers.</p>
                        <ol>
                            <li><strong>Fill in Your Details:</strong> Complete all sections in the form on the left, including personal details, summary, experience, education, and skills.</li>
                            <li><strong>Add or Remove Sections:</strong> Use the "+" and "trash" icons to add or remove entries for your work experience and education.</li>
                            <li><strong>Choose a Template:</strong> Select a template from the top of the preview panel on the right to see how your resume looks in different styles.</li>
                            <li><strong>Live Preview:</strong> Your resume will update in the preview panel in real-time as you type.</li>
                            <li><strong>Download:</strong> When you're ready, click "Download PDF" or "Download DOCX" at the top of the page to save your professional resume.</li>
                        </ol>
                    </CardContent>
                </Card>
            </div>
        </main>
      </div>
    </>
  );
};

export default ResumeBuilderPage;