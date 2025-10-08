import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { Star, Send, Lightbulb, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/customSupabaseClient';

const StarRatingInput = ({ rating, setRating }) => (
  <div className="flex items-center gap-2">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`cursor-pointer transition-colors h-8 w-8 ${
          star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'
        }`}
        onClick={() => setRating(star)}
      />
    ))}
  </div>
);

const StarRatingDisplay = ({ rating }) => (
  <div className="flex items-center gap-1">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ))}
  </div>
);

const FeedbackCard = ({ feedback }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    className="bg-card p-4 rounded-lg border"
  >
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="font-bold">{feedback.name || 'Anonymous'}</div>
        <StarRatingDisplay rating={feedback.rating} />
      </div>
       <div className="text-xs text-muted-foreground">
        {new Date(feedback.created_at).toLocaleDateString()}
      </div>
    </div>
    <p className="mt-2 text-muted-foreground">{feedback.experience}</p>
  </motion.div>
);

const FeedbackPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('experience');

  // Feedback form state
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [experience, setExperience] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);

  // Tool request form state
  const [toolName, setToolName] = useState('');
  const [toolDescription, setToolDescription] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const fetchFeedbacks = useCallback(async () => {
    setLoadingFeedbacks(true);
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Could not fetch feedbacks.", variant: "destructive" });
    } else {
      setFeedbacks(data);
    }
    setLoadingFeedbacks(false);
  }, [toast]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0 || !experience) {
      toast({ title: 'Incomplete Form', description: 'Please provide a rating and your feedback.', variant: 'destructive' });
      return;
    }
    setIsSubmittingFeedback(true);
    const { data, error } = await supabase
      .from('feedback')
      .insert({ name: name.trim() || 'Anonymous', rating, experience })
      .select()
      .single();

    setIsSubmittingFeedback(false);

    if (error) {
      toast({ title: 'Submission Failed', description: 'Could not submit your feedback.', variant: 'destructive' });
    } else {
      toast({ title: 'Thank You!', description: 'Your feedback has been submitted successfully.' });
      setFeedbacks(prev => [data, ...prev]);
      setName('');
      setRating(0);
      setExperience('');
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!toolName) {
      toast({ title: 'Incomplete Form', description: 'Please provide the name of the tool you are requesting.', variant: 'destructive' });
      return;
    }
    setIsSubmittingRequest(true);
    const { error } = await supabase.from('tool_requests').insert({
      tool_name: toolName,
      tool_description: toolDescription,
      email: requestEmail,
    });
    setIsSubmittingRequest(false);

    if (error) {
      toast({ title: 'Submission Failed', description: 'Could not submit your tool request.', variant: 'destructive' });
    } else {
      toast({ title: 'Request Received!', description: 'Thank you! We will look into your suggestion.' });
      setToolName('');
      setToolDescription('');
      setRequestEmail('');
    }
  };

  return (
    <>
      <Helmet>
        <title>Feedback & Suggestions - Ashwheel</title>
        <meta name="description" content="Share your experience or suggest a new tool to help us improve Ashwheel. Read what other users are saying." />
        <meta name="keywords" content="feedback, testimonials, suggestions, tool request, user reviews, ashwheel feedback" />
      </Helmet>
      <div className="bg-gradient-to-br from-background to-secondary/10 p-4 sm:p-6 lg:p-8">
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sticky top-20">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="experience">Share Experience</TabsTrigger>
                <TabsTrigger value="request">Request a New Tool</TabsTrigger>
              </TabsList>
              <TabsContent value="experience">
                <Card>
                  <CardHeader>
                    <CardTitle>How was your experience?</CardTitle>
                    <CardDescription>Your feedback helps us improve Ashwheel for everyone.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label>How would you rate us?</Label>
                        <StarRatingInput rating={rating} setRating={setRating} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="experience">Your Feedback</Label>
                          <Textarea id="experience" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="Tell us about your experience..." required rows={4} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="name">Name (Optional)</Label>
                          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" />
                      </div>
                      <Button type="submit" className="w-full" disabled={isSubmittingFeedback}>
                        {isSubmittingFeedback ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Submit Feedback
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="request">
                <Card>
                  <CardHeader>
                    <CardTitle>Request a New Tool</CardTitle>
                    <CardDescription>Have an idea for a tool we should build? Let us know!</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleRequestSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="toolName">Tool Name</Label>
                        <Input id="toolName" value={toolName} onChange={(e) => setToolName(e.target.value)} placeholder="e.g., Image Background Remover" required />
                      </div>
                      <div>
                        <Label htmlFor="toolDescription">Tool Description (Optional)</Label>
                        <Textarea id="toolDescription" value={toolDescription} onChange={(e) => setToolDescription(e.target.value)} placeholder="Describe what the tool should do..." />
                      </div>
                       <div>
                        <Label htmlFor="requestEmail">Your Email (Optional)</Label>
                        <Input id="requestEmail" type="email" value={requestEmail} onChange={(e) => setRequestEmail(e.target.value)} placeholder="So we can notify you if we build it!" />
                      </div>
                      <Button type="submit" className="w-full" disabled={isSubmittingRequest}>
                        {isSubmittingRequest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                        Submit Request
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-2xl font-bold mb-4">What Our Users Say</h2>
             {loadingFeedbacks ? (
                <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : feedbacks.length > 0 ? (
                <div className="space-y-4">
                  {feedbacks.map((fb) => (
                    <FeedbackCard key={fb.id} feedback={fb} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No feedback yet. Be the first to share your experience!</p>
              )}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default FeedbackPage;