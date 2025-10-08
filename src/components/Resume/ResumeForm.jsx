import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Trash2 } from 'lucide-react';

const ResumeForm = ({
  personalDetails, setPersonalDetails,
  summary, setSummary,
  experience, setExperience,
  education, setEducation,
  skills, setSkills,
}) => {
  const handlePersonalChange = (e) => setPersonalDetails({ ...personalDetails, [e.target.name]: e.target.value });
  const handleSummaryChange = (e) => setSummary(e.target.value);
  const handleSkillsChange = (e) => setSkills(e.target.value);
  
  const handleDynamicChange = (setter, id, e) => {
    setter(prev => prev.map(item => item.id === id ? { ...item, [e.target.name]: e.target.value } : item));
  };
  
  const addDynamicItem = (setter, newItem) => setter(prev => [...prev, { id: uuidv4(), ...newItem }]);
  const removeDynamicItem = (setter, id) => setter(prev => prev.filter(item => item.id !== id));

  return (
    <div className="md:h-[calc(100vh-100px)] md:overflow-y-auto pr-4">
      <div className="space-y-8">
        <Card>
          <CardHeader><CardTitle>Personal Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label htmlFor="name">Full Name</Label><Input id="name" name="name" value={personalDetails.name} onChange={handlePersonalChange} /></div>
            <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" value={personalDetails.email} onChange={handlePersonalChange} /></div>
            <div><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" value={personalDetails.phone} onChange={handlePersonalChange} /></div>
            <div><Label htmlFor="address">Address</Label><Input id="address" name="address" value={personalDetails.address} onChange={handlePersonalChange} /></div>
            <div className="sm:col-span-2"><Label htmlFor="linkedin">LinkedIn Profile URL</Label><Input id="linkedin" name="linkedin" value={personalDetails.linkedin} onChange={handlePersonalChange} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={summary} onChange={handleSummaryChange} rows={5} placeholder="A brief professional summary..."/>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Work Experience</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence>
            {experience.map((exp) => (
              <motion.div key={exp.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 border rounded-lg space-y-3 relative">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Job Title</Label><Input name="jobTitle" value={exp.jobTitle} onChange={(e) => handleDynamicChange(setExperience, exp.id, e)} /></div>
                  <div><Label>Company</Label><Input name="company" value={exp.company} onChange={(e) => handleDynamicChange(setExperience, exp.id, e)} /></div>
                  <div><Label>Start Date</Label><Input name="startDate" type="date" value={exp.startDate} onChange={(e) => handleDynamicChange(setExperience, exp.id, e)} /></div>
                  <div><Label>End Date</Label><Input name="endDate" value={exp.endDate} onChange={(e) => handleDynamicChange(setExperience, exp.id, e)} placeholder="Present"/></div>
                </div>
                <div><Label>Description (one point per line)</Label><Textarea name="description" value={exp.description} onChange={(e) => handleDynamicChange(setExperience, exp.id, e)} rows={4} placeholder="Your responsibilities and achievements..."/></div>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeDynamicItem(setExperience, exp.id)}><Trash2 className="h-4 w-4" /></Button>
              </motion.div>
            ))}
            </AnimatePresence>
            <Button variant="outline" onClick={() => addDynamicItem(setExperience, { jobTitle: '', company: '', startDate: '', endDate: '', description: '' })}><PlusCircle className="mr-2 h-4 w-4"/>Add Experience</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Education</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {education.map((edu) => (
              <div key={edu.id} className="p-4 border rounded-lg space-y-3 relative">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Degree/Course</Label><Input name="degree" value={edu.degree} onChange={(e) => handleDynamicChange(setEducation, edu.id, e)} /></div>
                  <div><Label>Institution</Label><Input name="institution" value={edu.institution} onChange={(e) => handleDynamicChange(setEducation, edu.id, e)} /></div>
                  <div><Label>Start Date</Label><Input name="startDate" type="date" value={edu.startDate} onChange={(e) => handleDynamicChange(setEducation, edu.id, e)} /></div>
                  <div><Label>End Date</Label><Input name="endDate" type="date" value={edu.endDate} onChange={(e) => handleDynamicChange(setEducation, edu.id, e)} /></div>
                </div>
                <div><Label>Description</Label><Textarea name="description" value={edu.description} onChange={(e) => handleDynamicChange(setEducation, edu.id, e)} placeholder="Additional details, e.g., GPA, honors..."/></div>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeDynamicItem(setEducation, edu.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="outline" onClick={() => addDynamicItem(setEducation, { degree: '', institution: '', startDate: '', endDate: '', description: '' })}><PlusCircle className="mr-2 h-4 w-4"/>Add Education</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={skills} onChange={handleSkillsChange} placeholder="Enter skills, separated by commas..."/>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResumeForm;