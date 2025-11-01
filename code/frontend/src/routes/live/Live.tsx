import Opinion from "./opinion/Opinion";
import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router";
import {getLiveView, handleError} from "../../service/fetchService";
import {LiveViewResponse} from "../../service/model/TopicResponse";
import './Live.css'
import {Navigation} from "../Navigation";


function Live() {
    const {uuid} = useParams();
    const [textbox, setTextbox] = useState("")
    const navigate = useNavigate();
    useEffect(() => {
        if (!uuid) return;
        getLiveView(uuid).then(console.log)
            .catch((error) => handleError(error, () => navigate(Navigation.ERROR)));
    })

    const liveView: LiveViewResponse = {
        problemTitle: "Title",
        opinions: [
            {opinion: "Make shit good", author: "the real one"},
            {opinion: "Make shit bad", author: "the bad one"}
        ],
        solutions: [
            {solutionTitle: "Make more efforts to get good", solutionWeight: 10},
            {solutionTitle: "Make more efforts to make shit bad", solutionWeight: 5}
        ],
        sortedMessages: [
            {text: "Blah Blah", author: "Real Person", timestamp: new Date()},
            {text: "Blah Blah Blah Blah Blah Blah", author: "Another Real Person", timestamp: new Date()}
        ]
    }

    return <>
        <h1 className="problem-title">{liveView.problemTitle}</h1>
        <div className="center-grid">
            {liveView.solutions.map((solution, index) => (<Opinion solution={solution} index={index}></Opinion>))}
        </div>
        <div className="chatbox">
            <div className="messages">
                {liveView.sortedMessages.map((message) => (<>
                    <p className="message"
                       title={message.timestamp.toString()}>{`${message.author}: ${message.text}`}</p>
                </>))}

            </div>
            <input value={textbox} onChange={e => setTextbox(e.target.value)} className="chat" placeholder="Chat"/>
        </div>
    </>
}

export default Live