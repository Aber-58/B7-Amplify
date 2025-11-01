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
            getTopicInfo(uuid).then(setTopicData).catch(console.error);
        }
    }, [uuid]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="text-center max-w-md w-full">
                <div className="mb-8">
                    <p className="text-lg text-gray-500 mb-2">You are invited to the discussion:</p>
                    <h1 className="text-3xl font-bold text-primary">
                        {topicData?.topic || "Loading..."}
                    </h1>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-sm mb-6">
                    <Link to={`/join/${uuid}`} className="block">
                        <QRCode 
                            value={inviteUrl} 
                            className="w-48 h-48 mx-auto"
                        />
                    </Link>
                </div>
                <p className="text-gray-600 text-sm">
                    Scan the QR code or click it to join the poll
                </p>
            </div>
        </div>
    );
}

export default Invite;
