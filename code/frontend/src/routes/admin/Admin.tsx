import {useState} from "react";
import {createTopic, handleError} from "../../service/fetchService";
import {useNavigate} from "react-router";
import {Navigation} from "../Navigation";

function Admin() {
    const [topic, setTopic] = useState("")
    let navigation = useNavigate();
    function sendCreateTopic() {
        createTopic(topic).then(uuid => {
            navigation(`${Navigation.INVITE}/${uuid}`);
    }

    return <>
        <h1>Admin</h1>
        <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic"/>
        <button onClick={() => sendCreateTopic()}>Erstellen</button>
    </>
}

export default Admin