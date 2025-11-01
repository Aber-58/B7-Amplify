import {useState} from "react";
import {createTopic, handleError} from "../../service/fetchService";
import {useNavigate} from "react-router";
import {Navigation} from "../Navigation";

function Admin() {
    const [topic, setTopic] = useState("")
    let navigation = useNavigate();
    function sendCreateTopic() {
        createTopic(topic).then(topic => {
            navigation(`${Navigation.INVITE}/${topic.uuid}`);
        }).catch(error => handleError(error, () => navigation((Navigation.ERROR))))
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8">
                <h1 className="text-3xl font-bold text-primary text-center mb-8">Admin</h1>
                <div className="space-y-4">
                    <input 
                        value={topic} 
                        onChange={e => setTopic(e.target.value)} 
                        placeholder="Topic"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
                    />
                    <button 
                        onClick={() => sendCreateTopic()}
                        className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors font-medium"
                    >
                        Erstellen
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Admin