/**
 * Mock data for development and offline testing
 */

export interface MockCluster {
  cluster_id: number;
  heading: string;
  leader_id: string;
  raw_opinions: Array<{
    raw_id: number;
    username: string;
    opinion: string;
    weight: number;
  }>;
  sentiment_avg?: number;
  engagement?: number;
  position2d?: { x: number; y: number };
}

/**
 * Generate mock clusters for testing
 */
export const generateMockClusters = (count: number = 5): MockCluster[] => {
  const clusters: MockCluster[] = [];
  
  const sampleOpinions = [
    'We should implement more sustainable practices',
    'The current process is too slow',
    'I love the new design direction',
    'We need better communication channels',
    'The team collaboration is excellent',
    'Budget constraints are limiting our options',
    'Technology stack needs updating',
    'Customer feedback has been positive',
    'Work-life balance needs improvement',
    'The proposal looks promising',
  ];
  
  for (let i = 0; i < count; i++) {
    const opinionCount = Math.floor(Math.random() * 3) + 2; // 2-4 opinions per cluster
    const rawOpinions = [];
    
    for (let j = 0; j < opinionCount; j++) {
      rawOpinions.push({
        raw_id: i * 10 + j,
        username: `User${i * 10 + j}`,
        opinion: sampleOpinions[(i * 10 + j) % sampleOpinions.length],
        weight: Math.floor(Math.random() * 10) + 1,
      });
    }
    
    const sentiment = (Math.random() * 2) - 1; // -1 to 1
    const engagement = Math.floor(Math.random() * 100);
    
    clusters.push({
      cluster_id: i + 1,
      heading: `Cluster ${i + 1}: ${rawOpinions[0].opinion.substring(0, 40)}...`,
      leader_id: `User${i * 10}`,
      raw_opinions: rawOpinions,
      sentiment_avg: sentiment,
      engagement: engagement,
      position2d: {
        x: Math.random(),
        y: Math.random(),
      },
    });
  }
  
  return clusters;
};

/**
 * Mock topic data
 */
export const mockTopicData = {
  topic: 'How can we improve team collaboration?',
  state: 'live',
  username: 'admin',
};