import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { analytics } from '@/utils/analytics';

const ToolProCTA = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-8 p-6 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-800"
    >
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center">
            <Zap className="h-6 w-6 text-black" />
          </div>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="font-bold text-lg mb-1 flex items-center justify-center md:justify-start gap-2">
            <FileText className="h-5 w-5" />
            Need Professional Invoicing & Business Management?
          </h3>
          <p className="text-sm text-muted-foreground">
            Ashwheel Pro offers GST invoicing, stock reports, party-wise sales tracking & complete automobile business management.
          </p>
        </div>
        <Button asChild className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
          <Link to="/ashwheel-pro" onClick={() => analytics.proCtaClicked('tool_page')}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Explore Pro
          </Link>
        </Button>
      </div>
    </motion.div>
  );
};

export default ToolProCTA;
