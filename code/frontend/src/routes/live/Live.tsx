import Opinion from "./opinion/Opinion";
import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router";
import {getLiveView, handleError} from "../../service/fetchService";
import './Live.css'
import {Navigation} from "../Navigation";
import {LiveViewResponse} from "../../service/model/LiveViewResponse";


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
            {opinion: "Make more", author: "the real one"},
            {opinion: "Make mcool", author: "the fake one"},
            {opinion: "cycling infrastructure", author: "the bad one"}
        ],
        solutions: [
            {solutionTitle: "Make more", solutionWeight: 40}, // In total, all 3 solutionWeights should add up 60
            {solutionTitle: "Make less", solutionWeight: 11},
            {solutionTitle: "cycling infrastructure", solutionWeight: 10}
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