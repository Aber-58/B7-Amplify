import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { getLiveView, getClusters, handleError } from "../../service/fetchService";
import { Navigation } from "../Navigation";
import { CloudMap } from "../../components/CloudMap";
import { ChatBox, Message } from "../../components/ChatBox";
import { Layout } from "../../components/Layout";
import { TimerProgress } from "../../components/TimerProgress";
import { ThankYouScreen } from "../../components/ThankYouScreen";
import { useClusterStore } from "../../store/clusterStore";
import { getWebSocketService } from "../../lib/ws";
import { calculateClusterSentiment, calculateTextSentiment } from "../../lib/sentiment";
import type { Cluster } from "../../store/clusterStore";

function Live() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { setClusters, clusters: clustersMap, setSelectedCluster, addBadge } = useClusterStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [topic, setTopic] = useState<string>("");
  const [previousClusterCount, setPreviousClusterCount] = useState(0);
  const [achievement, setAchievement] = useState<string | null>(null);
  const [liveStats, setLiveStats] = useState({ totalOpinions: 0, totalClusters: 0, activeParticipants: 0 });
  const [timer, setTimer] = useState<number | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  const [winner, setWinner] = useState<Cluster | null>(null);
  const achievementTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get clusters for current topic UUID
  const clusters = uuid ? (clustersMap[uuid] || []) : [];
  
  // Find biggest cluster (winner)
  const findWinner = useMemo(() => {
    if (clusters.length === 0) return null;
    return clusters.reduce((prev, current) => {
      const prevBaseOpinions = prev.raw_opinions?.length || 0;
      const prevMessageCount = messages.filter(m => m.clusterId === prev.cluster_id).length;
      const prevSize = prevBaseOpinions + prevMessageCount * 2;
      
      const currentBaseOpinions = current.raw_opinions?.length || 0;
      const currentMessageCount = messages.filter(m => m.clusterId === current.cluster_id).length;
      const currentSize = currentBaseOpinions + currentMessageCount * 2;
      
      return currentSize > prevSize ? current : prev;
    });
  }, [clusters, messages]);

  useEffect(() => {
    if (!uuid) return;

    // Fetch clusters
    getClusters(uuid)
      .then((data: any) => {
        // Transform backend clusters to match our Cluster interface
        const transformedClusters: Cluster[] = (data.clusters || []).map((c: any) => ({
          cluster_id: c.cluster_id,
          heading: c.heading || c.current_heading,
          leader_id: c.leader_id,
          raw_opinions: c.raw_opinions || [],
          sentiment_avg: c.sentiment_avg ?? calculateClusterSentiment(c.raw_opinions || []),
          engagement: c.engagement || c.raw_opinions?.length || 0,
          position2d: c.position2d || { x: Math.random(), y: Math.random() },
        }));
        if (uuid) {
          setClusters(uuid, transformedClusters);
          
          // Gamification: Check for achievements
          const newClusterCount = transformedClusters.length;
          if (newClusterCount > previousClusterCount && previousClusterCount > 0) {
            // Award badges based on cluster count
            if (newClusterCount >= 10 && previousClusterCount < 10) {
              setAchievement("🌟 Pattern Expert!");
              addBadge("Pattern Expert");
            } else if (newClusterCount >= 5 && previousClusterCount < 5) {
              setAchievement("🏆 Cluster Master!");
              addBadge("Cluster Master");
            } else if (newClusterCount >= 3 && previousClusterCount < 3) {
              setAchievement("🎯 First Clusters!");
              addBadge("First Clusters");
            } else {
              // Generic achievement for new cluster
              setAchievement("🎉 New Cluster Formed!");
            }
            
            if (achievementTimeoutRef.current) {
              clearTimeout(achievementTimeoutRef.current);
            }
            achievementTimeoutRef.current = setTimeout(() => setAchievement(null), 4000);
          }
          
          setPreviousClusterCount(newClusterCount);
          
          // Update live stats
          const totalOpinions = transformedClusters.reduce((sum, c) => sum + (c.raw_opinions?.length || 0), 0);
          setLiveStats({
            totalOpinions,
            totalClusters: newClusterCount,
            activeParticipants: Math.max(1, Math.floor(totalOpinions / 2)), // Estimate participants
          });
        }
      })
      .catch((error) => handleError(error, () => navigate(Navigation.ERROR)));

    // Fetch live view for topic and messages
    getLiveView(uuid)
      .then((data: any) => {
        if (data.problemTitle) setTopic(data.problemTitle);
        
        // Transform messages
        if (data.sortedMessages) {
          const chatMessages: Message[] = data.sortedMessages.map((msg: any) => ({
            text: msg.text,
            author: msg.author,
            timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
            sentiment: msg.sentiment,
            clusterId: msg.clusterId,
          }));
          setMessages(chatMessages);
        }
      })
      .catch((error) => {
        console.error("Error fetching live view:", error);
      });

    // Set up WebSocket connection
    try {
      const ws = getWebSocketService();
      ws.connect().then(() => {
        // Listen for cluster updates
        ws.on('cluster_update', (payload: any) => {
          // Update clusters when they change
          getClusters(uuid).then((data: any) => {
            const transformedClusters: Cluster[] = (data.clusters || []).map((c: any) => ({
              cluster_id: c.cluster_id,
              heading: c.heading || c.current_heading,
              leader_id: c.leader_id,
              raw_opinions: c.raw_opinions || [],
              sentiment_avg: c.sentiment_avg ?? calculateClusterSentiment(c.raw_opinions || []),
              engagement: c.engagement || c.raw_opinions?.length || 0,
              position2d: c.position2d || { x: Math.random(), y: Math.random() },
            }));
            if (uuid) {
              setClusters(uuid, transformedClusters);
              
              // Check for achievements on update
              const newClusterCount = transformedClusters.length;
              if (newClusterCount > previousClusterCount && previousClusterCount > 0) {
                // Achievement unlocked!
                setAchievement("🎉 New Cluster Formed!");
                setTimeout(() => setAchievement(null), 3000);
              }
              setPreviousClusterCount(newClusterCount);
              
              const totalOpinions = transformedClusters.reduce((sum, c) => sum + (c.raw_opinions?.length || 0), 0);
              setLiveStats({
                totalOpinions,
                totalClusters: newClusterCount,
                activeParticipants: Math.max(1, Math.floor(totalOpinions / 2)),
              });
            }
          });
        });

        // Listen for new messages
        ws.on('chat_message', (payload: any) => {
          setMessages((prev) => [
            ...prev,
            {
              text: payload.text,
              author: payload.author,
              timestamp: new Date(payload.timestamp || Date.now()),
              sentiment: payload.sentiment,
              clusterId: payload.clusterId,
            },
          ]);
        });
      }).catch((error: any) => {
        console.warn("WebSocket connection failed, using polling fallback:", error);
      });
    } catch (error: any) {
      console.warn("WebSocket not available:", error);
    }

    return () => {
      const ws = getWebSocketService();
      ws.disconnect();
      if (achievementTimeoutRef.current) {
        clearTimeout(achievementTimeoutRef.current);
      }
    };
  }, [uuid, navigate, setClusters, previousClusterCount, addBadge]);

  // Timer management
  useEffect(() => {
    // Check URL params for live round timer
    const urlParams = new URLSearchParams(window.location.search);
    const roundActive = urlParams.get('round') === 'active';
    
    if (roundActive) {
      // Start 45-second timer
      setTimer(45);
      
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev === null) return null;
          
          if (prev <= 1) {
            // Timer ended - show winner immediately
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
            }
            
            // Show winner after a brief delay
            setTimeout(() => {
              if (findWinner) {
                setWinner(findWinner);
                setShowWinner(true);
              }
            }, 500);
            
            return 0; // Keep at 0 to show timer ended
          }
          
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [uuid, findWinner]);
  
  // Removed annoying timer notifications

  const handleSendMessage = (text: string) => {
    // Calculate sentiment for the message
    const sentiment = calculateTextSentiment(text);
    
    // Find the best matching cluster for this message
    const bestCluster = clusters.length > 0 
      ? clusters.reduce((prev, current) => {
          // Simple similarity: check if message text contains cluster heading keywords
          const heading = current.heading || '';
          const headingWords = heading.toLowerCase().split(/\s+/);
          const messageWords = text.toLowerCase().split(/\s+/);
          const prevHeadingWords = (prev.heading || '').toLowerCase().split(/\s+/);
          
          const currentMatch = headingWords.filter(w => messageWords.includes(w)).length;
          const prevMatch = prevHeadingWords.filter(w => messageWords.includes(w)).length;
          
          return currentMatch > prevMatch ? current : prev;
        })
      : null;
    
    const newMessage: Message = {
      text,
      author: "You",
      timestamp: new Date(),
      sentiment,
      clusterId: bestCluster?.cluster_id,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  return (
    <Layout showHeader={true} showLegend={true}>
      <div className="max-w-7xl mx-auto p-6 space-y-6 relative">
        {/* Timer Progress Bar */}
        {timer !== null && timer >= 0 && (
          <TimerProgress current={timer} total={45} />
        )}

        {/* Thank You Screen */}
        <AnimatePresence>
          {showWinner && winner && (
            <ThankYouScreen
              winner={{
                heading: winner.heading || `Cluster ${winner.cluster_id}`,
                cluster_id: winner.cluster_id,
                totalEngagement: (winner.raw_opinions?.length || 0) + (messages.filter(m => m.clusterId === winner.cluster_id).length * 2),
                opinionsCount: winner.raw_opinions?.length || 0,
                messagesCount: messages.filter(m => m.clusterId === winner.cluster_id).length,
              }}
              onClose={() => {
                setShowWinner(false);
                setTimer(null);
              }}
            />
          )}
        </AnimatePresence>

        {/* Achievement Notification */}
        <AnimatePresence>
          {achievement && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: -50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: -50 }}
              className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
            >
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full shadow-2xl font-scribble text-2xl animate-bounce">
                {achievement}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gamification: Points & Achievements */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed top-4 left-4 z-40 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border-2 border-purple-200 p-3"
        >
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="font-display text-xs text-ink/60">Points</span>
              <span className="font-display font-bold text-2xl text-purple-600">
                {liveStats.totalOpinions * 10 + messages.length * 5}
              </span>
            </div>
            <div className="w-px h-8 bg-ink/20"></div>
            <div className="flex flex-col">
              <span className="font-display text-xs text-ink/60">Streak</span>
              <span className="font-display font-bold text-xl text-pink-600">
                {messages.length > 5 ? '🔥' : messages.length > 2 ? '⭐' : '✨'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Topic Title */}
        {topic && (
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-scribble text-4xl text-ink font-bold text-center"
          >
            {topic}
          </motion.h1>
        )}

        {/* Live Stats Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border-2 border-ink/20 shadow-card"
        >
          <div className="flex items-center justify-around text-center">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-purple-600 font-scribble">{liveStats.totalClusters}</span>
              <span className="text-sm text-ink/70 font-display">Clusters</span>
            </div>
            <div className="w-px h-12 bg-ink/20"></div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-blue-600 font-scribble">{liveStats.totalOpinions}</span>
              <span className="text-sm text-ink/70 font-display">Opinions</span>
            </div>
            <div className="w-px h-12 bg-ink/20"></div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-green-600 font-scribble">{liveStats.activeParticipants}</span>
              <span className="text-sm text-ink/70 font-display">Active</span>
            </div>
          </div>
        </motion.div>

        {/* CloudMap visualization - takes large proportion */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border-2 border-ink/20 shadow-card relative overflow-hidden"
          style={{ minHeight: '70vh' }}
        >
          {clusters.length > 0 ? (
            <CloudMap
              clusters={clusters}
              messages={messages}
              width={1200}
              height={700}
              onClusterClick={setSelectedCluster}
            />
          ) : (
            <div className="h-[700px] flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-4"
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="text-6xl"
                >
                  🌀
                </motion.div>
                <p className="font-display text-2xl text-ink/60 font-semibold">
                  Gathering thoughts...
                </p>
                <p className="font-display text-sm text-ink/40">
                  Your ideas are coming together!
                </p>
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* ChatBox - smaller now since CloudMap is larger */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-[300px]"
        >
          <ChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            currentUsername="You"
            activeUsers={liveStats.activeParticipants}
          />
        </motion.div>
      </div>
    </Layout>
  );
}

export default Live;
