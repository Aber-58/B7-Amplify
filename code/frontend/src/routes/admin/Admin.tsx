import {useEffect, useState} from "react";
import {createTopic, handleError, getAllOpinions, getClusters} from "../../service/fetchService";
import {useNavigate} from "react-router";
import {Navigation} from "../Navigation";

function Admin() {
    const [topic, setTopic] = useState("");
    const [allOpinions, setAllOpinions] = useState<any>({});
    const [openTopics, setOpenTopics] = useState<{ [uuid: string]: boolean }>({});
    const [clusters, setClusters] = useState<{ [uuid: string]: any }>({});
    let navigation = useNavigate();

    function sendCreateTopic() {
        createTopic(topic)
            .then(topic => {
                navigation(`${Navigation.INVITE}/${topic.uuid}`);
            })
            .catch(error => handleError(error, () => navigation((Navigation.ERROR))));
    }

    useEffect(() => {
        getAllOpinions("")
            .then(data => {
                setAllOpinions(data.opinions || {});
            })
            .catch(err => console.error(err));
    }, []);

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

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-lg shadow-sm p-8 space-y-8">

                <h1 className="text-3xl font-bold text-primary text-center">Admin</h1>

                {/* Create Topic */}
                <div className="space-y-4">
                    <input
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        placeholder="Topic"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
                    />
                    <button
                        onClick={sendCreateTopic}
                        className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors font-medium"
                    >
                        Erstellen
                    </button>
                </div>

                {/* Topic List */}
                <div className="pt-6 border-t border-gray-200 space-y-4">
                    {Object.entries(allOpinions).map(([uuid, topicData]: any) => {
                        const open = openTopics[uuid] ?? false;
                        return (
                            <div key={uuid} className="border rounded-lg p-4">
                                {/* Header row with toggle and button */}
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => toggle(uuid)}
                                        className="text-left flex items-center gap-2"
                                    >
                                        <span className="text-lg">{open ? "▼" : "▶"}</span>
                                        <span className="font-semibold text-lg">{topicData.content}</span>
                                    </button>

                                    <button
                                        className="text-sm px-2 py-1 border rounded-lg hover:bg-gray-100 transition"
                                    >
                                        Start Cluster
                                    </button>
                                </div>

                                {open && (
                                    <div className="mt-4 grid gap-3">
                                        {topicData.opinions.map((opTuple: any[], i: number) => {
                                            const [opinion, weight, username] = opTuple;
                                            const clusterId = getClusterIdForOpinion(uuid, opinion, username);
                                            return (
                                                <div
                                                    key={i}
                                                    className="p-3 border rounded-lg bg-gray-50 shadow-sm"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-medium text-gray-800 flex-1">{opinion}</div>
                                                        {clusterId !== null && (
                                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                                Cluster {clusterId}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        {username} — Gewicht: {weight}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
}

export default Admin;
