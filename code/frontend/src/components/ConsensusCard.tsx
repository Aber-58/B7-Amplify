import React from 'react';
import { motion } from 'framer-motion';
import { pop } from '../lib/motion';
import { clusterFill } from '../lib/colors';
import { Cluster } from '../store/clusterStore';

interface ConsensusCardProps {
  cluster: Cluster;
  onClose?: () => void;
}

export const ConsensusCard: React.FC<ConsensusCardProps> = ({ cluster, onClose }) => {
  const sentiment = cluster.sentiment_avg ?? 0;
  const sentimentPercentage = ((sentiment + 1) / 2) * 100; // Convert -1 to 1 range to 0-100%
  
  const representativeQuote = cluster.heading || cluster.raw_opinions[0]?.opinion || 'No quote available';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, rotateX: -15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className="pointer-events-auto rounded-xl bg-white/85 backdrop-blur-md p-4 shadow-card border border-ink/10 max-w-sm"
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-scribble text-lg text-ink">{cluster.heading || `Cluster ${cluster.cluster_id}`}</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-ink/50 hover:text-ink transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>

      <div className="mt-2 text-sm text-ink/70 line-clamp-4 mb-4">
        "{representativeQuote}"
      </div>

      <div className="flex items-center gap-2 text-xs text-ink/60 mb-2">
        <span>{cluster.raw_opinions.length} opinions</span>
        {cluster.engagement !== undefined && (
          <span>• {cluster.engagement} engagement</span>
        )}
      </div>

      <div className="mt-3 h-2 w-full rounded-full bg-ink/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${sentimentPercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            background: clusterFill(sentiment),
          }}
        />
      </div>

      <div className="mt-2 text-xs text-ink/50 text-center">
        Sentiment: {sentiment.toFixed(2)}
      </div>
    </motion.div>
  );
};