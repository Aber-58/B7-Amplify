import React from 'react';
import { motion } from 'framer-motion';

interface TimerProgressProps {
  current: number;
  total: number;
}

const THRESHOLDS = [
  { time: 45, emoji: '😊', message: 'Round started!' },
  { time: 35, emoji: '😄', message: 'Going strong!' },
  { time: 25, emoji: '😐', message: 'Time ticking...' },
  { time: 15, emoji: '😟', message: 'Hurry up!' },
  { time: 5, emoji: '😰', message: 'Almost over!' },
  { time: 0, emoji: '⏰', message: 'Time\'s up!' },
];

export const TimerProgress: React.FC<TimerProgressProps> = ({ current, total }) => {
  const progress = ((total - current) / total) * 100;
  const currentThreshold = THRESHOLDS.find(t => current <= t.time) || THRESHOLDS[THRESHOLDS.length - 1];
  const shouldShake = current <= 15;

  return (
    <motion.div
      animate={shouldShake ? {
        x: [0, -3, 3, -3, 3, 0],
        y: [0, -2, 2, -2, 2, 0],
      } : {}}
      transition={{
        duration: 0.5,
        repeat: shouldShake ? Infinity : 0,
        repeatDelay: 0.2,
      }}
      className="fixed top-4 right-4 z-40 w-80"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl border-2 border-purple-200 p-3">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <motion.div
              animate={shouldShake ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.3, repeat: shouldShake ? Infinity : 0 }}
              className="text-2xl"
            >
              {currentThreshold.emoji}
            </motion.div>
            <div>
              <p className="font-display font-bold text-base text-ink">
                {current}s
              </p>
              <p className="font-display text-xs text-ink/60">
                {currentThreshold.message}
              </p>
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-lg font-display font-bold text-lg ${
            current <= 10 ? 'bg-red-500 text-white' :
            current <= 20 ? 'bg-orange-500 text-white' :
            'bg-purple-500 text-white'
          }`}>
            {current}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="relative h-2 bg-ink/10 rounded-full overflow-hidden border border-ink/20">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 opacity-20" />
          
          {/* Progress fill */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "linear" }}
            className={`absolute inset-y-0 left-0 rounded-full ${
              current <= 10 ? 'bg-gradient-to-r from-red-500 to-red-600' :
              current <= 20 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
              'bg-gradient-to-r from-purple-500 to-pink-500'
            } shadow-lg`}
          />
          
          {/* Threshold markers */}
          {THRESHOLDS.slice(0, -1).map((threshold, index) => {
            const thresholdProgress = ((total - threshold.time) / total) * 100;
            const isReached = current <= threshold.time;
            
            return (
              <motion.div
                key={threshold.time}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: isReached ? 1 : 0.3,
                  scale: isReached ? 1 : 0.8,
                }}
                className="absolute top-0 bottom-0 w-1 bg-white/80 rounded-full"
                style={{ left: `${thresholdProgress}%`, transform: 'translateX(-50%)' }}
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

