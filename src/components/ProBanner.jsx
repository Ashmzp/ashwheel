import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { analytics } from '@/utils/analytics';

const ProBanner = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="my-16 mx-auto max-w-5xl"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 p-[2px]">
        <div className="relative bg-background rounded-2xl p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                <Zap className="h-6 w-6 text-yellow-500" />
                <span className="text-sm font-bold px-3 py-1 rounded-full bg-yellow-400 text-black">PRO</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-2">
                Running an Auto Business?
              </h3>
              <p className="text-muted-foreground text-sm md:text-base">
                Manage showroom, workshop, inventory, invoices & more with <span className="font-semibold text-primary">Ashwheel Pro</span> — Complete automobile business management software.
              </p>
            </div>
            <Button asChild size="lg" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-500 hover:to-orange-600 font-semibold shadow-lg">
              <Link to="/ashwheel-pro" onClick={() => analytics.proCtaClicked('home_banner')}>
                Try Free for 30 Days
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProBanner;
