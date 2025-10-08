import React, { useState } from 'react';
    import { useToast } from '@/components/ui/use-toast';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Textarea } from '@/components/ui/textarea';
    import { Label } from '@/components/ui/label';
    import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
    import { motion } from 'framer-motion';
    import { Send, Loader2, Mail, MessageSquare, User, Building } from 'lucide-react';
    import { Helmet } from 'react-helmet-async';
    import SeoWrapper from '@/components/SeoWrapper';

    const ContactPage = () => {
      const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      const [isSending, setIsSending] = useState(false);
      const { toast } = useToast();

      const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
      };

      const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSending(true);

        try {
          // This is a placeholder for a real form submission (e.g., using EmailJS, Formspree, or a backend)
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          console.log("Form submitted:", formData);

          toast({
            title: "Message Sent!",
            description: "Thank you for contacting us. We will get back to you shortly.",
          });

          setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
          toast({
            title: "Uh oh! Something went wrong.",
            description: "There was a problem with your request. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsSending(false);
        }
      };

      return (
        <SeoWrapper
            title="Contact Us - Ashwheel"
            description="Get in touch with the Ashwheel team for support, business inquiries, or general questions. We're here to help you with our suite of free online tools. Reach out via email or our contact form."
            keywords="contact ashwheel, support, business inquiry, customer service, feedback, help"
        >
          <div className="flex flex-col min-h-screen bg-gradient-to-br from-secondary/20 to-background p-4 sm:p-6">
            <main className="flex-1 flex flex-col items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full max-w-4xl"
                >
                  <Card>
                    <CardHeader className="text-center">
                      <CardTitle className="text-3xl md:text-4xl font-bold">Get in Touch</CardTitle>
                      <CardDescription className="text-lg text-muted-foreground">
                        We'd love to hear from you! Whether you have a question, a suggestion, or a business inquiry, feel free to reach out.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                        <div className="space-y-6">
                          <h3 className="text-2xl font-semibold">Contact Information</h3>
                          <p className="text-muted-foreground">
                            Fill out the form and our team will get back to you within 24 hours.
                          </p>
                          <div className="space-y-4">
                            <a href="mailto:support@ashwheel.com" className="flex items-center gap-3 group">
                              <Mail className="w-6 h-6 text-primary" />
                              <span className="text-lg group-hover:underline">support@ashwheel.com</span>
                            </a>
                            <div className="flex items-center gap-3">
                              <Building className="w-6 h-6 text-primary" />
                              <span className="text-lg">Mirzapur, India</span>
                            </div>
                          </div>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="name">Your Name</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                              <Input id="name" type="text" value={formData.name} onChange={handleInputChange} required placeholder="John Doe" className="pl-10" />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                              <Input id="email" type="email" value={formData.email} onChange={handleInputChange} required placeholder="john.doe@example.com" className="pl-10" />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="subject">Subject</Label>
                            <div className="relative">
                              <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                              <Input id="subject" type="text" value={formData.subject} onChange={handleInputChange} required placeholder="Regarding..." className="pl-10" />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="message">Your Message</Label>
                            <Textarea id="message" value={formData.message} onChange={handleInputChange} required placeholder="Please type your message here." rows={5} />
                          </div>
                          <Button type="submit" className="w-full" disabled={isSending}>
                            {isSending ? (
                              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                            ) : (
                              <><Send className="mr-2 h-4 w-4" /> Send Message</>
                            )}
                          </Button>
                        </form>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
            </main>
          </div>
        </SeoWrapper>
      );
    };

    export default ContactPage;