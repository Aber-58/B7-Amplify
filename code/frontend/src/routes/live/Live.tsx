import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { getLiveView, getClusters, handleError } from "../../service/fetchService";
import { Navigation } from "../Navigation";
import { CloudMap } from "../../components/CloudMap";
import { ChatBox, Message } from "../../components/ChatBox";
import { Layout } from "../../components/Layout";
import { useClusterStore } from "../../store/clusterStore";
import { getWebSocketService } from "../../lib/ws";
import { calculateClusterSentiment } from "../../lib/sentiment";
import type { Cluster } from "../../store/clusterStore";

// Fun encouraging messages
const ENCOURAGING_MESSAGES = [
  "🎉 Amazing! Your ideas are clustering!",
  "✨ Magic is happening!",
  "🚀 Clusters forming! Keep it going!",
  "💫 Brilliant minds think together!",
  "🎯 Patterns emerging!",
  "🌟 Collective intelligence in action!",
  "🔥 Things are heating up!",
  "💡 Ideas connecting like neurons!",
  "🎨 Beautiful patterns forming!",
  "⚡ Energy building up!",
];

// Funny messages for timer urgency
const TIMER_URGENCY_MESSAGES = [
  "⚡ Time is running out! Share your thoughts now!",
  "🔥 The round is ending soon! Don't miss out!",
  "⏰ Hurry up! Only {time}s left!",
  "🎯 Last chance! Speak up before it's too late!",
  "💨 Quick! The clock is ticking!",
  "🚀 Final moments! Make your voice heard!",
];

function Live() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { setClusters, clusters: clustersMap, setSelectedCluster, addBadge } = useClusterStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [topic, setTopic] = useState<string>("");
  const [previousClusterCount, setPreviousClusterCount] = useState(0);
  const [achievement, setAchievement] = useState<string | null>(null);
  const [encouragingMessage, setEncouragingMessage] = useState<string>("");
  const [liveStats, setLiveStats] = useState({ totalOpinions: 0, totalClusters: 0, activeParticipants: 0 });
  const [timer, setTimer] = useState<number | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  const [winner, setWinner] = useState<Cluster | null>(null);
  const achievementTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get clusters for current topic UUID
  const clusters = uuid ? (clustersMap[uuid] || []) : [];
  
  // Calculate cluster size (helper function)
  const calculateClusterSize = (cluster: Cluster): number => {
    const baseOpinions = cluster.raw_opinions?.length || 0;
    const messageCount = messages.filter(m => m.clusterId === cluster.cluster_id).length;
    return baseOpinions + messageCount * 2; // Messages count more
  };
  
  // Find biggest cluster (winner)
  const findWinner = useMemo(() => {
    if (clusters.length === 0) return null;
    return clusters.reduce((prev, current) => {
      const prevSize = calculateClusterSize(prev);
      const currentSize = calculateClusterSize(current);
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
            // Clusters increased - celebrate!
            const randomMessage = ENCOURAGING_MESSAGES[Math.floor(Math.random() * ENCOURAGING_MESSAGES.length)];
            setEncouragingMessage(randomMessage);
            setTimeout(() => setEncouragingMessage(""), 3000);
            
            // Award badges based on cluster count
            if (newClusterCount >= 5 && previousClusterCount < 5) {
              setAchievement("🏆 Cluster Master!");
              addBadge("Cluster Master");
            } else if (newClusterCount >= 10 && previousClusterCount < 10) {
              setAchievement("🌟 Pattern Expert!");
              addBadge("Pattern Expert");
            } else if (newClusterCount >= 3 && previousClusterCount < 3) {
              setAchievement("🎯 First Clusters!");
              addBadge("First Clusters");
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
                const randomMessage = ENCOURAGING_MESSAGES[Math.floor(Math.random() * ENCOURAGING_MESSAGES.length)];
                setEncouragingMessage(randomMessage);
                setTimeout(() => setEncouragingMessage(""), 3000);
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
  
  // Show urgency messages as timer runs low
  useEffect(() => {
    if (timer !== null && timer <= 30 && timer > 0) {
      const urgencyMsg = TIMER_URGENCY_MESSAGES[Math.floor(Math.random() * TIMER_URGENCY_MESSAGES.length)]
        .replace('{time}', timer.toString());
      setEncouragingMessage(urgencyMsg);
      setTimeout(() => setEncouragingMessage(""), 2000);
    }
  }, [timer]);

  const handleSendMessage = (text: string) => {
    // TODO: Implement sending message via API
    const newMessage: Message = {
      text,
      author: "You",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  return (
    <Layout showHeader={true} showLegend={true}>
      <div className="max-w-7xl mx-auto p-6 space-y-6 relative">
        {/* Timer - aesthetic design */}
        {timer !== null && timer >= 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-24 right-6 z-50"
          >
            <motion.div
              animate={{
                x: timer <= 30 ? [0, -4, 4, -4, 4, 0] : 0,
                y: timer <= 30 ? [0, -2, 2, -2, 2, 0] : 0,
                scale: timer <= 10 ? [1, 1.08, 1] : 1,
              }}
              transition={{
                duration: 0.4,
                repeat: timer <= 30 ? Infinity : 0,
                repeatDelay: 0.3,
              }}
              className="relative overflow-hidden rounded-3xl shadow-2xl backdrop-blur-md border-2"
              style={{
                background: timer <= 10
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : timer <= 30
                  ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                  : 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
                borderColor: timer <= 10
                  ? 'rgba(255, 255, 255, 0.4)'
                  : timer <= 30
                  ? 'rgba(255, 255, 255, 0.4)'
                  : 'rgba(255, 255, 255, 0.3)',
              }}
            >
              {/* Animated background glow */}
              <motion.div
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="absolute inset-0 bg-white/20 blur-xl"
              />
              
              <div className="relative px-6 py-4 flex items-center gap-4">
                {/* Clock icon */}
                <motion.div
                  animate={timer <= 30 ? { rotate: [0, -12, 12, -12, 12, 0] } : { rotate: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    repeat: timer <= 30 ? Infinity : 0,
                    ease: "easeInOut"
                  }}
                  className="text-4xl"
                >
                  ⏰
                </motion.div>
                
                {/* Timer content */}
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <motion.span
                      key={timer}
                      initial={{ scale: 1.5 }}
                      animate={{ scale: 1 }}
                      className="font-display font-bold text-3xl text-white tracking-tight"
                    >
                      {timer}
                    </motion.span>
                    <span className="font-display text-sm text-white/90 font-medium">s</span>
                  </div>
                  
                  {timer <= 30 && (
                    <motion.p
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="font-display text-xs text-white/90 font-medium mt-0.5"
                    >
                      {timer <= 10 ? '⚠️ Almost over!' : '⏱️ Time running out!'}
                    </motion.p>
                  )}
                </div>
                
                {/* Pulsing indicator */}
                {timer <= 30 && (
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className={`w-3 h-3 rounded-full ${
                      timer <= 10 ? 'bg-red-200' : 'bg-orange-200'
                    }`}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Winner Screen */}
        <AnimatePresence>
          {showWinner && winner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.5, opacity: 0, y: 50 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 relative overflow-hidden"
              >
                {/* Background decoration */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500 rounded-full blur-3xl"></div>
                </div>
                
                <div className="relative z-10 text-center space-y-6">
                  {/* Winner emoji */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="text-8xl"
                  >
                    🏆
                  </motion.div>
                  
                  {/* Title */}
                  <h2 className="font-display font-bold text-4xl text-ink">
                    Round Complete! 🎉
                  </h2>
                  
                  {/* Winner cluster */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-4 border-purple-300">
                    <p className="font-display text-lg text-ink/70 mb-2">
                      The winning cluster:
                    </p>
                    <h3 className="font-display font-bold text-3xl text-purple-700 mb-3">
                      {winner.heading || `Cluster ${winner.cluster_id}`}
                    </h3>
                    <div className="flex items-center justify-center gap-6 text-sm text-ink/60 font-display">
                      <div>
                        <span className="font-semibold">{calculateClusterSize(winner)}</span> total engagement
                      </div>
                      <div>•</div>
                      <div>
                        <span className="font-semibold">{winner.raw_opinions?.length || 0}</span> opinions
                      </div>
                      <div>•</div>
                      <div>
                        <span className="font-semibold">{messages.filter(m => m.clusterId === winner.cluster_id).length}</span> messages
                      </div>
                    </div>
                  </div>
                  
                  {/* Thank you message */}
                  <p className="font-display text-lg text-ink/70">
                    Thank you for participating! 🙏
                  </p>
                  <p className="font-display text-base text-ink/60">
                    Your voice helped shape the discussion.
                  </p>
                  
                  {/* Close button */}
                  <motion.button
                    onClick={() => {
                      setShowWinner(false);
                      setTimer(null);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-6 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-display font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    Continue Viewing
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
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

        {/* Encouraging Message */}
        <AnimatePresence>
          {encouragingMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-32 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none"
            >
              <div className="bg-green-500/90 text-white px-6 py-3 rounded-lg shadow-lg font-display text-lg font-semibold">
                {encouragingMessage}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
