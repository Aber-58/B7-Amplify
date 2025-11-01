import {useState} from "react";
import {handleError, loginUser} from "../../service/fetchService";
import {useNavigate, useParams} from "react-router";
import {Navigation} from "../Navigation";

function Login() {
    const {uuid} = useParams();
    const [username, setUsername] = useState("")
    let navigate = useNavigate();

    function sendLogin() {
        return loginUser(username).then((() => {
            navigate(`${Navigation.POLL}/${uuid}`);
        })).catch(error => handleError(error, () => navigate((Navigation.ERROR))))
    }

    return <>
        <h1>Login</h1>
        <input value={username} onChange={(e) => setUsername((e.target.value))} placeholder="Username"/>
        <button onClick={() => sendLogin()}>Send</button>
    </>
}

export default Login