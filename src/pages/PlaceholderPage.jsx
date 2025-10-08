import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Construction } from 'lucide-react';
import { motion } from 'framer-motion';

const PlaceholderPage = ({ title, message }) => {
  return (
    <>
      <Helmet>
        <title>{title} - Ashwheel Tools</title>
        <meta name="description" content={message} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-secondary/20 to-background p-4 sm:p-6">
        <header className="flex items-center justify-between mb-8">
          <Button variant="ghost" asChild>
            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Home</Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-primary">{title}</h1>
          <div></div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="w-full max-w-lg text-center">
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit">
                            <Construction className="w-12 h-12" />
                        </div>
                        <CardTitle className="mt-4 text-2xl">{title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            {message || `We're working hard to bring you this page. Please check back later!`}
                        </p>
                        <Button asChild className="mt-6">
                            <Link to="/">Go to Homepage</Link>
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        </main>
      </div>
    </>
  );
};

export default PlaceholderPage;