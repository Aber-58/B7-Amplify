import {useEffect, useState} from "react";
import {createTopic, handleError, getAllOpinions, getClusters, triggerCluster, deleteTopic, addManualOpinion, resetEverything} from "../../service/fetchService";
import {useNavigate} from "react-router";
import {Navigation} from "../Navigation";
import {Toast} from "../../components/Toast";
import {QRBlock} from "../../components/QRBlock";
import {ClusterVisualization} from "../../components/ClusterVisualization";
import { 
    FaPlus, 
    FaQrcode, 
    FaNetworkWired, 
    FaLayerGroup, 
    FaChevronDown, 
    FaChevronRight,
    FaCheckCircle,
    FaExclamationCircle,
    FaUsers,
    FaWeight,
    FaTag,
    FaSpinner,
    FaTrash,
    FaCog,
    FaEdit,
    FaToggleOn,
    FaToggleOff,
    FaDice,
    FaPlay,
    FaStop,
    FaClock,
    FaRedo,
    FaExclamationTriangle
} from "react-icons/fa";
import { motion } from "framer-motion";
import React from "react";

// Type-safe wrapper for react-icons to work with React 19
const IconWrapper = ({ Icon, ...props }: { Icon: React.ComponentType<any>, [key: string]: any }) => {
    return <Icon {...props} />;
};

// Create type-safe icon components
const FaPlusIcon = (props: any) => <IconWrapper Icon={FaPlus} {...props} />;
const FaQrcodeIcon = (props: any) => <IconWrapper Icon={FaQrcode} {...props} />;
const FaNetworkWiredIcon = (props: any) => <IconWrapper Icon={FaNetworkWired} {...props} />;
const FaLayerGroupIcon = (props: any) => <IconWrapper Icon={FaLayerGroup} {...props} />;
const FaChevronDownIcon = (props: any) => <IconWrapper Icon={FaChevronDown} {...props} />;
const FaChevronRightIcon = (props: any) => <IconWrapper Icon={FaChevronRight} {...props} />;
const FaCheckCircleIcon = (props: any) => <IconWrapper Icon={FaCheckCircle} {...props} />;
const FaExclamationCircleIcon = (props: any) => <IconWrapper Icon={FaExclamationCircle} {...props} />;
const FaUsersIcon = (props: any) => <IconWrapper Icon={FaUsers} {...props} />;
const FaWeightIcon = (props: any) => <IconWrapper Icon={FaWeight} {...props} />;
const FaTagIcon = (props: any) => <IconWrapper Icon={FaTag} {...props} />;
const FaSpinnerIcon = (props: any) => <IconWrapper Icon={FaSpinner} {...props} />;
const FaTrashIcon = (props: any) => <IconWrapper Icon={FaTrash} {...props} />;
const FaCogIcon = (props: any) => <IconWrapper Icon={FaCog} {...props} />;
const FaEditIcon = (props: any) => <IconWrapper Icon={FaEdit} {...props} />;
const FaToggleOnIcon = (props: any) => <IconWrapper Icon={FaToggleOn} {...props} />;
const FaToggleOffIcon = (props: any) => <IconWrapper Icon={FaToggleOff} {...props} />;
const FaDiceIcon = (props: any) => <IconWrapper Icon={FaDice} {...props} />;
const FaPlayIcon = (props: any) => <IconWrapper Icon={FaPlay} {...props} />;
const FaStopIcon = (props: any) => <IconWrapper Icon={FaStop} {...props} />;
const FaClockIcon = (props: any) => <IconWrapper Icon={FaClock} {...props} />;
const FaRedoIcon = (props: any) => <IconWrapper Icon={FaRedo} {...props} />;
const FaExclamationTriangleIcon = (props: any) => <IconWrapper Icon={FaExclamationTriangle} {...props} />;

// Mock UUID generator for demo mode
function generateMockUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function Admin() {
    const [topic, setTopic] = useState("");
    const [allOpinions, setAllOpinions] = useState<any>({});
    const [openTopics, setOpenTopics] = useState<{ [uuid: string]: boolean }>({});
    const [clusters, setClusters] = useState<{ [uuid: string]: any }>({});
    const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
    const [isCreating, setIsCreating] = useState(false);
    const [isClustering, setIsClustering] = useState<{ [uuid: string]: boolean }>({});
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrModalData, setQrModalData] = useState<{uuid: string, type: 'invite' | 'live', topicTitle: string} | null>(null);
    const [showAddOpinionModal, setShowAddOpinionModal] = useState(false);
    const [addOpinionData, setAddOpinionData] = useState<{uuid: string, topicTitle: string} | null>(null);
    const [newOpinion, setNewOpinion] = useState({text: "", username: "admin", rating: 5});
    const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
    const [liveRounds, setLiveRounds] = useState<{ [uuid: string]: { active: boolean; timeLeft: number } }>({});
    let navigation = useNavigate();

    // Check backend availability on mount
    useEffect(() => {
        checkBackendStatus();
    }, []);

    function checkBackendStatus(mergeWithExisting = false) {
        getAllOpinions()
            .then(data => {
                setBackendAvailable(true);
                if (mergeWithExisting) {
                    // Merge with existing state instead of replacing
                    setAllOpinions((prev: any) => ({
                        ...prev,
                        ...(data.opinions || {})
                    }));
                } else {
                    setAllOpinions(data.opinions || {});
                }
            })
            .catch(err => {
                // Only switch to demo mode if backend was not previously available
                if (backendAvailable === null || backendAvailable === false) {
                    setBackendAvailable(false);
                    console.log('Backend not available, using demo mode:', err);
                    // Use mock data for demo
                    setAllOpinions({
                        'demo-topic-1': {
                            content: 'How can we improve team collaboration?',
                            opinions: [
                                ['Implement regular team check-ins', 8, 'alice'],
                                ['Use better communication tools', 7, 'bob'],
                                ['Create shared documentation', 9, 'charlie'],
                            ]
                        }
                    });
                } else {
                    // Backend was previously available, just log the error
                    console.error('Backend request failed:', err);
                }
            });
    }

    function sendCreateTopic() {
        if (!topic.trim()) {
            setToastMessage("Please enter a topic before creating.");
            setToastType('error');
            setShowToast(true);
            return;
        }

        setIsCreating(true);
        createTopic(topic)
            .then(topicResponse => {
                setIsCreating(false);
                setBackendAvailable(true); // Ensure backend is marked as available
                // Add the newly created topic to state immediately
                const newTopicData = {
                    content: topic,
                    opinions: []
                };
                setAllOpinions((prev: any) => ({
                    ...prev,
                    [topicResponse.uuid]: newTopicData
                }));
                
                // Refresh the topic list after a longer delay to ensure backend has persisted it
                // Use merge mode to preserve the newly added topic
                setTimeout(() => {
                    getAllOpinions()
                        .then(data => {
                            // Merge backend data with existing state, preserving our newly created topic
                            setAllOpinions((prev: any) => {
                                const merged = { ...prev };
                                // Update with backend data, but preserve any topics not in backend response
                                if (data.opinions) {
                                    Object.keys(data.opinions).forEach(uuid => {
                                        merged[uuid] = data.opinions[uuid];
                                    });
                                }
                                return merged;
                            });
                        })
                        .catch(err => {
                            // If refresh fails, don't worry - topic is already in state
                            console.log('Refresh failed, but topic is already saved:', err);
                        });
                }, 1000);
                
                setToastMessage(`✓ Topic created successfully!\n"${topic}"\nID: ${topicResponse.uuid.substring(0, 8)}...`);
                setToastType('success');
                setShowToast(true);
                // Clear the input
                setTopic("");
            })
            .catch(error => {
                setIsCreating(false);
                // If backend unavailable, use demo mode
                if (error.toString().includes('NetworkError') || error.toString().includes('Failed to fetch')) {
                    setBackendAvailable(false);
                    const mockUuid = generateMockUUID();
                    setToastMessage(`⚠ Demo Mode: Topic created (not saved)\n"${topic}"\nID: ${mockUuid.substring(0, 8)}...`);
                    setToastType('info');
                    setShowToast(true);
                    // Store locally for demo
                    setAllOpinions((prev: any) => ({
                        ...prev,
                        [mockUuid]: {
                            content: topic,
                            opinions: []
                        }
                    }));
                    // Clear the input
                    setTopic("");
                } else {
                    setToastMessage(`Error: ${error}`);
                    setToastType('error');
                    setShowToast(true);
                }
            });
    }


    function toggle(uuid: string) {
        setOpenTopics(prev => ({
            ...prev,
            [uuid]: !prev[uuid]
        }));

        if (!clusters[uuid]) {
            getClusters(uuid)
                .then(data => {
                    setClusters(prev => ({
                        ...prev,
                        [uuid]: data.clusters || []
                    }));
                })
                .catch(err => console.error(err));
        }
    }

    function handleTriggerCluster(uuid: string) {
        const topicData = allOpinions[uuid];
        const opinionsCount = topicData?.opinions?.length || 0;
        
        if (opinionsCount < 2) {
            setToastMessage('Need at least 2 opinions to create clusters!');
            setToastType('error');
            setShowToast(true);
            return;
        }
        
        setIsClustering(prev => ({ ...prev, [uuid]: true }));
        if (backendAvailable) {
            triggerCluster(uuid)
                .then(() => {
                    setToastMessage(`Clustering triggered! Processing ${opinionsCount} opinions...`);
                    setToastType('success');
                    setShowToast(true);
                    
                    // Wait a bit for clustering to complete, then refresh
                    setTimeout(() => {
                        getClusters(uuid)
                            .then(data => {
                                const clusterCount = data.clusters?.length || 0;
                                setClusters(prev => ({
                                    ...prev,
                                    [uuid]: data.clusters || []
                                }));
                                setIsClustering(prev => ({ ...prev, [uuid]: false }));
                                
                                if (clusterCount > 0) {
                                    setToastMessage(`✓ Clustering complete! ${clusterCount} cluster${clusterCount === 1 ? '' : 's'} created. You can now generate the Results QR code!`);
                                    setToastType('success');
                                    setShowToast(true);
                                    // Auto-expand the topic to show clusters
                                    setOpenTopics(prev => ({ ...prev, [uuid]: true }));
                                } else {
                                    setToastMessage('Clustering completed but no clusters found. Try adding more opinions.');
                                    setToastType('info');
                                    setShowToast(true);
                                }
                            })
                            .catch(err => {
                                setIsClustering(prev => ({ ...prev, [uuid]: false }));
                                setToastMessage('Clustering completed but failed to fetch results.');
                                setToastType('error');
                                setShowToast(true);
                                console.error('Error fetching clusters:', err);
                            });
                    }, 2000); // Wait 2 seconds for clustering to process
                })
                .catch(err => {
                    setIsClustering(prev => ({ ...prev, [uuid]: false }));
                    setToastMessage(`Failed to trigger clustering: ${err}`);
                    setToastType('error');
                    setShowToast(true);
                });
        } else {
            setTimeout(() => {
                setIsClustering(prev => ({ ...prev, [uuid]: false }));
                setToastMessage('Demo Mode: Clustering would process opinions here.');
                setToastType('info');
                setShowToast(true);
            }, 1000);
        }
    }

    function getClusterIdForOpinion(uuid: string, opinion: string, username: string): number | null {
        const topicClusters = clusters[uuid];
        if (!topicClusters) return null;

        for (const cluster of topicClusters) {
            for (const rawOpinion of cluster.raw_opinions) {
                if (rawOpinion.opinion === opinion && rawOpinion.username === username) {
                    return cluster.cluster_id;
                }
            }
        }
        return null;
    }

    function handleDeleteTopic(uuid: string, topicContent: string) {
        if (!window.confirm(`Are you sure you want to delete "${topicContent}"? This will delete all related opinions and clusters.`)) {
            return;
        }

        if (backendAvailable) {
            deleteTopic(uuid)
                .then(() => {
                    // Remove topic from local state
                    const updatedOpinions = { ...allOpinions };
                    delete updatedOpinions[uuid];
                    setAllOpinions(updatedOpinions);
                    
                    // Clean up related state
                    const updatedClusters = { ...clusters };
                    delete updatedClusters[uuid];
                    setClusters(updatedClusters);
                    
                    const updatedOpenTopics = { ...openTopics };
                    delete updatedOpenTopics[uuid];
                    setOpenTopics(updatedOpenTopics);
                    
                    setToastMessage('Topic deleted successfully');
                    setToastType('success');
                    setShowToast(true);
                })
                .catch(err => {
                    setToastMessage(`Failed to delete topic: ${err}`);
                    setToastType('error');
                    setShowToast(true);
                });
        } else {
            // Demo mode - just remove from local state
            const updatedOpinions = { ...allOpinions };
            delete updatedOpinions[uuid];
            setAllOpinions(updatedOpinions);
            
            setToastMessage('Demo Mode: Topic would be deleted here.');
            setToastType('info');
            setShowToast(true);
        }
    }

    function showQRCodeModal(uuid: string, type: 'invite' | 'live', topicTitle: string) {
        setQrModalData({ uuid, type, topicTitle });
        setShowQRModal(true);
    }

    function closeQRCodeModal() {
        setShowQRModal(false);
        setQrModalData(null);
    }

    function handleAddOpinion() {
        if (!addOpinionData) return;
        
        if (!newOpinion.text.trim()) {
            setToastMessage("Please enter an opinion before submitting.");
            setToastType('error');
            setShowToast(true);
            return;
        }

        if (backendAvailable) {
            addManualOpinion(addOpinionData.uuid, newOpinion.text, newOpinion.rating, newOpinion.username)
                .then(() => {
                    setToastMessage(`Opinion added successfully!`);
                    setToastType('success');
                    setShowToast(true);
                    setShowAddOpinionModal(false);
                    setAddOpinionData(null);
                    setNewOpinion({text: "", username: "admin", rating: 5});
                    // Refresh the opinions list
                    checkBackendStatus();
                })
                .catch(err => {
                    setToastMessage(`Failed to add opinion: ${err}`);
                    setToastType('error');
                    setShowToast(true);
                });
        } else {
            setToastMessage('Demo Mode: Opinion would be added here.');
            setToastType('info');
            setShowToast(true);
            setShowAddOpinionModal(false);
        }
    }

    function closeAddOpinionModal() {
        setShowAddOpinionModal(false);
        setAddOpinionData(null);
        setNewOpinion({text: "", username: "admin", rating: 5});
    }

    function handleResetEverything() {
        // Strong confirmation required
        const confirmMessage = "⚠️ WARNING: This will delete ALL topics, opinions, clusters, and messages!\n\nThis action cannot be undone.\n\nType 'RESET' to confirm:";
        const userInput = window.prompt(confirmMessage);
        
        if (userInput !== 'RESET') {
            setToastMessage('Reset cancelled. You must type "RESET" to confirm.');
            setToastType('info');
            setShowToast(true);
            return;
        }
        
        // Second confirmation
        if (!window.confirm('Are you absolutely sure? This will delete EVERYTHING and cannot be undone!')) {
            return;
        }
        
        if (backendAvailable) {
            resetEverything()
                .then(() => {
                    // Clear all local state
                    setAllOpinions({});
                    setClusters({});
                    setOpenTopics({});
                    setLiveRounds({});
                    
                    // Refresh
                    checkBackendStatus();
                    
                    setToastMessage('✓ Everything has been reset successfully!');
                    setToastType('success');
                    setShowToast(true);
                })
                .catch(err => {
                    setToastMessage(`Failed to reset: ${err}`);
                    setToastType('error');
                    setShowToast(true);
                });
        } else {
            // Demo mode - just clear local state
            setAllOpinions({});
            setClusters({});
            setOpenTopics({});
            setLiveRounds({});
            
            setToastMessage('Demo Mode: Local data cleared (backend not connected)');
            setToastType('info');
            setShowToast(true);
        }
    }

    function handleStartLiveRound(uuid: string) {
        if (backendAvailable) {
            // Start 90-second live round
            setLiveRounds(prev => ({
                ...prev,
                [uuid]: { active: true, timeLeft: 90 }
            }));
            
            setToastMessage('🎮 Live round started! Open for 90 seconds!');
            setToastType('success');
            setShowToast(true);
            
            // Navigate to live view
            navigation(`/live/${uuid}`);
        } else {
            setToastMessage('Demo Mode: Live round would start here');
            setToastType('info');
            setShowToast(true);
        }
    }

    // Timer effect for live rounds
    useEffect(() => {
        const interval = setInterval(() => {
            setLiveRounds(prev => {
                const updated = { ...prev };
                let changed = false;
                
                Object.keys(updated).forEach(uuid => {
                    if (updated[uuid].active && updated[uuid].timeLeft > 0) {
                        updated[uuid].timeLeft -= 1;
                        changed = true;
                    } else if (updated[uuid].active && updated[uuid].timeLeft === 0) {
                        updated[uuid].active = false;
                        changed = true;
                        setToastMessage(`⏱️ Live round for topic expired!`);
                        setToastType('info');
                        setShowToast(true);
                    }
                });
                
                return changed ? updated : prev;
            });
        }, 1000);
        
        return () => clearInterval(interval);
    }, []);

    function generateRandomOpinion() {
        const opinionTemplates = [
            "We should improve communication channels between teams",
            "I think we need more regular feedback sessions",
            "Let's implement better project management tools",
            "We should focus on work-life balance improvements",
            "I believe we need more training opportunities",
            "Let's enhance our team collaboration methods",
            "We should streamline our current processes",
            "I think we need better recognition for achievements",
            "Let's invest more in employee development",
            "We should create more opportunities for innovation",
            "I believe we need clearer communication guidelines",
            "Let's improve our decision-making processes",
            "We should focus on increasing team morale",
            "I think we need better conflict resolution mechanisms",
            "Let's enhance our knowledge sharing practices",
            "We should implement more flexible work arrangements",
            "I believe we need better resource allocation",
            "Let's improve our meeting effectiveness",
            "We should focus on reducing unnecessary bureaucracy",
            "I think we need more cross-functional collaboration"
        ];

        const randomNames = ["alice", "bob", "charlie", "diana", "eve", "frank", "grace", "henry", "ivy", "jack", "karen", "liam", "maria", "noah", "olivia"];
        const randomOpinion = opinionTemplates[Math.floor(Math.random() * opinionTemplates.length)];
        const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
        const randomRating = Math.floor(Math.random() * 10) + 1; // Random rating between 1-10

        setNewOpinion({
            text: randomOpinion,
            username: randomName,
            rating: randomRating
        });
    }

    const topicCount = Object.keys(allOpinions).length;
    const totalOpinions = Object.values(allOpinions).reduce((sum: number, topicData: any) => {
        return sum + (topicData.opinions?.length || 0);
    }, 0);

    return (
        <div className="min-h-screen bg-paper flex items-start justify-center p-4 py-8">
            <div className="max-w-5xl w-full space-y-6">
                {/* Header Section */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 backdrop-blur-sm rounded-xl shadow-card p-6 border border-ink/10"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-4xl font-display font-bold text-ink mb-2">Admin Panel</h1>
                            <p className="text-ink/60 font-display">Manage topics and opinions</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Status Indicator */}
                            <motion.div 
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                                    backendAvailable === true 
                                        ? 'bg-green-100 text-green-700' 
                                        : backendAvailable === false 
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-gray-100 text-gray-700'
                                }`}
                                whileHover={{ scale: 1.05 }}
                            >
                                {backendAvailable === true ? (
                                    <>
                                        <FaCheckCircleIcon className="text-lg" />
                                        <span className="font-display font-medium">Connected</span>
                                    </>
                                ) : backendAvailable === false ? (
                                    <>
                                        <FaExclamationCircleIcon className="text-lg" />
                                        <span className="font-display font-medium">Demo Mode</span>
                                    </>
                                ) : (
                                    <>
                                        <FaNetworkWiredIcon className="text-lg animate-spin" />
                                        <span className="font-display font-medium">Checking...</span>
                                    </>
                                )}
                            </motion.div>
                            {/* Reset Button - Elegant placement */}
                            <motion.button
                                onClick={handleResetEverything}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition font-display border border-red-200 hover:border-red-300"
                                title="Reset Everything - Delete all topics, opinions, and clusters"
                            >
                                <FaRedoIcon className="text-lg" />
                            </motion.button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-paper/50 rounded-lg p-4 border border-ink/10">
                            <div className="flex items-center gap-2 text-ink/60 font-display text-sm mb-1">
                                <FaTagIcon className="text-accent" />
                                <span>Total Topics</span>
                            </div>
                            <p className="text-3xl font-display font-bold text-ink">{topicCount}</p>
                        </div>
                        <div className="bg-paper/50 rounded-lg p-4 border border-ink/10">
                            <div className="flex items-center gap-2 text-ink/60 font-display text-sm mb-1">
                                <FaUsersIcon className="text-accent" />
                                <span>Total Opinions</span>
                            </div>
                            <p className="text-3xl font-display font-bold text-ink">{totalOpinions}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Create Topic Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 backdrop-blur-sm rounded-xl shadow-card p-6 border border-ink/10"
                >
                    <h2 className="text-xl font-display font-semibold text-ink mb-4 flex items-center gap-2">
                        <FaPlusIcon className="text-accent" />
                        <span>Create New Topic</span>
                    </h2>
                    <div className="space-y-3">
                        <div className="relative">
                            <input
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !isCreating && sendCreateTopic()}
                                placeholder="Enter your topic question..."
                                disabled={isCreating}
                                className="w-full px-4 py-3 pl-12 border-2 border-ink/20 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-colors font-display text-ink bg-paper/50 disabled:opacity-50"
                            />
                            <FaTagIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
                        </div>
                        <motion.button
                            onClick={sendCreateTopic}
                            disabled={isCreating || !topic.trim()}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-accent text-white py-3 px-4 rounded-lg hover:bg-accent/90 transition-colors font-display font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCreating ? (
                                <>
                                    <FaSpinnerIcon className="animate-spin" />
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <>
                                    <FaPlusIcon />
                                    <span>Create Topic</span>
                                </>
                            )}
                        </motion.button>
                    </div>
                </motion.div>

                {/* Topics List */}
                {topicCount > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/90 backdrop-blur-sm rounded-xl shadow-card p-6 border border-ink/10"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-display font-semibold text-ink flex items-center gap-2">
                                <FaLayerGroupIcon className="text-accent" />
                                <span>Topics ({topicCount})</span>
                            </h2>
                            <motion.button
                                onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-4 py-2 border-2 border-ink/20 rounded-lg hover:bg-ink/5 transition font-display flex items-center gap-2 text-sm"
                                title={showAdvancedFeatures ? "Hide Advanced Features" : "Show Advanced Features"}
                            >
                                {showAdvancedFeatures ? (
                                    <>
                                        <FaToggleOnIcon className="text-accent text-lg" />
                                        <span>Advanced</span>
                                    </>
                                ) : (
                                    <>
                                        <FaToggleOffIcon className="text-ink/60 text-lg" />
                                        <span>Advanced</span>
                                    </>
                                )}
                            </motion.button>
                        </div>
                        <div className="space-y-3">
                            {Object.entries(allOpinions).map(([uuid, topicData]: any) => {
                                const open = openTopics[uuid] ?? false;
                                const opinionsCount = topicData.opinions?.length || 0;
                                return (
                                    <motion.div 
                                        key={uuid} 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="border-2 border-ink/20 rounded-lg bg-white/50 backdrop-blur-sm shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                                    >
                                        {/* Topic Header */}
                                        <div className="p-4 bg-paper/30">
                                            <div className="flex items-center justify-between">
                                                <button
                                                    onClick={() => toggle(uuid)}
                                                    className="text-left flex items-center gap-3 hover:text-accent transition-colors flex-1 group"
                                                >
                                                    {open ? (
                                                        <FaChevronDownIcon className="text-ink/60 group-hover:text-accent transition-colors" />
                                                    ) : (
                                                        <FaChevronRightIcon className="text-ink/60 group-hover:text-accent transition-colors" />
                                                    )}
                                                    <div className="flex-1">
                                                        <span className="font-display font-semibold text-lg text-ink block">{topicData.content}</span>
                                                        <div className="flex items-center gap-4 mt-1">
                                                            <span className="text-sm text-ink/60 font-display flex items-center gap-1">
                                                                <FaUsersIcon className="text-xs" />
                                                                {opinionsCount} {opinionsCount === 1 ? 'opinion' : 'opinions'}
                                                            </span>
                                                            {clusters[uuid] && (
                                                                <span className="text-sm text-ink/60 font-display flex items-center gap-1">
                                                                    <FaLayerGroupIcon className="text-xs" />
                                                                    {clusters[uuid].length} {clusters[uuid].length === 1 ? 'cluster' : 'clusters'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>

                                                <div className="flex gap-2 ml-4">
                                                    <motion.button
                                                        onClick={() => showQRCodeModal(uuid, 'invite', topicData.content)}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition font-display flex items-center gap-2 text-sm"
                                                        title="Show Invite QR Code"
                                                    >
                                                        <FaQrcodeIcon />
                                                        <span>Invite QR</span>
                                                    </motion.button>
                                                    {clusters[uuid] && clusters[uuid].length > 0 && (
                                                        <>
                                                            <motion.button
                                                                onClick={() => handleStartLiveRound(uuid)}
                                                                disabled={liveRounds[uuid]?.active}
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                className={`px-4 py-2 rounded-lg transition font-display flex items-center gap-2 text-sm font-semibold shadow-md ${
                                                                    liveRounds[uuid]?.active
                                                                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                                                                        : 'bg-purple-500 text-white hover:bg-purple-600'
                                                                } disabled:opacity-70 disabled:cursor-not-allowed`}
                                                                title={liveRounds[uuid]?.active ? `Live round active: ${liveRounds[uuid].timeLeft}s left` : 'Start 90-second live round'}
                                                            >
                                                                {liveRounds[uuid]?.active ? (
                                                                    <>
                                                                        <FaClockIcon className="animate-pulse" />
                                                                        <span>Live: {liveRounds[uuid].timeLeft}s</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <FaPlayIcon />
                                                                        <span>Start Round</span>
                                                                    </>
                                                                )}
                                                            </motion.button>
                                                            <motion.button
                                                                onClick={() => showQRCodeModal(uuid, 'live', topicData.content)}
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-display flex items-center gap-2 text-sm font-semibold shadow-md"
                                                                title="Show Live Results QR Code - Clustering Complete!"
                                                            >
                                                                <FaQrcodeIcon />
                                                                <span>Results QR</span>
                                                                <span className="px-1.5 py-0.5 bg-green-600 rounded text-xs">✓</span>
                                                            </motion.button>
                                                        </>
                                                    )}
                                                    <motion.button
                                                        onClick={() => handleTriggerCluster(uuid)}
                                                        disabled={isClustering[uuid]}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        className="px-4 py-2 border-2 border-ink/20 rounded-lg hover:bg-ink/5 transition font-display flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Trigger Clustering"
                                                    >
                                                        {isClustering[uuid] ? (
                                                            <>
                                                                <FaSpinnerIcon className="animate-spin" />
                                                                <span>Processing...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FaLayerGroupIcon />
                                                                <span>Cluster</span>
                                                            </>
                                                        )}
                                                    </motion.button>
                                                    {showAdvancedFeatures && (
                                                        <>
                                                            <motion.button
                                                                onClick={() => {
                                                                    setAddOpinionData({uuid, topicTitle: topicData.content});
                                                                    setShowAddOpinionModal(true);
                                                                }}
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-display flex items-center gap-2 text-sm"
                                                                title="Add Manual Opinion"
                                                            >
                                                                <FaPlusIcon />
                                                                <span>Add Opinion</span>
                                                            </motion.button>
                                                            <motion.button
                                                                onClick={() => handleDeleteTopic(uuid, topicData.content)}
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-display flex items-center gap-2 text-sm"
                                                                title="Delete Topic"
                                                            >
                                                                <FaTrashIcon />
                                                                <span>Delete</span>
                                                            </motion.button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Clusters Section */}
                                        {open && clusters[uuid] && clusters[uuid].length > 0 && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="p-4 border-t-2 border-ink/10 bg-accent/5"
                                            >
                                                <h3 className="text-lg font-display font-semibold text-ink mb-4 flex items-center gap-2">
                                                    <FaLayerGroupIcon className="text-accent" />
                                                    <span>Clusters ({clusters[uuid].length})</span>
                                                </h3>
                                                <div className="space-y-4">
                                                    {clusters[uuid].map((cluster: any, idx: number) => {
                                                        const clusterColor = `hsl(${(idx * 137.5) % 360}, 60%, 80%)`;
                                                        const rawOpinionsCount = cluster.raw_opinions?.length || 0;
                                                        return (
                                                            <motion.div
                                                                key={cluster.cluster_id || idx}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: idx * 0.1 }}
                                                                className="border-2 border-accent/30 rounded-lg bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden"
                                                                style={{ borderLeftColor: clusterColor, borderLeftWidth: '4px' }}
                                                            >
                                                                {/* Cluster Header */}
                                                                <div className="p-5 bg-gradient-to-r from-accent/15 to-accent/5 border-b border-accent/20">
                                                                    <div className="flex items-start justify-between gap-3 mb-3">
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <span className="px-3 py-1 bg-accent text-white text-xs rounded-full font-display font-semibold shadow-sm">
                                                                                    Cluster {cluster.cluster_id || idx + 1}
                                                                                </span>
                                                                                <span className="text-xs text-ink/60 font-display flex items-center gap-1">
                                                                                    {rawOpinionsCount} {rawOpinionsCount === 1 ? 'opinion' : 'opinions'}
                                                                                </span>
                                                                            </div>
                                                                            {cluster.heading ? (
                                                                                <h4 className="text-lg font-display font-bold text-ink leading-tight mb-1">
                                                                                    "{cluster.heading}"
                                                                                </h4>
                                                                            ) : (
                                                                                <h4 className="text-lg font-display font-semibold text-ink/80 italic leading-tight mb-1">
                                                                                    {cluster.raw_opinions?.[0]?.opinion || 'No heading available'}
                                                                                </h4>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {cluster.leader_id && (
                                                                        <p className="text-xs text-ink/70 font-display flex items-center gap-1.5">
                                                                            <FaUsersIcon className="text-accent" />
                                                                            <span className="font-medium">Leader:</span> {cluster.leader_id}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                
                                                                {/* Cluster Visualization */}
                                                                <div className="p-4 bg-paper/30 border-b border-ink/10">
                                                                    <div className="mb-3">
                                                                        <h5 className="text-xs font-display font-semibold text-ink/70 uppercase tracking-wide mb-2 flex items-center gap-2">
                                                                            <FaLayerGroupIcon className="text-accent text-xs" />
                                                                            Cluster Theme Visualization
                                                                        </h5>
                                                                        <p className="text-xs text-ink/50 font-display mb-3">
                                                                            Key words and themes that connect these opinions together
                                                                        </p>
                                                                    </div>
                                                                    <ClusterVisualization 
                                                                        cluster={cluster} 
                                                                        clusterIndex={idx}
                                                                        color={clusterColor}
                                                                    />
                                                                </div>
                                                                
                                                                <div className="p-4 space-y-2">
                                                                    <h5 className="text-sm font-display font-semibold text-ink/70 mb-2 flex items-center gap-2">
                                                                        <FaUsersIcon className="text-accent text-xs" />
                                                                        Opinions in this cluster
                                                                    </h5>
                                                                    {cluster.raw_opinions && cluster.raw_opinions.length > 0 ? (
                                                                        cluster.raw_opinions.map((rawOp: any, opIdx: number) => (
                                                                            <div key={opIdx} className="p-3 bg-paper/50 rounded border border-ink/10 text-sm hover:border-accent/30 transition-colors">
                                                                                <p className="font-display text-ink/90 mb-1">{rawOp.opinion || rawOp}</p>
                                                                                <div className="flex items-center gap-3 text-xs text-ink/60">
                                                                                    <span>{rawOp.username || 'unknown'}</span>
                                                                                    {rawOp.weight && <span>Weight: {rawOp.weight}</span>}
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <p className="text-sm text-ink/40 font-display">No opinions in this cluster</p>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Opinions List */}
                                        {open && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="p-4 space-y-3"
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="text-lg font-display font-semibold text-ink flex items-center gap-2">
                                                        <FaUsersIcon className="text-accent" />
                                                        <span>All Opinions ({opinionsCount})</span>
                                                    </h3>
                                                </div>
                                                {opinionsCount === 0 ? (
                                                    <div className="text-center py-8 text-ink/40 font-display">
                                                        <FaUsersIcon className="text-3xl mx-auto mb-2 opacity-50" />
                                                        <p>No opinions yet. Share the topic to collect opinions!</p>
                                                    </div>
                                                ) : (
                                                    topicData.opinions.map((opTuple: any[], i: number) => {
                                                        const [opinion, weight, username] = opTuple;
                                                        const clusterId = getClusterIdForOpinion(uuid, opinion, username);
                                                        return (
                                                            <motion.div
                                                                key={i}
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: i * 0.05 }}
                                                                className={`p-4 border-2 rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                                                                    clusterId !== null 
                                                                        ? 'border-accent/30 bg-accent/5' 
                                                                        : 'border-ink/10 bg-paper/50'
                                                                }`}
                                                            >
                                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                                    <p className="font-display text-ink flex-1 leading-relaxed">{opinion}</p>
                                                                    {clusterId !== null && (
                                                                        <span className="px-3 py-1 bg-accent/20 text-accent text-xs rounded-full font-display flex items-center gap-1 flex-shrink-0">
                                                                            <FaTagIcon className="text-xs" />
                                                                            Cluster {clusterId}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-4 text-sm text-ink/60 font-display">
                                                                    <span className="flex items-center gap-1">
                                                                        <FaUsersIcon className="text-xs" />
                                                                        {username}
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <FaWeightIcon className="text-xs" />
                                                                        Weight: {weight}
                                                                    </span>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })
                                                )}
                                            </motion.div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Empty State */}
                {topicCount === 0 && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white/90 backdrop-blur-sm rounded-xl shadow-card p-12 border border-ink/10 text-center"
                    >
                        <FaTagIcon className="text-5xl text-ink/30 mx-auto mb-4" />
                        <h3 className="text-xl font-display font-semibold text-ink mb-2">No topics yet</h3>
                        <p className="text-ink/60 font-display mb-6">Create your first topic to get started!</p>
                    </motion.div>
                )}
            </div>

            {/* Toast for notifications */}
            <Toast
                message={toastMessage}
                type={toastType}
                isVisible={showToast}
                onClose={() => setShowToast(false)}
                duration={4000}
            />

            {/* QR Code Modal */}
            {showQRModal && qrModalData && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={closeQRCodeModal}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-xl shadow-card p-8 max-w-md w-full border-2 border-ink/20"
                    >
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-display font-bold text-ink mb-2">
                                {qrModalData.type === 'invite' ? 'Invite QR Code' : 'Live Results QR Code'}
                            </h2>
                            <p className="text-sm text-ink/60 font-display mb-4">
                                {qrModalData.topicTitle}
                            </p>
                        </div>
                        <div className="flex justify-center mb-6 bg-paper/50 p-6 rounded-lg border-2 border-ink/10">
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                <QRBlock
                                    value={
                                        qrModalData.type === 'invite'
                                            ? `${window.location.origin}/join/${qrModalData.uuid}`
                                            : `${window.location.origin}/live/${qrModalData.uuid}`
                                    }
                                    size={280}
                                />
                            </div>
                        </div>
                        <div className="text-center mb-4 space-y-2">
                            <p className="text-sm font-display font-medium text-ink mb-3">
                                {qrModalData.type === 'invite'
                                    ? 'Scan to join the poll and submit your opinion'
                                    : 'Scan to view live results and clusters'}
                            </p>
                            <div className="bg-ink/5 px-4 py-3 rounded-lg border border-ink/10">
                                <p className="text-xs text-ink/50 font-display mb-1">URL:</p>
                                <p className="text-xs text-ink/80 font-mono break-all">
                                    {qrModalData.type === 'invite'
                                        ? `${window.location.origin}/join/${qrModalData.uuid}`
                                        : `${window.location.origin}/live/${qrModalData.uuid}`}
                                </p>
                            </div>
                        </div>
                        <motion.button
                            onClick={closeQRCodeModal}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-accent text-white py-3 px-4 rounded-lg hover:bg-accent/90 transition font-display font-medium"
                        >
                            Close
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}

            {/* Add Opinion Modal */}
            {showAddOpinionModal && addOpinionData && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={closeAddOpinionModal}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-xl shadow-card p-8 max-w-md w-full border-2 border-ink/20"
                    >
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-display font-bold text-ink mb-2">
                                Add Manual Opinion
                            </h2>
                            <p className="text-sm text-ink/60 font-display mb-4">
                                {addOpinionData.topicTitle}
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-display font-medium text-ink">
                                        Opinion
                                    </label>
                                    <motion.button
                                        onClick={generateRandomOpinion}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-display font-medium bg-accent text-white rounded-lg hover:bg-accent/90 transition shadow-sm"
                                        title="Generate Random Opinion"
                                        type="button"
                                    >
                                        <FaDiceIcon />
                                        <span>Generate Random</span>
                                    </motion.button>
                                </div>
                                <textarea
                                    value={newOpinion.text}
                                    onChange={(e) => setNewOpinion({...newOpinion, text: e.target.value})}
                                    placeholder="Enter your opinion or click 'Generate Random' to fill automatically..."
                                    rows={4}
                                    className="w-full px-4 py-3 border-2 border-ink/20 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-colors font-display text-ink bg-paper/50 resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-display font-medium text-ink mb-2">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        value={newOpinion.username}
                                        onChange={(e) => setNewOpinion({...newOpinion, username: e.target.value})}
                                        placeholder="admin"
                                        className="w-full px-4 py-3 border-2 border-ink/20 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-colors font-display text-ink bg-paper/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-display font-medium text-ink mb-2">
                                        Rating
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={newOpinion.rating}
                                        onChange={(e) => setNewOpinion({...newOpinion, rating: parseInt(e.target.value) || 5})}
                                        className="w-full px-4 py-3 border-2 border-ink/20 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-colors font-display text-ink bg-paper/50"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <motion.button
                                    onClick={closeAddOpinionModal}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1 bg-ink/10 text-ink py-3 px-4 rounded-lg hover:bg-ink/20 transition font-display font-medium"
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    onClick={handleAddOpinion}
                                    disabled={!newOpinion.text.trim()}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1 bg-accent text-white py-3 px-4 rounded-lg hover:bg-accent/90 transition font-display font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Add Opinion
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}

export default Admin;
