import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';
import { generateDocx, generatePdf } from '@/utils/resumeUtils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, FileText, FileDown, PlusCircle, Trash2, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const BiodataForm = ({ biodata, setBiodata }) => {
    const handlePersonalChange = (e) => setBiodata(prev => ({ ...prev, personal: { ...prev.personal, [e.target.name]: e.target.value } }));
    const handleFamilyChange = (e) => setBiodata(prev => ({ ...prev, family: { ...prev.family, [e.target.name]: e.target.value } }));
    const handleContactChange = (e) => setBiodata(prev => ({ ...prev, contact: { ...prev.contact, [e.target.name]: e.target.value } }));
    
    const handleSiblingChange = (id, e) => {
        setBiodata(prev => ({
            ...prev,
            family: {
                ...prev.family,
                siblings: prev.family.siblings.map(s => s.id === id ? { ...s, [e.target.name]: e.target.value } : s)
            }
        }));
    };

    const addSibling = () => {
        setBiodata(prev => ({
            ...prev,
            family: {
                ...prev.family,
                siblings: [...prev.family.siblings, { id: uuidv4(), relation: 'Brother', details: '' }]
            }
        }));
    };

    const removeSibling = (id) => {
        setBiodata(prev => ({
            ...prev,
            family: {
                ...prev.family,
                siblings: prev.family.siblings.filter(s => s.id !== id)
            }
        }));
    };

    return (
        <div className="md:h-[calc(100vh-100px)] md:overflow-y-auto pr-4 space-y-8">
            <Card>
                <CardHeader><CardTitle>Personal Details</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label>Full Name</Label><Input name="name" value={biodata.personal.name} onChange={handlePersonalChange} /></div>
                    <div><Label>Date of Birth</Label><Input name="dob" type="date" value={biodata.personal.dob} onChange={handlePersonalChange} /></div>
                    <div><Label>Time of Birth</Label><Input name="tob" type="time" value={biodata.personal.tob} onChange={handlePersonalChange} /></div>
                    <div><Label>Place of Birth</Label><Input name="pob" value={biodata.personal.pob} onChange={handlePersonalChange} /></div>
                    <div><Label>Height (e.g., 5' 8")</Label><Input name="height" value={biodata.personal.height} onChange={handlePersonalChange} /></div>
                    <div><Label>Religion</Label><Input name="religion" value={biodata.personal.religion} onChange={handlePersonalChange} /></div>
                    <div><Label>Caste</Label><Input name="caste" value={biodata.personal.caste} onChange={handlePersonalChange} /></div>
                    <div><Label>Education</Label><Input name="education" value={biodata.personal.education} onChange={handlePersonalChange} /></div>
                    <div><Label>Occupation</Label><Input name="occupation" value={biodata.personal.occupation} onChange={handlePersonalChange} /></div>
                    <div className="sm:col-span-2"><Label>About Me</Label><Textarea name="about" value={biodata.personal.about} onChange={handlePersonalChange} /></div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Family Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div><Label>Father's Name</Label><Input name="fatherName" value={biodata.family.fatherName} onChange={handleFamilyChange} /></div>
                    <div><Label>Father's Occupation</Label><Input name="fatherOccupation" value={biodata.family.fatherOccupation} onChange={handleFamilyChange} /></div>
                    <div><Label>Mother's Name</Label><Input name="motherName" value={biodata.family.motherName} onChange={handleFamilyChange} /></div>
                    <div><Label>Mother's Occupation</Label><Input name="motherOccupation" value={biodata.family.motherOccupation} onChange={handleFamilyChange} /></div>
                    <div className="space-y-2">
                        <Label>Siblings</Label>
                        {biodata.family.siblings.map(sibling => (
                            <div key={sibling.id} className="flex items-center gap-2">
                                <Select value={sibling.relation} onValueChange={(value) => handleSiblingChange(sibling.id, { target: { name: 'relation', value } })}>
                                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Brother">Brother</SelectItem>
                                        <SelectItem value="Sister">Sister</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input name="details" placeholder="e.g., Elder, Married, working at..." value={sibling.details} onChange={(e) => handleSiblingChange(sibling.id, e)} />
                                <Button variant="ghost" size="icon" onClick={() => removeSibling(sibling.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                        ))}
                        <Button variant="outline" onClick={addSibling}><PlusCircle className="mr-2 h-4 w-4" />Add Sibling</Button>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Contact Details</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label>Contact Person</Label><Input name="contactPerson" value={biodata.contact.contactPerson} onChange={handleContactChange} /></div>
                    <div><Label>Contact Number</Label><Input name="contactNumber" value={biodata.contact.contactNumber} onChange={handleContactChange} /></div>
                    <div className="sm:col-span-2"><Label>Address</Label><Textarea name="address" value={biodata.contact.address} onChange={handleContactChange} /></div>
                </CardContent>
            </Card>
        </div>
    );
};

const BiodataPreview = ({ previewRef, templateId, biodata }) => {
    const DetailItem = ({ label, value }) => value ? <p><span className="font-semibold">{label}:</span> {value}</p> : null;

    const templates = {
        classic: (
            <div className="p-8 font-serif bg-white text-gray-800 border-4 border-amber-300">
                <h1 className="text-4xl text-center font-bold text-amber-800 mb-8">BIODATA</h1>
                <div className="grid grid-cols-3 gap-8">
                    <div className="col-span-2 space-y-6">
                        <h2 className="text-2xl font-semibold border-b-2 border-amber-300 pb-2">Personal Details</h2>
                        <DetailItem label="Name" value={biodata.personal.name} />
                        <DetailItem label="Date of Birth" value={biodata.personal.dob} />
                        <DetailItem label="Time of Birth" value={biodata.personal.tob} />
                        <DetailItem label="Place of Birth" value={biodata.personal.pob} />
                        <DetailItem label="Height" value={biodata.personal.height} />
                        <DetailItem label="Religion/Caste" value={`${biodata.personal.religion}, ${biodata.personal.caste}`} />
                        <DetailItem label="Education" value={biodata.personal.education} />
                        <DetailItem label="Occupation" value={biodata.personal.occupation} />
                        
                        <h2 className="text-2xl font-semibold border-b-2 border-amber-300 pb-2 pt-4">Family Details</h2>
                        <DetailItem label="Father's Name" value={biodata.family.fatherName} />
                        <DetailItem label="Father's Occupation" value={biodata.family.fatherOccupation} />
                        <DetailItem label="Mother's Name" value={biodata.family.motherName} />
                        <DetailItem label="Mother's Occupation" value={biodata.family.motherOccupation} />
                        <div>
                            <p className="font-semibold">Siblings:</p>
                            <ul className="list-disc pl-5">
                                {biodata.family.siblings.map(s => <li key={s.id}>{s.relation}: {s.details}</li>)}
                            </ul>
                        </div>

                        <h2 className="text-2xl font-semibold border-b-2 border-amber-300 pb-2 pt-4">Contact Details</h2>
                        <DetailItem label="Contact Person" value={biodata.contact.contactPerson} />
                        <DetailItem label="Contact Number" value={biodata.contact.contactNumber} />
                        <DetailItem label="Address" value={biodata.contact.address} />
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                        <div className="w-48 h-64 border-2 border-amber-300 flex items-center justify-center text-gray-400">Photo</div>
                    </div>
                </div>
            </div>
        ),
        modern: (
            <div className="p-8 font-sans bg-slate-50 text-slate-800">
                <div className="flex justify-between items-start pb-6 border-b-4 border-slate-800">
                    <div>
                        <h1 className="text-4xl font-bold">{biodata.personal.name}</h1>
                        <p className="text-lg text-slate-600">{biodata.personal.occupation}</p>
                    </div>
                    <div className="w-32 h-40 bg-slate-200 flex items-center justify-center text-slate-500">Photo</div>
                </div>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-slate-700">About Me</h3>
                        <p className="text-sm">{biodata.personal.about}</p>
                        <h3 className="text-xl font-semibold text-slate-700 pt-4">Personal Details</h3>
                        <DetailItem label="Date of Birth" value={biodata.personal.dob} />
                        <DetailItem label="Time/Place of Birth" value={`${biodata.personal.tob} / ${biodata.personal.pob}`} />
                        <DetailItem label="Height" value={biodata.personal.height} />
                        <DetailItem label="Religion" value={`${biodata.personal.religion} (${biodata.personal.caste})`} />
                    </div>
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-slate-700">Family Background</h3>
                        <DetailItem label="Father" value={`${biodata.family.fatherName} (${biodata.family.fatherOccupation})`} />
                        <DetailItem label="Mother" value={`${biodata.family.motherName} (${biodata.family.motherOccupation})`} />
                        <div>
                            <p className="font-semibold">Siblings:</p>
                            <ul className="list-disc pl-5 text-sm">
                                {biodata.family.siblings.map(s => <li key={s.id}>{s.relation}: {s.details}</li>)}
                            </ul>
                        </div>
                        <h3 className="text-xl font-semibold text-slate-700 pt-4">Contact Information</h3>
                        <DetailItem label="Address" value={biodata.contact.address} />
                        <DetailItem label="Contact" value={`${biodata.contact.contactPerson} - ${biodata.contact.contactNumber}`} />
                    </div>
                </div>
            </div>
        )
    };

    const template = templates[templateId] || templates.classic;

    return (
        <div className="md:h-[calc(100vh-100px)] md:overflow-y-auto bg-gray-100 p-4 rounded-lg">
            <div className="bg-white shadow-lg mx-auto" style={{ width: '210mm' }}>
                <div ref={previewRef} className="A4-container">
                    {template}
                </div>
            </div>
        </div>
    );
};

const MarriageBiodataMakerPage = () => {
    const { toast } = useToast();
    const previewRef = useRef(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [activeTemplate, setActiveTemplate] = useState('classic');
    const [biodata, setBiodata] = useState({
        personal: { name: 'Rohan Sharma', dob: '1995-08-15', tob: '10:30', pob: 'Delhi, India', height: "5'10\"", religion: 'Hindu', caste: 'Brahmin', education: 'MBA in Finance', occupation: 'Senior Analyst at MNC', about: 'A well-mannered, ambitious individual with a blend of modern and traditional values. Enjoys traveling and reading.' },
        family: { fatherName: 'Mr. Suresh Sharma', fatherOccupation: 'Businessman', motherName: 'Mrs. Anita Sharma', motherOccupation: 'Homemaker', siblings: [{ id: uuidv4(), relation: 'Sister', details: 'Younger, studying in college' }] },
        contact: { contactPerson: 'Mr. Suresh Sharma', contactNumber: '+91 9876543210', address: '123, ABC Colony, New Delhi' }
    });

    const handleDownloadPdf = async () => {
        setIsDownloading(true);
        try {
            await generatePdf(previewRef.current, `${biodata.personal.name}_Biodata`);
            toast({ title: 'Download Started', description: 'Your PDF biodata is being downloaded.' });
        } catch (e) {
            toast({ title: 'Download Error', description: 'Could not generate PDF file.', variant: 'destructive' });
        }
        setIsDownloading(false);
    };

    return (
        <>
            <Helmet>
                <title>Marriage Biodata Maker - Ashwheel Tools</title>
                <meta name="description" content="Create a professional and beautiful marriage biodata online for free. Choose from templates and download as a PDF." />
                <meta name="keywords" content="marriage biodata maker, biodata for marriage, matrimonial biodata, free biodata maker" />
            </Helmet>
            <div className="flex flex-col min-h-screen bg-gradient-to-br from-secondary/20 to-background">
                <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm shadow-sm">
                    <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                        <Button variant="ghost" asChild><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Tools</Link></Button>
                        <div className="flex items-center gap-2">
                            <Button onClick={handleDownloadPdf} disabled={isDownloading}>
                                {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileDown className="mr-2 h-4 w-4"/>}
                                Download PDF
                            </Button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 grid md:grid-cols-2 gap-8 container mx-auto p-4 sm:p-6">
                    <BiodataForm biodata={biodata} setBiodata={setBiodata} />
                    <div className="flex flex-col gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Palette /> Templates</CardTitle>
                                <CardDescription>Choose a template for your biodata.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                <Button variant={activeTemplate === 'classic' ? 'default' : 'outline'} onClick={() => setActiveTemplate('classic')}>Classic</Button>
                                <Button variant={activeTemplate === 'modern' ? 'default' : 'outline'} onClick={() => setActiveTemplate('modern')}>Modern</Button>
                            </CardContent>
                        </Card>
                        <BiodataPreview previewRef={previewRef} templateId={activeTemplate} biodata={biodata} />
                        <Card>
                            <CardHeader><CardTitle>How to Use</CardTitle></CardHeader>
                            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                                <ol>
                                    <li><strong>Fill Details:</strong> Enter all personal, family, and contact information in the form on the left.</li>
                                    <li><strong>Choose Template:</strong> Select a design from the 'Templates' section.</li>
                                    <li><strong>Live Preview:</strong> Your biodata will update in real-time as you type.</li>
                                    <li><strong>Download:</strong> Click 'Download PDF' to save your biodata.</li>
                                </ol>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </>
    );
};

export default MarriageBiodataMakerPage;