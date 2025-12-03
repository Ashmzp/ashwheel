import React, { useState } from 'react';
    import { useNavigate } from 'react-router-dom';
    import SEO from '@/components/SEO';
    import ToolWrapper from '@/components/ToolWrapper';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { useToast } from '@/components/ui/use-toast';
    import { Plus, Trash2, Settings, Palette, LayoutList, LayoutGrid, Calendar } from 'lucide-react';
    import { useLocalStorage } from '@/hooks/useLocalStorage';
    import { v4 as uuidv4 } from 'uuid';
    import { Switch } from '@/components/ui/switch';
    import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
    import { Calendar as CalendarIcon } from 'lucide-react';
    import { format } from 'date-fns';
    import { Calendar as CalendarComponent } from '@/components/ui/calendar';

    const PollMakerPage = () => {
      const navigate = useNavigate();
      const [polls, setPolls] = useLocalStorage('polls', {});
      const [creatorName, setCreatorName] = useLocalStorage('pollCreatorName', '');
      const [question, setQuestion] = useState('');
      const [options, setOptions] = useState(['', '']);
      const [isMultipleChoice, setIsMultipleChoice] = useState(false);
      const [expiryDate, setExpiryDate] = useState(null);
      
      const [bgColor, setBgColor] = useState('#ffffff');
      const [textColor, setTextColor] = useState('#000000');
      const [layout, setLayout] = useState('list');

      const { toast } = useToast();

      const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
      };

      const addOption = () => {
        if (options.length < 10) {
          setOptions([...options, '']);
        } else {
          toast({ title: 'Limit Reached', description: 'You can add a maximum of 10 options.', variant: 'destructive' });
        }
      };

      const removeOption = (index) => {
        if (options.length <= 2) {
          toast({ title: 'Minimum Options', description: 'You need at least 2 options.', variant: 'destructive' });
          return;
        }
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
      };

      const createPoll = () => {
        if (!question.trim() || options.some(opt => !opt.trim())) {
          toast({ title: 'Error', description: 'Please fill out the question and all options.', variant: 'destructive' });
          return;
        }

        const pollId = uuidv4().slice(0, 8);
        const adminId = uuidv4().slice(0, 8);

        const pollData = {
          id: pollId,
          adminId,
          question,
          options,
          isMultipleChoice,
          expiryDate: expiryDate ? expiryDate.toISOString() : null,
          creatorName,
          customization: { bgColor, textColor, layout },
          createdAt: new Date().toISOString(),
        };
        
        const pollDataString = JSON.stringify(pollData);
        const encodedPollData = btoa(unescape(encodeURIComponent(pollDataString)));

        const voterUrl = `${window.location.origin}/poll/vote/${pollId}?data=${encodedPollData}`;
        const adminUrl = `${window.location.origin}/poll/admin/${adminId}?data=${encodedPollData}`;
        
        // For simplicity, we'll just navigate to admin page. The data is in the URL.
        // A real implementation might save the poll structure to a backend.
        // Here we use local storage just for the creator to see their list of polls.
        const newPollForLocalStorage = { ...pollData, votes: {}, voters: {} };
        setPolls(prevPolls => ({ ...prevPolls, [pollId]: newPollForLocalStorage }));

        toast({ title: 'Success!', description: 'Your poll has been created.' });
        navigate(`/poll/admin/${adminId}?data=${encodedPollData}`);
      };

      const howToUse = (
        <div>
          <p>1. (Optional) Enter your name to be displayed as the poll creator.</p>
          <p>2. Write your poll question and provide at least two options.</p>
          <p>3. Use the "Add Option" and trash icon buttons to manage options.</p>
          <p>4. (Optional) Configure settings like multiple choice, expiry date, and visual style.</p>
          <p>5. Click "Create Poll" to generate your admin and voter links. The poll data is stored in the link itself, so anyone with the link can view or vote.</p>
        </div>
      );

      const faqSchema = {
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "How do I create a poll?", "acceptedAnswer": { "@type": "Answer", "text": "Enter your question and options, customize settings, then click Create Poll to get shareable links." } },
          { "@type": "Question", "name": "Can I customize the poll appearance?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, you can change background color, text color, and choose between list or grid layout." } },
          { "@type": "Question", "name": "How do people vote?", "acceptedAnswer": { "@type": "Answer", "text": "Share the voter link with anyone. They can vote without creating an account." } }
        ]
      };

      return (
        <>
        <SEO path="/tools/poll-maker" faqSchema={faqSchema} />
        <ToolWrapper title="Advanced Poll Maker" howToUse={howToUse}>
          <Card className="max-w-2xl mx-auto bg-card/80 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">Create a New Poll</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="creatorName">Your Name (Optional)</Label>
                <Input id="creatorName" value={creatorName} onChange={e => setCreatorName(e.target.value)} placeholder="e.g., Ashish Kumar" />
              </div>
              <div>
                <Label htmlFor="question">Your Question</Label>
                <Input id="question" value={question} onChange={e => setQuestion(e.target.value)} placeholder="e.g., Which Ashwheel feature is the best?" />
              </div>
              <div>
                <Label>Options</Label>
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <Input value={option} onChange={e => handleOptionChange(index, e.target.value)} placeholder={`Option ${index + 1}`} />
                    <Button variant="ghost" size="icon" onClick={() => removeOption(index)} disabled={options.length <= 2}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addOption}><Plus className="mr-2 h-4 w-4" /> Add Option</Button>
              </div>

              <div className="p-4 border rounded-lg space-y-4">
                <h3 className="font-semibold flex items-center"><Settings className="mr-2 h-5 w-5" /> Settings</h3>
                <div className="flex items-center justify-between">
                  <Label htmlFor="multiple-choice">Allow multiple choices</Label>
                  <Switch id="multiple-choice" checked={isMultipleChoice} onCheckedChange={setIsMultipleChoice} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Expiry Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={`w-[240px] justify-start text-left font-normal ${!expiryDate && "text-muted-foreground"}`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {expiryDate ? format(expiryDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={expiryDate}
                        onSelect={setExpiryDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="p-4 border rounded-lg space-y-4">
                <h3 className="font-semibold flex items-center"><Palette className="mr-2 h-5 w-5" /> Customization</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Background Color</Label>
                    <Input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="p-1 h-10" />
                  </div>
                  <div>
                    <Label>Text Color</Label>
                    <Input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="p-1 h-10" />
                  </div>
                </div>
                <div>
                  <Label>Layout</Label>
                  <div className="flex gap-2 mt-1">
                    <Button variant={layout === 'list' ? 'default' : 'outline'} onClick={() => setLayout('list')}><LayoutList className="mr-2 h-4 w-4" /> List</Button>
                    <Button variant={layout === 'grid' ? 'default' : 'outline'} onClick={() => setLayout('grid')}><LayoutGrid className="mr-2 h-4 w-4" /> Grid</Button>
                  </div>
                </div>
              </div>

              <Button onClick={createPoll} size="lg" className="w-full font-bold text-lg">Create Poll & Get Links</Button>
            </CardContent>
          </Card>
        </ToolWrapper>
        </>
      );
    };

    export default PollMakerPage;