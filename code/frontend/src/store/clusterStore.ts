import { create } from 'zustand';

/**
 * Cluster data structure
 */
export interface Cluster {
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
 * Opinion data structure
 */
export interface Opinion {
  opinion: string;
  weight: number;
  username: string;
}

/**
 * Global state for clusters, opinions, and UI preferences
 */
interface ClusterStore {
  // Clusters data keyed by topic UUID
  clusters: Record<string, Cluster[]>;
  
  // Opinions data keyed by topic UUID
  opinions: Record<string, Opinion[]>;
  
  // Selected cluster for detail view
  selectedCluster: Cluster | null;
  
  // Selected topic UUID
  selectedTopicUuid: string | null;
  
  // Badges earned by user
  badges: string[];
  
  // Mute toggle for sound effects
  muted: boolean;
  
  // Actions
  setClusters: (topicUuid: string, clusters: Cluster[]) => void;
  setOpinions: (topicUuid: string, opinions: Opinion[]) => void;
  updateCluster: (topicUuid: string, clusterId: number, updates: Partial<Cluster>) => void;
  setSelectedCluster: (cluster: Cluster | null) => void;
  setSelectedTopicUuid: (uuid: string | null) => void;
  addBadge: (badge: string) => void;
  toggleMute: () => void;
  reset: () => void;
}

export const useClusterStore = create<ClusterStore>((set) => ({
  // Initial state
  clusters: {},
  opinions: {},
  selectedCluster: null,
  selectedTopicUuid: null,
  badges: [],
  muted: false,

  // Actions
  setClusters: (topicUuid: string, clusters: Cluster[]) =>
    set((state) => ({
      clusters: { ...state.clusters, [topicUuid]: clusters },
    })),

  setOpinions: (topicUuid: string, opinions: Opinion[]) =>
    set((state) => ({
      opinions: { ...state.opinions, [topicUuid]: opinions },
    })),

  updateCluster: (topicUuid: string, clusterId: number, updates: Partial<Cluster>) =>
    set((state) => {
      const topicClusters = state.clusters[topicUuid] || [];
      const updatedClusters = topicClusters.map((cluster) =>
        cluster.cluster_id === clusterId ? { ...cluster, ...updates } : cluster
      );
      return {
        clusters: { ...state.clusters, [topicUuid]: updatedClusters },
      };
    }),

  setSelectedCluster: (cluster: Cluster | null) =>
    set({ selectedCluster: cluster }),

  setSelectedTopicUuid: (uuid: string | null) =>
    set({ selectedTopicUuid: uuid }),

  addBadge: (badge: string) =>
    set((state) => ({
      badges: [...state.badges, badge],
    })),

  toggleMute: () =>
    set((state) => ({ muted: !state.muted })),

  reset: () =>
    set({
      clusters: {},
      opinions: {},
      selectedCluster: null,
      selectedTopicUuid: null,
      badges: [],
      muted: false,
    }),
}));