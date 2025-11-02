import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { Navigation } from '../Navigation';
import Admin from '../admin/Admin';
import Invite from '../invite/Invite';
import Poll from '../poll/Poll';
import Live from '../live/Live';
import Join from '../join/Join';
import { generateMockClusters } from '../../lib/mockData';
import { OpinionForm } from '../../components/OpinionForm';
import { CloudMap } from '../../components/CloudMap';
import { ChatBox } from '../../components/ChatBox';
import { QRBlock } from '../../components/QRBlock';
import { SentimentLegend } from '../../components/SentimentLegend';
import { ConsensusCard } from '../../components/ConsensusCard';
import { Toast } from '../../components/Toast';
import { Layout } from '../../components/Layout';
import type { Cluster } from '../../store/clusterStore';

// Mock UUID for development
const MOCK_UUID = '00000000-0000-0000-0000-000000000000';

// Mock component wrappers that work without backend
const MockInvite = () => {
  const { uuid } = useParams();
  const inviteUrl = `${window.location.origin}/join/${uuid || MOCK_UUID}`;
  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <div className="mb-8">
          <p className="text-lg text-ink/60 mb-2">You are invited to the discussion:</p>
          <h1 className="text-3xl font-display font-bold text-ink">
            How can we improve team collaboration?
          </h1>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-card mb-6 border border-ink/10">
          <QRBlock value={inviteUrl} size={200} />
        </div>
        <p className="text-ink/60 text-sm">
          Scan the QR code or click it to join the poll
        </p>
      </div>
    </div>
  );
};

const MockPoll = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  
  const handleSubmit = (opinion: string, rating: number) => {
    console.log('Submitted:', { opinion, rating });
    // Navigate to live view
    setTimeout(() => {
      navigate(`/live/${uuid || MOCK_UUID}`);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-paper p-4">
      <OpinionForm
        onSubmit={handleSubmit}
        topicTitle="How can we improve team collaboration?"
        username="demo-user"
      />
    </div>
  );
};

const MockLive = () => {
  const { uuid } = useParams();
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    // Generate mock clusters
    const mockClusters = generateMockClusters(5);
    setClusters(mockClusters.map(c => ({
      ...c,
      position2d: { x: Math.random(), y: Math.random() },
    })));

    // Add some mock messages
    setMessages([
      {
        text: 'I think we should implement more regular check-ins',
        author: 'Alice',
        timestamp: new Date(Date.now() - 3600000),
        sentiment: 0.7,
        clusterId: 1,
      },
      {
        text: 'Agreed! Communication is key',
        author: 'Bob',
        timestamp: new Date(Date.now() - 1800000),
        sentiment: 0.8,
        clusterId: 1,
      },
      {
        text: 'What about improving the feedback process?',
        author: 'Charlie',
        timestamp: new Date(Date.now() - 600000),
        sentiment: 0.5,
        clusterId: 2,
      },
    ]);
  }, []);

  const handleSendMessage = (text: string) => {
    setMessages([
      ...messages,
      {
        text,
        author: 'You',
        timestamp: new Date(),
        sentiment: Math.random() * 2 - 1,
      },
    ]);
  };

  return (
    <Layout showHeader={true} showLegend={true}>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <h1 className="font-scribble text-4xl text-ink font-bold text-center">
          How can we improve team collaboration?
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

        {/* Selected cluster card */}
        {selectedCluster && (
          <div className="max-w-md">
            <ConsensusCard
              cluster={selectedCluster}
              onClose={() => setSelectedCluster(null)}
            />
          </div>
        )}

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
};


function Showcase() {
  const [activeTab, setActiveTab] = useState<string>('admin');
  const [showToast, setShowToast] = useState(false);

  const tabs = [
    { id: 'admin', label: 'Admin', path: Navigation.ADMIN },
    { id: 'invite', label: 'Invite (QR)', path: `${Navigation.INVITE}/${MOCK_UUID}` },
    { id: 'poll', label: 'Poll/Submit', path: `${Navigation.POLL}/${MOCK_UUID}` },
    { id: 'live', label: 'Live/Results', path: `${Navigation.LIVE}/${MOCK_UUID}` },
    { id: 'components', label: 'Components', path: null },
  ];

  const handleComponentShow = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-paper">
      {/* Tab Navigation */}
      <div className="bg-white/80 backdrop-blur-sm shadow-card border-b border-ink/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <h1 className="text-xl font-display font-bold text-ink">consensus.io Dev Showcase</h1>
            <div className="flex gap-2 flex-wrap items-center">
              {tabs.map((tab) => (
                <Link
                  key={tab.id}
                  to={tab.path || '#'}
                  onClick={(e) => {
                    if (!tab.path) {
                      e.preventDefault();
                      setActiveTab(tab.id);
                    } else {
                      setActiveTab(tab.id);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-display font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-accent text-white'
                      : 'bg-ink/10 text-ink hover:bg-ink/20'
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
            <div className="text-xs text-ink/50">
              UUID: {MOCK_UUID.substring(0, 8)}...
            </div>
          </div>
        </div>
      </div>

      {/* Component Preview Section */}
      {activeTab === 'components' && (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          <h2 className="text-2xl font-display font-bold text-ink">Component Library</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* OpinionForm */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border-2 border-ink/20 shadow-card">
              <h3 className="text-lg font-display font-bold text-ink mb-4">OpinionForm</h3>
              <OpinionForm
                onSubmit={(opinion, rating) => {
                  console.log('Form submitted:', { opinion, rating });
                  handleComponentShow();
                }}
                topicTitle="Demo Topic"
                username="demo-user"
              />
            </div>

            {/* QRBlock */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border-2 border-ink/20 shadow-card">
              <h3 className="text-lg font-display font-bold text-ink mb-4">QRBlock</h3>
              <div className="flex justify-center">
                <QRBlock value={`${window.location.origin}/join/${MOCK_UUID}`} size={150} />
              </div>
            </div>

            {/* CloudMap */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border-2 border-ink/20 shadow-card md:col-span-2">
              <h3 className="text-lg font-display font-bold text-ink mb-4">CloudMap</h3>
              <div className="h-[400px]">
                <CloudMap
                  clusters={generateMockClusters(6)}
                  width={800}
                  height={400}
                />
              </div>
            </div>

            {/* ConsensusCard */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border-2 border-ink/20 shadow-card">
              <h3 className="text-lg font-display font-bold text-ink mb-4">ConsensusCard</h3>
              <ConsensusCard
                cluster={generateMockClusters(1)[0]}
                onClose={() => {}}
              />
            </div>

            {/* ChatBox */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border-2 border-ink/20 shadow-card">
              <h3 className="text-lg font-display font-bold text-ink mb-4">ChatBox</h3>
              <div className="h-[300px]">
                <ChatBox
                  messages={[
                    {
                      text: 'Hello! This is a test message',
                      author: 'Alice',
                      timestamp: new Date(),
                      sentiment: 0.7,
                    },
                    {
                      text: 'Testing the chat component',
                      author: 'Bob',
                      timestamp: new Date(),
                      sentiment: 0.5,
                    },
                  ]}
                  currentUsername="You"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Views */}
      {activeTab !== 'components' && (
        <div className="max-w-7xl mx-auto p-4">
          <div className="bg-white/50 backdrop-blur-sm rounded-lg shadow-card border border-ink/10 min-h-[80vh] p-4">
            {activeTab === 'admin' && <Admin />}
            {activeTab === 'invite' && <MockInvite />}
            {activeTab === 'poll' && <MockPoll />}
            {activeTab === 'live' && <MockLive />}
          </div>
        </div>
      )}

      {/* Toast for component interactions */}
      <Toast
        message="Component interaction demo!"
        type="success"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* Sentiment Legend */}
      <SentimentLegend />
    </div>
  );
}

export default Showcase;
