import { useParams, Link } from "react-router";
import QRCode from "react-qr-code";
import { useState, useEffect } from "react";
import { getTopicInfo } from "../../service/fetchService";

function Invite() {
    const { uuid } = useParams();
    const [topicData, setTopicData] = useState<{topic: string, state: string} | null>(null);

    const inviteUrl = `${window.location.origin}/join/${uuid}`;

    useEffect(() => {
        if (uuid) {
            getTopicInfo(uuid)
                .then(setTopicData)
                .catch(err => {
                    console.log('Backend not available, using demo mode:', err);
                    // Use mock topic data for demo
                    setTopicData({
                        topic: 'Demo Topic - How can we improve team collaboration?',
                        state: 'question'
                    });
                });
        }
    }, [uuid]);

    return (
        <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-4">
            <div className="text-center max-w-md w-full">
                <div className="mb-8">
                    <p className="text-lg text-ink/60 mb-2 font-display">You are invited to the discussion:</p>
                    <h1 className="text-3xl font-display font-bold text-ink">
                        {topicData?.topic || "Loading..."}
                    </h1>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-card mb-6 border border-ink/10">
                    <Link to={`/join/${uuid}`} className="block">
                        <QRCode 
                            value={inviteUrl} 
                            className="w-48 h-48 mx-auto"
                        />
                    </Link>
                </div>
                <p className="text-ink/60 text-sm font-display">
                    Scan the QR code or click it to join the poll
                </p>
            </div>
        </div>
    );
}

export default Invite;
