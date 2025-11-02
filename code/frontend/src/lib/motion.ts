import { Variants } from 'framer-motion';

/**
 * Framer Motion presets for ScribbleMind animations
 */

export const wobble: Variants = {
  initial: { scale: 0.98, rotate: 0 },
  animate: { 
    scale: 1, 
    rotate: [0, 1.2, -1.2, 0],
    transition: { 
      duration: 1.2, 
      ease: "easeInOut", 
      repeat: Infinity, 
      repeatType: "reverse" as const
    }
  }
};

export const drawIn: Variants = {
  initial: { pathLength: 0, opacity: 0 },
  animate: { 
    pathLength: 1, 
    opacity: 1,
    transition: { 
      duration: 0.9, 
      ease: "easeOut" 
    }
  }
};

export const pop: Variants = {
  initial: { scale: 0.85, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: { 
      type: "spring", 
      stiffness: 260, 
      damping: 18 
    }
  }
};

export const growPulse: Variants = {
  animate: { 
    scale: [1, 1.06, 1], 
    filter: ["blur(0px)", "blur(1px)", "blur(0px)"],
    transition: { 
      duration: 0.8,
      repeat: Infinity,
      repeatType: "reverse" as const
    }
  }
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get animation variants that respect prefers-reduced-motion
 */
export const getReducedMotionVariants = (variants: Variants): Variants => {
  if (prefersReducedMotion()) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 0.2 } }
    };
  }
  return variants;
};