import Opinion from "./opinion/Opinion";
import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router";
import {getClusterCircleSize, getClusters, getLiveClusters, handleError} from "../../service/fetchService";
import './Live.css'
import {Navigation} from "../Navigation";
import {LiveViewResponse} from "../../service/model/LiveViewResponse";


function Live() {
    const {uuid} = useParams();
    const [textbox, setTextbox] = useState("")
    const [liveView, setLiveView] = useState<LiveViewResponse | undefined>(undefined)
    useEffect(() => {
        if (!uuid) return;
        getLiveClusters(uuid).then(setLiveView)
    })


    return <>
        <h1 className="problem-title">{liveView?.problemTitle}</h1>
        <div className="center-grid">
            {liveView?.solutions.map((solution, index) => (<Opinion solution={solution} index={index}></Opinion>))}
        </div>
        <div className="chatbox">
            <div className="messages">
                {liveView?.sortedMessages.map((message) => (<>
                    <p className="message"
                       title={message.timestamp.toString()}>{`${message.author}: ${message.text}`}</p>
                </>))}

            </div>
            <input value={textbox} onChange={e => setTextbox(e.target.value)} className="chat" placeholder="Chat"/>
        </div>
    </>
}

export default Live