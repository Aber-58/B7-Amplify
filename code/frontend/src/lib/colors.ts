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
  // Wider color scale: 2x green, 1x red, 1x grey
  // Map: -1 to -0.2 = red, -0.2 to 0.2 = gray, 0.2 to 1 = green
  // This gives green 0.8 range, red 0.8 range, gray 0.4 range (2:2:1 ratio with bias toward green)
  const clamped = Math.max(-1, Math.min(1, sentiment));
  
  if (clamped < -0.2) {
    // Negative sentiment: red (0 hue)
    // Map -1 to -0.2 onto 0-1 range
    const normalized = (clamped + 0.2) / -0.8;
    const hue = 0; // Pure red
    const saturation = 80 + normalized * 15; // More saturated for stronger negative
    const lightness = 55 - normalized * 15; // Darker for stronger negative
    return `hsl(${hue}, ${Math.min(100, saturation)}%, ${Math.max(40, lightness)}%)`;
  } else if (clamped > 0.2) {
    // Positive sentiment: green (120-150 hue range)
    // Map 0.2 to 1 onto 0-1 range
    const normalized = (clamped - 0.2) / 0.8;
    const hue = 120 + normalized * 30; // Green to bright green
    const saturation = 70 + normalized * 20; // More saturated for stronger positive
    const lightness = 50 + normalized * 15; // Brighter for stronger positive
    return `hsl(${hue}, ${Math.min(100, saturation)}%, ${Math.min(70, lightness)}%)`;
  } else {
    // Neutral: gray (wider neutral range)
    return `hsl(0, 0%, 65%)`;
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