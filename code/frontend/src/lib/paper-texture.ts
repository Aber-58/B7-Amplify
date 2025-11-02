import React from 'react';

/**
 * Paper texture utilities for ScribbleMind background
 */

/**
 * Create a paper texture background using CSS
 * Fallback to gradient if canvas/paint worklet not available
 */
export const createPaperTexture = (): string => {
  // For now, return CSS gradient as fallback
  // In the future, could use CSS Paint API or canvas
  return `
    background: linear-gradient(90deg, #FCFAF2 0%, #FAF8F0 50%, #FCFAF2 100%);
    background-size: 100% 2px;
    background-image: 
      repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.03) 1px, rgba(0,0,0,0.03) 2px),
      repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(0,0,0,0.02) 1px, rgba(0,0,0,0.02) 2px);
  `;
};

/**
 * Get paper texture as React style object
 */
export const getPaperTextureStyle = (): React.CSSProperties => {
  return {
    background: 'linear-gradient(90deg, #FCFAF2 0%, #FAF8F0 50%, #FCFAF2 100%)',
    backgroundSize: '100% 2px',
    backgroundImage: `
      repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.03) 1px, rgba(0,0,0,0.03) 2px),
      repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(0,0,0,0.02) 1px, rgba(0,0,0,0.02) 2px)
    `,
  };
};

/**
 * Paper texture as Tailwind class helper
 */
export const paperTextureClass = 'bg-paper';

/**
 * Generate canvas-based paper texture (optional, more complex)
 */
export const generateCanvasTexture = (width: number = 100, height: number = 100): string => {
  // This would create a data URL for a canvas with paper texture
  // For now, return empty (CSS fallback used instead)
  return '';
};