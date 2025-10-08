import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { LogIn, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ToolCard = ({ icon, title, description, to, isFeatured }) => {
  const cardContent = (
    <motion.div
      whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`h-full rounded-xl overflow-hidden ${isFeatured ? 'col-span-1 md:col-span-2 bg-primary text-primary-foreground' : 'bg-card'}`}
    >
      <Card className="cursor-pointer h-full flex flex-col group transition-all duration-300 bg-transparent border hover:border-primary/50">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
          <div className={`p-3 rounded-full transition-all duration-300 ${isFeatured ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'}`}>{icon}</div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-sm ${isFeatured ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );

  return <Link to={to} className={isFeatured ? 'col-span-1 md:col-span-2' : ''}>{cardContent}</Link>;
};

const InvoicingPage = () => {
  const tools = [
    { icon: <FileSpreadsheet size={28} />, title: 'Invoice Generator', description: 'Create and download professional invoices in minutes for free.', to: '/invoice-generator', isFeatured: true },
  ];

  return (
    <>
      <Helmet>
        <title>Invoicing Tools - Ashwheel</title>
        <meta name="description" content="Create professional invoices for free with Ashwheel's simple and powerful invoice generator. Perfect for small businesses and freelancers." />
      </Helmet>
      <div className="relative flex flex-col min-h-screen bg-background overflow-hidden">
        <header className="w-full p-4 sm:p-6 flex justify-between items-center z-20">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold text-primary flex items-center gap-2 h-10"
          >
             <Link to="/" className="flex items-center gap-2 h-full">
                <img src="https://storage.googleapis.com/hostinger-horizons-assets-prod/8e45b175-3dfd-4e9f-a234-534458b8b898/f8bd0b3d83df7421a08e46a0e1035d99.png" alt="Ashwheel Logo" className="h-full" />
             </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Button asChild>
              <Link to="/login">
                <LogIn className="mr-2 h-4 w-4" /> Sign In
              </Link>
            </Button>
          </motion.div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center text-center p-4 pt-16 md:pt-20 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="w-full max-w-4xl"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground">
              Free Invoicing, Made Simple
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Create, customize, and send professional invoices in seconds. The perfect tool for your business, completely free.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="w-full max-w-6xl mt-12 md:mt-16 px-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {tools.map((tool, index) => (
                <ToolCard 
                  key={index} 
                  icon={tool.icon}
                  title={tool.title} 
                  description={tool.description}
                  to={tool.to}
                  isFeatured={tool.isFeatured}
                />
              ))}
            </div>
          </motion.div>
        </main>

        <footer className="p-4 text-center text-muted-foreground text-sm mt-16 z-10">
          <p>&copy; {new Date().getFullYear()} Ashwheel. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
};

export default InvoicingPage;