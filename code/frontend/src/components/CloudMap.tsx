import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import rough from 'roughjs/bundled/rough.esm.js';
import * as d3 from 'd3-force';
import { Cluster } from '../store/clusterStore';
import { ConsensusCard } from './ConsensusCard';
import { clusterFill, clusterStroke, sentimentColors, sentimentLabel } from '../lib/colors';
import { calculateTextSentiment } from '../lib/sentiment';
import { prefersReducedMotion } from '../lib/motion';
import type { Message } from './ChatBox';

interface CloudMapProps {
  clusters: Cluster[];
  messages?: Message[];
  width?: number;
  height?: number;
  onClusterClick?: (cluster: Cluster) => void;
}

interface ClusterNode {
  cluster: Cluster;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  r: number;
  id: number;
  messageCount: number; // Track messages for dynamic growth
}

interface MessageBubble {
  message: Message;
  x: number;
  y: number;
  targetClusterId: number;
  targetX: number;
  targetY: number;
  id: string;
  isInhaling: boolean;
}

// Simple text similarity (cosine similarity approximation)
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1Array = text1.toLowerCase().split(/\s+/);
  const words2Array = text2.toLowerCase().split(/\s+/);
  const words1 = new Set(words1Array);
  const words2 = new Set(words2Array);
  const intersection = new Set(words1Array.filter(w => words2.has(w)));
  const union = new Set([...words1Array, ...words2Array]);
  return intersection.size / union.size;
}

export const CloudMap: React.FC<CloudMapProps> = ({ 
  clusters, 
  messages = [],
  width = 1200, 
  height = 700,
  onClusterClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const rcRef = useRef<any>(null);
  const [hoveredCluster, setHoveredCluster] = useState<Cluster | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [nodes, setNodes] = useState<ClusterNode[]>([]);
  const [messageBubbles, setMessageBubbles] = useState<MessageBubble[]>([]);
  const [shakingClusters, setShakingClusters] = useState<Set<number>>(new Set());
  const simulationRef = useRef<d3.Simulation<ClusterNode> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const roughElementsRef = useRef<Map<number, any>>(new Map());
  const processedMessagesRef = useRef<Set<string>>(new Set());
  const clusterMessageCountsRef = useRef<Map<number, number>>(new Map());

  // Initialize RoughJS
  useEffect(() => {
    if (svgRef.current && !rcRef.current) {
      rcRef.current = rough.svg(svgRef.current);
    }
  }, []);

  // Calculate keyword frequency for cluster
  const calculateKeywordFrequency = (cluster: Cluster, messageCount: number = 0): number => {
    const baseMentions = cluster.raw_opinions?.length || 0;
    const totalMentions = baseMentions + messageCount;
    
    if (totalMentions === 0) return 1;
    
    const keywordCount: { [key: string]: number } = {};
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'we', 'should', 'need', 'can', 'will', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did']);
    
    cluster.raw_opinions?.forEach((op: any) => {
      const text = (op.opinion || op || '').toLowerCase();
      const words = text
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((word: string) => word.length > 3 && !stopWords.has(word));
      
      words.forEach((word: string) => {
        keywordCount[word] = (keywordCount[word] || 0) + 1;
      });
    });
    
    const topKeywordFreq = Math.max(...Object.values(keywordCount), 1);
    return totalMentions * 2 + topKeywordFreq;
  };

  // Find best matching cluster for a message
  const findBestMatchingCluster = (messageText: string, clusters: Cluster[]): Cluster | null => {
    if (clusters.length === 0) return null;
    
    let bestMatch: Cluster | null = null;
    let bestScore = 0;
    
    clusters.forEach(cluster => {
      // Check similarity with cluster heading
      const headingSimilarity = cluster.heading ? calculateTextSimilarity(messageText, cluster.heading) : 0;
      
      // Check similarity with raw opinions in cluster
      let maxOpinionSimilarity = 0;
      cluster.raw_opinions?.forEach((op: any) => {
        const opinionText = op.opinion || op || '';
        const similarity = calculateTextSimilarity(messageText, opinionText);
        maxOpinionSimilarity = Math.max(maxOpinionSimilarity, similarity);
      });
      
      const totalScore = headingSimilarity * 0.6 + maxOpinionSimilarity * 0.4;
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestMatch = cluster;
      }
    });
    
    // If no good match, assign to cluster with least messages (to spread them out)
    if (bestScore < 0.1) {
      const messageCounts = clusters.map(c => clusterMessageCountsRef.current.get(c.cluster_id) || 0);
      const minCount = Math.min(...messageCounts);
      bestMatch = clusters.find(c => (clusterMessageCountsRef.current.get(c.cluster_id) || 0) === minCount) || clusters[0];
    }
    
    return bestMatch;
  };

  // Track cluster messages for sentiment calculation
  const clusterMessagesRef = useRef<Map<number, Message[]>>(new Map());

  // Process new messages and create bubbles
  useEffect(() => {
    if (!messages.length || !nodes.length) return;

    const newBubbles: MessageBubble[] = [];
    
    messages.forEach((message, index) => {
      const messageId = `${message.author}-${message.timestamp.getTime()}-${index}`;
      
      // Skip if already processed
      if (processedMessagesRef.current.has(messageId)) return;
      processedMessagesRef.current.add(messageId);
      
      // Find best matching cluster
      const bestCluster = findBestMatchingCluster(message.text, clusters);
      if (!bestCluster) return;
      
      const clusterNode = nodes.find(n => n.cluster.cluster_id === bestCluster.cluster_id);
      if (!clusterNode) return;
      
      // Start message at random position
      const startX = Math.random() * width;
      const startY = Math.random() * height;
      
      newBubbles.push({
        message,
        x: startX,
        y: startY,
        targetClusterId: bestCluster.cluster_id,
        targetX: clusterNode.x,
        targetY: clusterNode.y,
        id: messageId,
        isInhaling: false,
      });
      
      // Increment message count for cluster and store message
      const currentCount = clusterMessageCountsRef.current.get(bestCluster.cluster_id) || 0;
      clusterMessageCountsRef.current.set(bestCluster.cluster_id, currentCount + 1);
      
      // Store message for sentiment calculation
      const clusterMessages = clusterMessagesRef.current.get(bestCluster.cluster_id) || [];
      clusterMessagesRef.current.set(bestCluster.cluster_id, [...clusterMessages, message]);
    });
    
    if (newBubbles.length > 0) {
      setMessageBubbles(prev => [...prev, ...newBubbles]);
      
      // Start inhalation animation after a short delay
      setTimeout(() => {
        setMessageBubbles(prev => 
          prev.map(bubble => ({
            ...bubble,
            isInhaling: true,
          }))
        );
        
        // Remove bubbles after animation and update cluster size and sentiment
        setTimeout(() => {
          setMessageBubbles(prev => prev.filter(b => !newBubbles.some(nb => nb.id === b.id)));
          
          // Update node radii and recalculate sentiment - ONLY for clusters that received messages
          const affectedClusterIds = new Set(newBubbles.map(b => b.targetClusterId));
          
          // Add shake effect to affected clusters
          setShakingClusters(new Set(affectedClusterIds));
          setTimeout(() => {
            setShakingClusters(new Set());
          }, 1000);
          
          setNodes(prev => prev.map(node => {
            // Only update clusters that received messages
            if (!affectedClusterIds.has(node.cluster.cluster_id)) {
              return node; // Return unchanged if no messages
            }
            
            const messageCount = clusterMessageCountsRef.current.get(node.cluster.cluster_id) || 0;
            const clusterMessages = clusterMessagesRef.current.get(node.cluster.cluster_id) || [];
            const newFrequency = calculateKeywordFrequency(node.cluster, messageCount);
            const frequencyFactor = Math.sqrt(Math.min(newFrequency / 10, 5));
            const newRadius = Math.max(20, Math.min(100, 25 * (1 + frequencyFactor)));
            
            // Recalculate sentiment including messages (only for affected clusters)
            const allSentiments: number[] = [];
            
            // Add sentiments from raw opinions
            node.cluster.raw_opinions?.forEach((op: any) => {
              const opinionText = op.opinion || op || '';
              allSentiments.push(calculateTextSentiment(opinionText));
            });
            
            // Add sentiments from messages
            clusterMessages.forEach(msg => {
              const msgSentiment = msg.sentiment ?? calculateTextSentiment(msg.text);
              allSentiments.push(msgSentiment);
            });
            
            // Calculate average sentiment
            let sentiment = node.cluster.sentiment_avg ?? 0;
            if (allSentiments.length > 0) {
              sentiment = allSentiments.reduce((a, b) => a + b, 0) / allSentiments.length;
            }
            
            return {
              ...node,
              r: newRadius, // New size - will trigger redraw
              messageCount,
              cluster: {
                ...node.cluster,
                sentiment_avg: sentiment, // Updated sentiment - will change color
              },
            };
          }));
        }, 1500);
      }, 1000);
    }
  }, [messages, nodes, clusters, width, height]);

  // Calculate cluster radius from keyword frequency and messages
  const getClusterRadius = (cluster: Cluster, messageCount: number = 0): number => {
    const baseRadius = 25;
    const frequency = calculateKeywordFrequency(cluster, messageCount);
    const frequencyFactor = Math.sqrt(Math.min(frequency / 10, 5));
    return Math.max(20, Math.min(100, baseRadius * (1 + frequencyFactor)));
  };

  // Initialize nodes from clusters - updates when clusters or messages change
  const initializedNodes = useMemo(() => {
    return clusters.map((cluster, i) => {
      // Count messages for this cluster
      const clusterMessages = messages.filter(m => m.clusterId === cluster.cluster_id);
      const messageCount = clusterMessages.length;
      clusterMessageCountsRef.current.set(cluster.cluster_id, messageCount);
      
      // Store messages for sentiment calculation
      clusterMessagesRef.current.set(cluster.cluster_id, clusterMessages);
      
      const radius = getClusterRadius(cluster, messageCount);
      const x = cluster.position2d ? cluster.position2d.x * width : (i % 4) * (width / 4) + width / 8;
      const y = cluster.position2d ? cluster.position2d.y * height : Math.floor(i / 4) * (height / 3) + height / 6;
      
      return {
        cluster,
        x,
        y,
        r: radius,
        id: cluster.cluster_id,
        messageCount,
      };
    });
  }, [clusters, messages, width, height]);

  // Setup d3-force simulation
  useEffect(() => {
    if (!clusters.length || initializedNodes.length === 0) return;

    const nodes = initializedNodes.map(n => ({ ...n }));
    
    const simulation = d3.forceSimulation<ClusterNode>(nodes)
      .force('charge', d3.forceManyBody().strength(-50))
      .force('collide', d3.forceCollide<ClusterNode>().radius((d: ClusterNode) => d.r + 8))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05))
      .alphaDecay(0.05)
      .velocityDecay(0.6);

    simulationRef.current = simulation;

    if (!prefersReducedMotion()) {
      const updateNodes = () => {
        const currentNodes = simulation.nodes() as ClusterNode[];
        setNodes([...currentNodes]);
        if (animationFrameRef.current) {
          animationFrameRef.current = requestAnimationFrame(updateNodes);
        }
      };

      simulation.on('tick', () => {
        if (!animationFrameRef.current) {
          animationFrameRef.current = requestAnimationFrame(updateNodes);
        }
      });
    } else {
      simulation.stop();
      setNodes(nodes);
    }

    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [initializedNodes, width, height]);

  // Update simulation when nodes change size
  useEffect(() => {
    if (simulationRef.current && nodes.length > 0) {
      simulationRef.current.force('collide', d3.forceCollide<ClusterNode>().radius((d: ClusterNode) => d.r + 8));
      // Restart simulation with new node sizes
      (simulationRef.current as any).alphaTarget(0.3);
      simulationRef.current.restart();
    }
  }, [nodes]);

  // Draw rough circles for clusters - updates when nodes change (size or sentiment)
  useEffect(() => {
    if (!svgRef.current || !rcRef.current || nodes.length === 0) return;

    roughElementsRef.current.forEach((el) => el.remove());
    roughElementsRef.current.clear();

    nodes.forEach((node) => {
      // Calculate sentiment from cluster data and messages (always recalculate to include new messages)
      const allSentiments: number[] = [];
      
      // Add sentiments from raw opinions
      if (node.cluster.raw_opinions && node.cluster.raw_opinions.length > 0) {
        node.cluster.raw_opinions.forEach((op: any) => {
          const opinionText = op.opinion || op || '';
          allSentiments.push(calculateTextSentiment(opinionText));
        });
      }
      
      // Add sentiments from messages that joined this cluster
      const clusterMessages = clusterMessagesRef.current.get(node.cluster.cluster_id) || [];
      clusterMessages.forEach(msg => {
        const msgSentiment = msg.sentiment ?? calculateTextSentiment(msg.text);
        allSentiments.push(msgSentiment);
      });
      
      // Calculate average sentiment (always recalculate to include new messages)
      let sentiment = node.cluster.sentiment_avg ?? 0;
      if (allSentiments.length > 0) {
        sentiment = allSentiments.reduce((a: number, b: number) => a + b, 0) / allSentiments.length;
      }
      
      const fillColor = clusterFill(sentiment);
      const strokeColor = clusterStroke(sentiment);

      // Draw circle with current radius (grows dynamically)
      const circle = rcRef.current.circle(node.x, node.y, node.r * 2, {
        fill: fillColor,
        fillStyle: 'solid',
        stroke: strokeColor,
        strokeWidth: 3,
        roughness: 1.5,
        bowing: 3,
      });

      if (svgRef.current && circle) {
        svgRef.current.appendChild(circle);
        roughElementsRef.current.set(node.id, circle);
      }
    });

    return () => {
      roughElementsRef.current.forEach((el) => {
        try {
          el.remove();
        } catch (e) {
          // Element may have been removed already
        }
      });
      roughElementsRef.current.clear();
    };
  }, [nodes, messages]); // Include messages to recalculate sentiment when messages change

  const handleClusterHover = (cluster: Cluster | null) => {
    setHoveredCluster(cluster);
  };

  const handleClusterClick = (cluster: Cluster) => {
    setSelectedCluster(selectedCluster?.cluster_id === cluster.cluster_id ? null : cluster);
    if (onClusterClick) {
      onClusterClick(cluster);
    }
  };

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Cluster labels */}
        {nodes.map((node) => {
          const isHovered = hoveredCluster?.cluster_id === node.cluster.cluster_id;
          
          return (
            <g key={node.id}>
              <motion.text
                x={node.x}
                y={node.y + node.r + 20}
                textAnchor="middle"
                className="font-display text-sm pointer-events-none font-semibold"
                fill="#1F2937"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: isHovered ? 1 : 0.7,
                  scale: isHovered ? 1.1 : 1,
                }}
                transition={{ duration: 0.2 }}
                style={{ 
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                }}
              >
                {node.cluster.heading || `Cluster ${node.cluster.cluster_id}`}
              </motion.text>
            </g>
          );
        })}

        {/* Message bubbles */}
        <AnimatePresence>
          {messageBubbles.map((bubble) => {
            const sentiment = bubble.message.sentiment ?? calculateTextSentiment(bubble.message.text);
            const label = sentimentLabel(sentiment);
            const sentimentColor = sentimentColors[label];
            
            return (
              <motion.g
                key={bubble.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ 
                  opacity: 1,
                  scale: bubble.isInhaling ? 0.3 : 1,
                  x: bubble.isInhaling ? bubble.targetX - bubble.x : 0,
                  y: bubble.isInhaling ? bubble.targetY - bubble.y : 0,
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ 
                  duration: bubble.isInhaling ? 1.5 : 0.3,
                  ease: bubble.isInhaling ? "easeIn" : "easeOut"
                }}
              >
                {/* Message bubble circle */}
                <circle
                  cx={bubble.x}
                  cy={bubble.y}
                  r={bubble.isInhaling ? 8 : 15}
                  fill={sentimentColor}
                  opacity={0.8}
                  stroke="white"
                  strokeWidth={2}
                />
                
                {/* Message text (only show when not inhaling) */}
                {!bubble.isInhaling && (
                  <motion.text
                    x={bubble.x}
                    y={bubble.y + 5}
                    textAnchor="middle"
                    className="font-display text-xs pointer-events-none font-medium"
                    fill="white"
                    textLength="60px"
                    lengthAdjust="spacingAndGlyphs"
                    style={{ 
                      filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))',
                    }}
                  >
                    {bubble.message.text.length > 15 
                      ? bubble.message.text.substring(0, 12) + '...'
                      : bubble.message.text}
                  </motion.text>
                )}
              </motion.g>
            );
          })}
        </AnimatePresence>
      </svg>

      {/* Invisible hover areas */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="xMidYMid meet"
        style={{ pointerEvents: 'auto' }}
      >
        {nodes.map((node) => (
          <circle
            key={node.id}
            cx={node.x}
            cy={node.y}
            r={node.r + 5}
            fill="transparent"
            className="cursor-pointer"
            onMouseEnter={() => handleClusterHover(node.cluster)}
            onMouseLeave={() => handleClusterHover(null)}
            onClick={() => handleClusterClick(node.cluster)}
            style={{ pointerEvents: 'auto' }}
          />
        ))}
      </svg>

      {/* Consensus Card on hover/click */}
      <AnimatePresence>
        {(hoveredCluster || selectedCluster) && (
          <div className="absolute top-4 left-4 z-10">
            <ConsensusCard
              cluster={hoveredCluster || selectedCluster!}
              onClose={() => {
                setSelectedCluster(null);
                setHoveredCluster(null);
              }}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
