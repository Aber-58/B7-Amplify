import React from 'react';
import { motion } from 'framer-motion';
import { sentimentColors } from '../lib/colors';

export const SentimentLegend: React.FC = () => {
  const swatches = [
    { label: 'Negative', color: sentimentColors.negative, sentiment: -1 },
    { label: 'Neutral', color: sentimentColors.neutral, sentiment: 0 },
    { label: 'Positive', color: sentimentColors.positive, sentiment: 1 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-4 right-4 rounded-xl bg-white/80 backdrop-blur-md p-3 shadow-card border border-ink/10 z-50"
    >
      <div className="flex items-center gap-3 text-xs">
        {swatches.map((swatch) => (
          <div key={swatch.label} className="flex items-center gap-1">
            <span
              className="inline-block h-3 w-3 rounded-full border border-ink/20"
              style={{ background: swatch.color }}
            />
            <span className="text-ink/70 font-medium">{swatch.label}</span>
          </div>
        ))}
      </div>
      
      {/* Scribble underline */}
      <svg
        className="absolute bottom-0 left-0 w-full h-1 opacity-30"
        viewBox="0 0 100 4"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M 0 2 Q 25 1, 50 2 T 100 2"
          stroke="#1F2937"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        />
      </svg>
    </motion.div>
  );
};