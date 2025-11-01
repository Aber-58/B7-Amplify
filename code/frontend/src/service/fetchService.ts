// TODO: dont hardcode the API url :/
import {Endpoints} from "./Endpoints";

const API_ENDPOINT = `http://localhost:4200/api`;


export function loginUser(username: string): Promise<void> {
    return fetch(`${API_ENDPOINT}/${Endpoints.LOGIN}`, {
        method: 'POST',
        body: JSON.stringify({username})
    }).then(res => res.ok ? Promise.resolve() : Promise.reject())
}