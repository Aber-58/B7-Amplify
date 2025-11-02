import Opinion from "./opinion/Opinion";
import {KeyboardEventHandler, useEffect, useState} from "react";
import {useParams} from "react-router";
import {getLastMessages, getLiveClusters, sendChatMessage, updateBallSizes} from "../../service/fetchService";
import './Live.css'
import {LiveViewResponse} from "../../service/model/LiveViewResponse";
import {Message} from "../../service/model/Message";


function Live() {
    const {uuid} = useParams();
    const [textbox, setTextbox] = useState("")
    const [liveView, setLiveView] = useState<LiveViewResponse | undefined>(undefined)
    useEffect(() => {
        if (!uuid) return;
        startPolling()
        getLiveClusters(uuid).then(setLiveView)
    }, [uuid])

    function startPolling() {
        setInterval(() => {
            if (uuid) {
                updateBallSizes(uuid)
                getLiveClusters(uuid).then(setLiveView)
            }
        }, 1000)
    }

    function sendMessage(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key !== 'Enter') {
            return
        }

        if (liveView) {
            setTextbox("")
            sendChatMessage(textbox)
            let newMessage: Message = {text: textbox};
            const extendedSortedMessages: Message[] = liveView.sortedMessages.length > 0 ? [...liveView.sortedMessages, newMessage] : [newMessage]
            setLiveView({...liveView, sortedMessages: extendedSortedMessages})
        }
    }


    return <>
        <h1 className="problem-title">{liveView?.problemTitle}</h1>
        <div className="center-grid">
            {liveView?.solutions.map((solution, index) => (
                <Opinion key={index} solution={solution} index={index}></Opinion>))}
        </div>
        <div className="chatbox">
            <div className="messages">
                {liveView?.sortedMessages.map((message, index) => (<>
                    <p key={index} className="message">{message.text}</p>
                </>))}

            </div>
            <input value={textbox} onKeyDown={e => sendMessage(e)} onChange={e => setTextbox(e.target.value)}
                   className="chat" placeholder="Chat"/>
        </div>
    </>
}

export default Live