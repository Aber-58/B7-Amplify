import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router";
import {createOpinion, handleError, joinSession} from "../../service/fetchService";
import {Navigation} from "../Navigation";
import {JoinResponse} from "../../service/model/JoinResponse";

function Poll() {
    const [opinion, setOpinion] = useState("")
    const [rating, setRating] = useState(0)
    const [pollSessionData, setPollSessionData] = useState<JoinResponse | undefined>(undefined)
    const {uuid} = useParams();
    const navigate = useNavigate();
    useEffect(() => {
        if (!uuid) return;
        joinSession(uuid)
            .then((data) => {
                setPollSessionData(data);
            })
            .catch((error) => handleError(error, () => navigate(Navigation.ERROR)));
    }, [uuid, navigate]);

    function submitOpinion() {
        // Validation
        if (!opinion.trim()) {
            alert("Please enter your opinion before submitting.");
            return;
        }

        if (rating < 1 || rating > 10) {
            alert("Please enter a rating between 1 and 10.");
            return;
        }

        if (uuid) {
            createOpinion(uuid, opinion, rating).then(() => navigate(`${Navigation.LIVE}/${uuid}`))
                .catch(error => handleError(error, () => navigate((Navigation.ERROR))))
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <p className="text-lg text-gray-500 mb-2">You are participating in the discussion:</p>
                    <h1 className="text-3xl font-bold text-primary">
                        {pollSessionData?.topic || "Loading..."}
                    </h1>
                </div>

                {pollSessionData && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <p className="text-sm text-gray-600">
                            Filling out poll as: <span className="font-medium text-gray-800">{pollSessionData.username}</span>
                        </p>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Your Opinion</label>
                            <textarea
                                value={opinion}
                                onChange={e => setOpinion(e.target.value)}
                                placeholder="Share your thoughts..."
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                            <input
                                type="number"
                                value={rating}
                                onChange={e => setRating(parseInt(e.target.value))}
                                placeholder="1-10"
                                min="1"
                                max="10"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
                            />
                        </div>

                        <button
                            onClick={() => submitOpinion()}
                            className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors font-medium"
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Poll