import React from 'react';
import { motion } from 'framer-motion';

const AnimatedLogo = ({ className, isLink = true }) => {
  const LogoImage = () => (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      whileHover={{ scale: 1.05, filter: 'brightness(1.1) drop-shadow(0 0 5px rgba(138, 43, 226, 0.5))' }}
    >
      <img
        src="https://storage.googleapis.com/hostinger-horizons-assets-prod/8e45b175-3dfd-4e9f-a234-534458b8b898/172f142ccbe623763c9332cff6a6f330.png"
        alt="Ashwheel Logo"
        className="h-full w-auto object-contain"
        style={{ minHeight: '36px' }}
      />
    </motion.div>
  );

  if (isLink) {
    return <a href="/">{LogoImage()}</a>;
  }
  
  return LogoImage();
};

export default AnimatedLogo;