import { hueFromSentiment, clusterFill, clusterStroke, sentimentLabel } from './colors';

/**
 * Calculate sentiment from cluster data or opinion text
 * For now, this provides placeholder sentiment calculation
 * In the future, this could integrate with an NLP API or backend service
 */

/**
 * Calculate average sentiment from raw opinions in a cluster
 * Placeholder: assigns sentiment based on opinion count and engagement
 */
export const calculateClusterSentiment = (
  rawOpinions: Array<{ opinion: string; weight?: number }>,
  engagement?: number
): number => {
  // Placeholder: simple heuristic based on engagement and opinion count
  // Real implementation would use NLP sentiment analysis
  if (rawOpinions.length === 0) return 0;
  
  // If engagement is provided, use it as a proxy for positive sentiment
  if (engagement !== undefined) {
    // Normalize engagement (assuming max engagement is 100)
    return Math.min(1, Math.max(-1, (engagement - 50) / 50));
  }
  
  // Fallback: random sentiment between -0.5 and 0.5 (slightly positive bias)
  return Math.random() * 0.5;
};

/**
 * Calculate sentiment from opinion text (placeholder)
 * Real implementation would use sentiment analysis API
 */
export const calculateTextSentiment = (text: string): number => {
  // Placeholder: simple keyword-based sentiment
  const positiveWords = ['good', 'great', 'excellent', 'love', 'amazing', 'perfect', 'wonderful', 'best'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointing'];
  
  const lowerText = text.toLowerCase();
  let score = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) score += 0.1;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) score -= 0.1;
  });
  
  return Math.max(-1, Math.min(1, score));
};

/**
 * Re-export color utilities
 */
export { hueFromSentiment, clusterFill, clusterStroke, sentimentLabel } from './colors';