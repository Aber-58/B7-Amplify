import {useCallback, useState} from "react";
import {useNavigate, useParams} from "react-router";
import {createOpinion, handleError, joinSession} from "../../service/fetchService";
import {JoinResponse} from "../../service/model/TopicResponse";
import {Navigation} from "../Navigation";

function Poll() {
    const [opinion, setOpinion] = useState("")
    const [rating, setRating] = useState(0)
    const [pollSessionData, setPollSessionData] = useState<JoinResponse | undefined>(undefined)
    const {uuid} = useParams();
    const navigate = useNavigate();
    useCallback(() => {
        if (uuid) {
            joinSession(uuid).then(setPollSessionData)
        }
    }, [uuid])

    function submitOpinion() {
        if (uuid) {
            createOpinion(uuid, opinion, rating).then(() => navigate(`${Navigation.LIVE}/${uuid}`))
                .catch(error => handleError(error, () => navigate((Navigation.ERROR))))
        }
    }

    return <>
        <h1>Poll</h1>
        {pollSessionData ? (
            <>
                <h2>"{pollSessionData.topic}"</h2>
                <h2>{pollSessionData.username}</h2>
                <h2>{pollSessionData.state}</h2>
            </>
        ) : <></>}
        <textarea value={opinion} onChange={e => setOpinion(e.target.value)} placeholder="Opinion"></textarea>
        <input type="number" value={rating} onChange={e => setRating(parseInt(e.target.value))}
               placeholder="Rating"></input>
        <button onClick={() => submitOpinion()}>Submit</button>
    </>
}

export default Poll