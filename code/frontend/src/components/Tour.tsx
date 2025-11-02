import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  selector?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  route?: string; // Route to navigate to for this step
  action?: () => void; // Custom action for this step
}

interface TourProps {
  isActive: boolean;
  onClose: () => void;
  steps: TourStep[];
}

export const Tour: React.FC<TourProps> = ({ isActive, onClose, steps }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const highlightRef = useRef<HTMLDivElement>(null);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [overlayActive, setOverlayActive] = useState(false);

  useEffect(() => {
    if (!isActive || steps.length === 0) return;

    // Navigate to first step's route if needed
    const step = steps[currentStep];
    if (step?.route) {
      navigate(step.route);
      // Wait for navigation
      setTimeout(() => {
        updateHighlight();
      }, 500);
    } else {
      updateHighlight();
    }
  }, [currentStep, isActive, navigate]);

  useEffect(() => {
    if (isActive) {
      updateHighlight();
      window.addEventListener('resize', updateHighlight);
      return () => window.removeEventListener('resize', updateHighlight);
    }
  }, [isActive]);

  const updateHighlight = () => {
    const step = steps[currentStep];
    if (!step.selector) {
      setHighlightRect(null);
      setOverlayActive(true);
      return;
    }

    const element = document.querySelector(step.selector);
    if (element) {
      const rect = element.getBoundingClientRect();
      setHighlightRect(rect);
      setOverlayActive(true);
      
      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setHighlightRect(null);
      setOverlayActive(true);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      finishTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishTour = () => {
    setOverlayActive(false);
    setHighlightRect(null);
    onClose();
  };

  const skipTour = () => {
    finishTour();
  };

  if (!isActive || !overlayActive) return null;

  const step = steps[currentStep];
  const position = step.position || 'bottom';

  return (
    <AnimatePresence>
      {overlayActive && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/60"
            onClick={skipTour}
          />

          {/* Highlight Box */}
          {highlightRect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed z-[9999] pointer-events-none"
              style={{
                left: `${highlightRect.left - 8}px`,
                top: `${highlightRect.top - 8}px`,
                width: `${highlightRect.width + 16}px`,
                height: `${highlightRect.height + 16}px`,
              }}
            >
              <div className="absolute inset-0 border-4 border-accent rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]" />
              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 border-4 border-accent/50 rounded-lg"
              />
            </motion.div>
          )}

          {/* Tour Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed z-[10000] pointer-events-auto"
            style={{
              ...(highlightRect && position === 'bottom'
                ? {
                    left: `${highlightRect.left + highlightRect.width / 2}px`,
                    top: `${highlightRect.bottom + 20}px`,
                    transform: 'translateX(-50%)',
                  }
                : highlightRect && position === 'top'
                ? {
                    left: `${highlightRect.left + highlightRect.width / 2}px`,
                    top: `${highlightRect.top - 200}px`,
                    transform: 'translateX(-50%)',
                  }
                : {
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                  }),
            }}
          >
            <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-card border-2 border-accent p-6 max-w-sm min-w-[300px]">
              {/* Progress */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-display text-ink/60">
                  Step {currentStep + 1} of {steps.length}
                </span>
                <button
                  onClick={skipTour}
                  className="text-ink/50 hover:text-ink transition-colors text-xl leading-none"
                  aria-label="Close tour"
                >
                  ×
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-ink/10 rounded-full mb-4 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-accent rounded-full"
                />
              </div>

              {/* Title */}
              <h3 className="font-display font-bold text-lg text-ink mb-2">
                {step.title}
              </h3>

              {/* Description */}
              <p className="font-display text-sm text-ink/70 mb-6">
                {step.description}
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                {currentStep > 0 && (
                  <button
                    onClick={prevStep}
                    className="flex-1 px-4 py-2 border-2 border-ink/20 rounded-lg hover:bg-ink/5 transition-colors font-display text-sm"
                  >
                    Previous
                  </button>
                )}
                <button
                  onClick={nextStep}
                  className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-display text-sm font-medium"
                >
                  {currentStep < steps.length - 1 ? 'Next' : 'Finish'}
                </button>
              </div>

              {/* Skip */}
              <button
                onClick={skipTour}
                className="mt-3 text-xs text-ink/50 hover:text-ink transition-colors font-display w-full text-center"
              >
                Skip tour
              </button>
            </div>

            {/* Arrow pointing to element */}
            {highlightRect && position === 'bottom' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-full"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  className="text-accent"
                  fill="currentColor"
                >
                  <path d="M10 0L0 20h20L10 0z" />
                </svg>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * Default tour steps for consensus.io
 */
export const defaultTourSteps: TourStep[] = [
  {
    id: 'admin-create',
    title: 'Create a Topic',
    description: 'Enter a question or topic to start collecting opinions from participants.',
    selector: 'input[placeholder="Enter topic..."]',
    position: 'bottom',
    route: '/admin',
  },
  {
    id: 'admin-button',
    title: 'Create Topic Button',
    description: 'Click this button to create your topic and get a unique QR code to share.',
    selector: 'button:contains("Create Topic")',
    position: 'bottom',
  },
  {
    id: 'admin-qr',
    title: 'View QR Code',
    description: 'After creating a topic, click the QR button to see the shareable QR code.',
    selector: 'button[title="View QR Code"], button:has-text("QR")',
    position: 'top',
  },
  {
    id: 'invite-qr',
    title: 'Share QR Code',
    description: 'Participants can scan this QR code or click it to join your discussion.',
    selector: 'svg[class*="QRCode"]',
    position: 'bottom',
    route: '/invite/00000000-0000-0000-0000-000000000000',
  },
  {
    id: 'poll-form',
    title: 'Submit Your Opinion',
    description: 'Enter your thoughts and rate the importance (1-10). Your opinion will be collected and clustered with similar ideas.',
    selector: 'textarea',
    position: 'bottom',
    route: '/poll/00000000-0000-0000-0000-000000000000',
  },
  {
    id: 'poll-submit',
    title: 'Submit Opinion',
    description: 'Click submit to add your opinion to the collective intelligence pool.',
    selector: 'button[type="submit"], button:has-text("Submit")',
    position: 'top',
  },
  {
    id: 'live-cloudmap',
    title: 'Cluster Visualization',
    description: 'See how opinions cluster together! Each bubble represents a group of similar ideas. Size shows engagement, color shows sentiment.',
    selector: 'svg[viewBox]',
    position: 'bottom',
    route: '/live/00000000-0000-0000-0000-000000000000',
  },
  {
    id: 'live-cluster',
    title: 'Explore Clusters',
    description: 'Hover or click on clusters to see detailed information, representative quotes, and sentiment analysis.',
    selector: 'svg[viewBox] circle',
    position: 'top',
  },
  {
    id: 'live-chat',
    title: 'Discuss Clusters',
    description: 'Chat with other participants about the emerging clusters and consensus.',
    selector: '[class*="ChatBox"]',
    position: 'top',
  },
  {
    id: 'live-legend',
    title: 'Sentiment Legend',
    description: 'Use this legend to understand the sentiment coloring: red (negative), yellow (neutral), green (positive).',
    selector: '[class*="SentimentLegend"]',
    position: 'top',
  },
];
