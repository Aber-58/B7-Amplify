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

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8">
                <h1 className="text-3xl font-bold text-primary text-center mb-8">Login</h1>
                <div className="space-y-4">
                    <input 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        placeholder="Username"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
                    />
                    <button 
                        onClick={() => sendLogin()}
                        className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors font-medium"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Login