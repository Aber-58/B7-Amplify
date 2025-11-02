import React from 'react';
import { motion } from 'framer-motion';
import { Tour, defaultTourSteps, TourStep } from './Tour';

interface TourButtonProps {
  steps?: TourStep[];
  className?: string;
}

export const TourButton: React.FC<TourButtonProps> = ({ 
  steps = defaultTourSteps,
  className = ''
}) => {
  const [isTourActive, setIsTourActive] = React.useState(false);

  const startTour = () => {
    setIsTourActive(true);
  };

  const closeTour = () => {
    setIsTourActive(false);
  };

  return (
    <>
      <motion.button
        onClick={startTour}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-display font-medium shadow-card border-2 border-accent/20 ${className}`}
        title="Start UI Tour"
      >
        <span className="flex items-center gap-2">
          <span>🎯</span>
          <span>Take Tour</span>
        </span>
      </motion.button>

      <Tour
        isActive={isTourActive}
        onClose={closeTour}
        steps={steps}
      />
    </>
  );
};

