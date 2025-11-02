import {useState, useEffect} from "react";
import {useNavigate, useParams} from "react-router";
import {createOpinion, handleError, getTopicInfo} from "../../service/fetchService";
import {Navigation} from "../Navigation";
import {OpinionForm} from "../../components/OpinionForm";

function Poll() {
    const {uuid} = useParams();
    const navigate = useNavigate();
    const [topicTitle, setTopicTitle] = useState<string>("Loading topic...");

    // Generate a simple username for the user
    const username = `user-${Math.random().toString(36).substring(2, 9)}`;

    // Fetch topic information when component mounts
    useEffect(() => {
        if (uuid) {
            getTopicInfo(uuid)
                .then(topicData => {
                    setTopicTitle(topicData.topic);
                })
                .catch(error => {
                    console.log('Failed to fetch topic, using fallback:', error);
                    setTopicTitle("Loading topic...");
                    // In demo mode or if backend unavailable, keep the loading message
                });
        }
    }, [uuid]);

    function handleSubmit(opinion: string, rating: number) {
        if (!uuid) {
            handleError("No topic UUID found", () => navigate(Navigation.ERROR));
            return;
        }

        createOpinion(uuid, opinion, rating)
            .then(() => navigate(`${Navigation.LIVE}/${uuid}`))
            .catch(error => {
                // If backend unavailable, allow demo mode
                if (error.toString().includes('NetworkError') || error.toString().includes('Failed to fetch')) {
                    // In demo mode, just navigate to live view
                    navigate(`${Navigation.LIVE}/${uuid}`);
                } else {
                    handleError(error, () => navigate(Navigation.ERROR));
                }
            });
    }

    return (
        <div className="min-h-screen bg-paper p-4">
            <OpinionForm
                onSubmit={handleSubmit}
                topicTitle={topicTitle}
                username={username}
            />
        </div>
    );
}

export default Poll;