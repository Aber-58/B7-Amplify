/**
 * Color utilities for ScribbleMind sentiment mapping
 */

/**
 * Convert sentiment value (-1 to 1) to HSL hue
 * -1 (negative) -> 0 (red)
 * 0 (neutral) -> 45 (warm neutral)
 * +1 (positive) -> 140 (green)
 */
export const hueFromSentiment = (sentiment: number): number => {
  // Clamp sentiment to [-1, 1]
  const clamped = Math.max(-1, Math.min(1, sentiment));
  // Map to hue range: negative -> 0, neutral -> 45, positive -> 140
  return 70 * clamped + 45;
};

/**
 * Get cluster fill color from sentiment
 * -1 (negative) -> Red
 * 0 (neutral) -> Gray
 * +1 (positive) -> Green
 */
export const clusterFill = (sentiment: number): string => {
  // Map sentiment -1 to 1 to color: -1 (red) -> 0 (neutral gray) -> 1 (green)
  const clamped = Math.max(-1, Math.min(1, sentiment));
  
  if (clamped < 0) {
    // Negative sentiment: red (0 hue)
    const hue = 0; // Pure red
    const saturation = 85 + Math.abs(clamped) * 10; // More saturated for stronger negative
    const lightness = 60 - Math.abs(clamped) * 10; // Darker for stronger negative
    return `hsl(${hue}, ${Math.min(100, saturation)}%, ${Math.max(40, lightness)}%)`;
  } else if (clamped > 0) {
    // Positive sentiment: green (120-140 hue)
    const hue = 140; // Pure green
    const saturation = 75 + clamped * 15; // More saturated for stronger positive
    const lightness = 55 + clamped * 10; // Brighter for stronger positive
    return `hsl(${hue}, ${Math.min(100, saturation)}%, ${Math.min(70, lightness)}%)`;
  } else {
    // Neutral: gray
    return `hsl(0, 0%, 60%)`;
  }
};

/**
 * Get cluster stroke color from sentiment
 */
export const clusterStroke = (sentiment: number): string => {
  const hue = hueFromSentiment(sentiment);
  return `hsl(${hue}, 65%, 35%)`;
};

/**
 * Get sentiment label from value
 */
export const sentimentLabel = (sentiment: number): 'negative' | 'neutral' | 'positive' => {
  if (sentiment < -0.33) return 'negative';
  if (sentiment > 0.33) return 'positive';
  return 'neutral';
};

/**
 * Sentiment color constants
 */
export const sentimentColors = {
  negative: '#EF476F',
  neutral: '#9AA0A6',
  positive: '#3ECF8E',
} as const;