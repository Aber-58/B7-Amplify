import {useNavigate, useParams} from "react-router";
import {Navigation} from "../Navigation";
import {useEffect} from "react";

function Join() {
    const {uuid} = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (uuid) {
            // Directly navigate to poll without login requirement
            navigate(`${Navigation.POLL}/${uuid}`);
        }
    }, [uuid, navigate]);
    
    return (
        <div className="min-h-screen bg-paper flex items-center justify-center">
            <div className="text-center">
                <p className="font-scribble text-lg text-ink/60">Joining session...</p>
            </div>
        </div>
    );
}

export default Join;