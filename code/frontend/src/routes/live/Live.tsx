import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { getLiveView, getClusters, handleError } from "../../service/fetchService";
import { Navigation } from "../Navigation";
import { CloudMap } from "../../components/CloudMap";
import { ChatBox, Message } from "../../components/ChatBox";
import { Layout } from "../../components/Layout";
import { useClusterStore } from "../../store/clusterStore";
import { getWebSocketService } from "../../lib/ws";
import { calculateClusterSentiment } from "../../lib/sentiment";
import type { Cluster } from "../../store/clusterStore";

function Live() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { setClusters, clusters: clustersMap, selectedCluster, setSelectedCluster } = useClusterStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [topic, setTopic] = useState<string>("Loading...");
  
  // Get clusters for current topic UUID
  const clusters = uuid ? (clustersMap[uuid] || []) : [];

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
    };
  }, [uuid, navigate, setClusters]);

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
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <h1 className="font-scribble text-4xl text-ink font-bold text-center">
          {topic}
        </h1>

        {/* CloudMap visualization */}
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border-2 border-ink/20 shadow-card">
          {clusters.length > 0 ? (
            <CloudMap
              clusters={clusters}
              width={800}
              height={500}
              onClusterClick={setSelectedCluster}
            />
          ) : (
            <div className="h-[500px] flex items-center justify-center">
              <p className="font-scribble text-2xl text-ink/60">
                Waiting for clusters to form...
              </p>
            </div>
          )}
        </div>

        {/* ChatBox */}
        <div className="h-[400px]">
          <ChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            currentUsername="You"
          />
        </div>
      </div>
    </Layout>
  );
}

export default Live;
