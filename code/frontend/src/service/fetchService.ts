// TODO: dont hardcode the API url :/
import {Endpoints} from "./Endpoints";
import {JoinResponse, TopicResponse} from "./model/TopicResponse";

const API_ENDPOINT = `http://localhost:4200/api`;
const JSON_HEADER = {'Content-Type': 'application/json'};

export function loginUser(username: string): Promise<void> {
    return fetch(`${API_ENDPOINT}/${Endpoints.LOGIN}`, {
        method: 'POST',
        headers: JSON_HEADER,
        body: JSON.stringify({username})
    }).then(res => res.ok ? Promise.resolve() : Promise.reject(res.statusText))
}

export function createTopic(topic: string): Promise<TopicResponse> {
    return fetch(`${API_ENDPOINT}/${Endpoints.ADMIN}`, {
        method: 'POST',
        headers: JSON_HEADER,
        body: JSON.stringify({topic})
    }).then(res => {
        if (res.ok) {
            return res.json();
        }
        return Promise.reject(res.statusText)
    })
}

export function validateSession(): Promise<void> {
    return fetch(`${API_ENDPOINT}/${Endpoints.VALIDATE}`, {
        method: 'GET',
        headers: JSON_HEADER,
        credentials: 'same-origin',
    }).then(res => res.ok ? Promise.resolve() : Promise.reject(res.statusText))
}

export function joinSession(uuid: string): Promise<JoinResponse> {
    return fetch(`${API_ENDPOINT}/${Endpoints.JOIN}/${uuid}`, {
        method: 'POST',
        headers: JSON_HEADER,
        credentials: 'same-origin',
    }).then(res => {
        if (res.ok) {
            return res.json();
        }
        return Promise.reject(res.statusText)
    })
}

export function createOpinion(uuid: string, opinion: string, rating: number): Promise<void> {
    return fetch(`${API_ENDPOINT}/${Endpoints.POLL}/${uuid}`, {
        method: 'POST',
        headers: JSON_HEADER,
        credentials: 'same-origin',
        body: JSON.stringify({opinion, rating})
    }).then(res => res.ok ? Promise.resolve() : Promise.reject(res.statusText))
}

export function handleError(errorText: string, callback: () => void) {
    alert(errorText)
    callback()
}