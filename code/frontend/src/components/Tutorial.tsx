import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TutorialProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

interface TutorialStep {
  emoji: string;
  title: string;
  description: string;
  funny: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    emoji: '💭',
    title: 'Share Your Opinion',
    description: 'Write what you think about the topic and rate it 1-10',
    funny: ''
  },
  {
    emoji: '🤖',
    title: 'AI Groups Similar Ideas',
    description: 'Our AI analyzes opinions and clusters similar thoughts together',
    funny: ''
  },
  {
    emoji: '🌈',
    title: 'Watch Ideas Cluster',
    description: 'See your opinion join others in real-time on the visual map',
    funny: ''
  },
  {
    emoji: '💬',
    title: 'Chat & See Results',
    description: 'Discuss with others and watch clusters grow as people chat',
    funny: ''
  }
];

export const Tutorial: React.FC<TutorialProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);

  useEffect(() => {
    // Auto-advance tutorial (optional - can be removed)
    // const timer = setTimeout(() => {
    //   if (currentStep < TUTORIAL_STEPS.length - 1) {
    //     setCurrentStep(prev => prev + 1);
    //   }
    // }, 4000);
    // return () => clearTimeout(timer);
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setShowTutorial(false);
    if (onComplete) {
      onComplete();
    }
  };

  const handleSkip = () => {
    setShowTutorial(false);
    if (onSkip) {
      onSkip();
    }
  };

  if (!showTutorial) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;

  return (
    <AnimatePresence>
      {showTutorial && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleSkip();
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative background */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500 rounded-full blur-3xl"></div>
            </div>

            {/* Skip button */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 text-ink/40 hover:text-ink/60 transition-colors text-sm font-display"
            >
              Skip ✕
            </button>

            {/* Step indicator */}
            <div className="flex justify-center gap-2 mb-6">
              {TUTORIAL_STEPS.map((_, index) => (
                <motion.div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 w-8'
                      : index < currentStep
                      ? 'bg-purple-300 w-2'
                      : 'bg-ink/10 w-2'
                  }`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                />
              ))}
            </div>

            {/* Content */}
            <div className="relative z-10">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-center space-y-4"
              >
                {/* Emoji */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                  className="text-6xl mb-4"
                >
                  {step.emoji}
                </motion.div>

                {/* Title */}
                <h3 className="font-display font-bold text-2xl text-ink mb-2">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="font-display text-ink/70 text-base leading-relaxed px-4">
                  {step.description}
                </p>
              </motion.div>

              {/* Navigation buttons */}
              <div className="flex gap-3 mt-8">
                {!isFirst && (
                  <motion.button
                    onClick={handlePrevious}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 px-4 py-3 bg-ink/5 hover:bg-ink/10 rounded-xl font-display font-medium text-ink/70 transition-colors"
                  >
                    ← Previous
                  </motion.button>
                )}
                <motion.button
                  onClick={isLast ? handleComplete : handleNext}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-display font-semibold shadow-lg hover:shadow-xl transition-all ${
                    isFirst && 'ml-auto'
                  }`}
                >
                  {isLast ? 'Get Started! 🚀' : 'Next →'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

