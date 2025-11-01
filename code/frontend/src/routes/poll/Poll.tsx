import {useState} from "react";
import {useNavigation, useParams} from "react-router";
import {joinSession} from "../../service/fetchService";
import {JoinResponse} from "../../service/model/TopicResponse";

function Poll() {
    const [opinion, setOpinion] = useState("")
    const [pollSessionData, setPollSessionData] = useState<JoinResponse | undefined>(undefined)
    const {uuid} = useParams();

    if (uuid) {
        joinSession(uuid).then(setPollSessionData)
    }

    function submitOpinion() {
        return undefined;
    }

    return <>
        <h1>Poll</h1>
        {pollSessionData ? (
            <>
                <h2>"{pollSessionData.topic}"</h2>
                <h2>{`${pollSessionData.username}`}</h2>
                <h2>{`${pollSessionData.state}`}</h2>
            </>
        ) : <></>}
        <textarea value={opinion} onChange={e => setOpinion(e.target.value)} placeholder="Opinion"></textarea>
        <button onClick={() => submitOpinion()}>Submit</button>
    </>
}

export default Poll