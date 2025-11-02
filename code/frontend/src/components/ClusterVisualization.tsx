import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ClusterVisualizationProps {
    cluster: any;
    clusterIndex: number;
    color: string;
}

export const ClusterVisualization: React.FC<ClusterVisualizationProps> = ({ 
    cluster, 
    clusterIndex,
    color 
}) => {
    // Extract and count keywords from opinions
    const keywordData = useMemo(() => {
        if (!cluster.raw_opinions || cluster.raw_opinions.length === 0) {
            return [];
        }

        const wordCount: { [key: string]: number } = {};
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'we', 'should', 'need', 'can', 'will', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did']);

        cluster.raw_opinions.forEach((opinion: any) => {
            const text = (opinion.opinion || opinion).toLowerCase();
            const words = text
                .replace(/[^\w\s]/g, ' ')
                .split(/\s+/)
                .filter((word: string) => word.length > 3 && !stopWords.has(word));

            words.forEach((word: string) => {
                wordCount[word] = (wordCount[word] || 0) + 1;
            });
        });

        // Get top keywords, sorted by frequency
        const keywords = Object.entries(wordCount)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 15) // Top 15 keywords
            .map(([word, count]) => ({ word, count: count as number }));

        // Calculate relative sizes (normalize between 0.8 and 2.0)
        const maxCount = keywords[0]?.count || 1;
        const minCount = keywords[keywords.length - 1]?.count || 1;
        const sizeRange = 2.0 - 0.8;

        return keywords.map(({ word, count }) => ({
            word,
            count,
            size: 0.8 + (sizeRange * (count - minCount) / Math.max(1, maxCount - minCount))
        }));
    }, [cluster.raw_opinions]);

    // Generate positions in a cloud-like pattern
    const positions = useMemo(() => {
        const centerX = 50;
        const centerY = 50;
        const radius = 35;
        const angleStep = (2 * Math.PI) / keywordData.length;

        return keywordData.map((_, index) => {
            // Spiral pattern for word cloud
            const angle = angleStep * index + (index * 0.3); // Add some spiral
            const distance = radius * (0.6 + (index % 3) * 0.2); // Vary distance
            const x = centerX + distance * Math.cos(angle);
            const y = centerY + distance * Math.sin(angle);
            
            return { x, y };
        });
    }, [keywordData.length]);

    if (keywordData.length === 0) {
        return (
            <div className="text-center py-8 text-ink/40 font-display text-sm">
                No keywords to visualize
            </div>
        );
    }

    return (
        <div className="relative w-full h-64 bg-gradient-to-br from-paper via-accent/5 to-paper rounded-lg border border-accent/20 overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, ${color} 1px, transparent 0)`,
                backgroundSize: '20px 20px'
            }} />
            
            {/* Word Cloud */}
            <div className="relative w-full h-full" style={{ position: 'relative' }}>
                {keywordData.map(({ word, count, size }, index) => {
                    const { x, y } = positions[index];
                    const opacity = 0.7 + (count / keywordData[0]?.count) * 0.3;
                    
                    return (
                        <motion.div
                            key={word}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ 
                                opacity, 
                                scale: 1,
                                x: `${x}%`,
                                y: `${y}%`
                            }}
                            transition={{ 
                                delay: index * 0.05,
                                type: "spring",
                                stiffness: 100,
                                damping: 10
                            }}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2"
                            style={{
                                left: `${x}%`,
                                top: `${y}%`,
                                color: color,
                                fontSize: `${size * 0.75}rem`,
                                fontWeight: count >= 3 ? 'bold' : 'normal',
                            }}
                            title={`${word} (${count} times)`}
                            whileHover={{ 
                                scale: 1.2,
                                opacity: 1,
                                zIndex: 10
                            }}
                        >
                            {word}
                        </motion.div>
                    );
                })}
            </div>

            {/* Legend/Info */}
            <div className="absolute bottom-2 left-2 right-2 bg-white/80 backdrop-blur-sm rounded px-3 py-2 border border-ink/10">
                <div className="flex items-center justify-between text-xs font-display">
                    <span className="text-ink/70">
                        Key themes: <span className="font-semibold text-ink">{keywordData.length} words</span>
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            <span className="text-[0.6rem]">Small</span>
                            <div className="w-8 h-3 bg-gradient-to-r from-accent/30 to-accent rounded"></div>
                            <span className="text-[0.6rem]">Large</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

