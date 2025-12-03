import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { analytics } from '@/utils/analytics';

const NewsletterCapture = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus('loading');
    
    // Simulate API call - Replace with actual newsletter API
    setTimeout(() => {
      analytics.newsletterSignup('home_page');
      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus('idle'), 3000);
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="my-12 mx-auto max-w-2xl"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[2px]">
        <div className="relative bg-background rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mb-4">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
              Get Free Tools Updates
              <Sparkles className="h-5 w-5 text-yellow-500" />
            </h3>
            <p className="text-muted-foreground">
              New tools, tips & exclusive offers delivered to your inbox
            </p>
          </div>

          {status === 'success' ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-4"
            >
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="font-semibold text-green-600 dark:text-green-400">
                Thanks! Check your email to confirm.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                required
              />
              <Button 
                type="submit" 
                disabled={status === 'loading'}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                {status === 'loading' ? 'Subscribing...' : 'Subscribe Free'}
              </Button>
            </form>
          )}

          <p className="text-xs text-center text-muted-foreground mt-4">
            No spam. Unsubscribe anytime. We respect your privacy.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default NewsletterCapture;
