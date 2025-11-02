import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import rough from 'roughjs/bundled/rough.esm.js';
import * as d3 from 'd3-force';
import { Cluster } from '../store/clusterStore';
import { ConsensusCard } from './ConsensusCard';
import { clusterFill, clusterStroke } from '../lib/colors';
import { prefersReducedMotion, getReducedMotionVariants } from '../lib/motion';

interface CloudMapProps {
  clusters: Cluster[];
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
}

export const CloudMap: React.FC<CloudMapProps> = ({ 
  clusters, 
  width = 800, 
  height = 500,
  onClusterClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const rcRef = useRef<any>(null);
  const [hoveredCluster, setHoveredCluster] = useState<Cluster | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [nodes, setNodes] = useState<ClusterNode[]>([]);
  const simulationRef = useRef<d3.Simulation<ClusterNode> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const roughElementsRef = useRef<Map<number, any>>(new Map());

  // Initialize RoughJS
  useEffect(() => {
    if (svgRef.current && !rcRef.current) {
      rcRef.current = rough.svg(svgRef.current);
    }
  }, []);

  // Calculate keyword frequency for cluster (how often topics/keywords are mentioned)
  const calculateKeywordFrequency = (cluster: Cluster): number => {
    if (!cluster.raw_opinions || cluster.raw_opinions.length === 0) return 1;
    
    // Count total mentions (all opinions in cluster)
    const totalMentions = cluster.raw_opinions.length;
    
    // Also count keyword frequency in opinion texts
    const keywordCount: { [key: string]: number } = {};
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'we', 'should', 'need', 'can', 'will', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did']);
    
    cluster.raw_opinions.forEach((op: any) => {
      const text = (op.opinion || op || '').toLowerCase();
      const words = text
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((word: string) => word.length > 3 && !stopWords.has(word));
      
      words.forEach((word: string) => {
        keywordCount[word] = (keywordCount[word] || 0) + 1;
      });
    });
    
    // Calculate frequency score: base on mentions + top keyword frequency
    const topKeywordFreq = Math.max(...Object.values(keywordCount), 1);
    const frequencyScore = totalMentions * 2 + topKeywordFreq;
    
    return frequencyScore;
  };

  // Calculate cluster radius from keyword frequency
  const getClusterRadius = (cluster: Cluster): number => {
    const baseRadius = 25;
    const frequency = calculateKeywordFrequency(cluster);
    // Normalize frequency (assume max frequency around 50)
    const frequencyFactor = Math.sqrt(Math.min(frequency / 10, 5));
    // Minimum radius 20, maximum around 80
    return Math.max(20, Math.min(80, baseRadius * (1 + frequencyFactor)));
  };

  // Initialize nodes from clusters
  const initializedNodes = useMemo(() => {
    return clusters.map((cluster, i) => {
      const radius = getClusterRadius(cluster);
      // Use position2d if available, otherwise spread randomly
      const x = cluster.position2d ? cluster.position2d.x * width : (i % 4) * (width / 4) + width / 8;
      const y = cluster.position2d ? cluster.position2d.y * height : Math.floor(i / 4) * (height / 3) + height / 6;
      
      return {
        cluster,
        x,
        y,
        r: radius,
        id: cluster.cluster_id,
      };
    });
  }, [clusters, width, height]);

  // Setup d3-force simulation
  useEffect(() => {
    if (!clusters.length || initializedNodes.length === 0) return;

    const nodes = initializedNodes.map(n => ({ ...n }));
    
    // Create force simulation
    const simulation = d3.forceSimulation<ClusterNode>(nodes)
      .force('charge', d3.forceManyBody().strength(-50))
      .force('collide', d3.forceCollide<ClusterNode>().radius((d: ClusterNode) => d.r + 8))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05))
      .alphaDecay(0.05)
      .velocityDecay(0.6);

    simulationRef.current = simulation;

    // Update nodes on tick (only if not reduced motion)
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
      // For reduced motion, just set initial positions
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

  // Draw rough circles for clusters
  useEffect(() => {
    if (!svgRef.current || !rcRef.current || nodes.length === 0) return;

    // Clear previous rough elements
    roughElementsRef.current.forEach((el) => el.remove());
    roughElementsRef.current.clear();

    nodes.forEach((node) => {
      const sentiment = node.cluster.sentiment_avg ?? 0;
      const fillColor = clusterFill(sentiment);
      const strokeColor = clusterStroke(sentiment);

      // Create rough circle
      const circle = rcRef.current.circle(node.x, node.y, node.r * 2, {
        fill: fillColor,
        fillStyle: 'solid',
        stroke: strokeColor,
        strokeWidth: 2,
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
  }, [nodes]);

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
          const sentiment = node.cluster.sentiment_avg ?? 0;
          
          return (
            <g key={node.id}>
              {/* Label background */}
              <motion.text
                x={node.x}
                y={node.y + node.r + 20}
                textAnchor="middle"
                className="font-scribble text-sm pointer-events-none"
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
      </svg>

      {/* Invisible hover areas for interactivity */}
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