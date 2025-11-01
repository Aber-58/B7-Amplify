// TODO: dont hardcode the API url :/
import {Endpoints} from "./Endpoints";
import {TopicResponse} from "./model/TopicResponse";
import {JoinResponse} from "./model/JoinResponse";
import {LiveViewResponse} from "./model/LiveViewResponse";
import {AllTopicOpinions} from "./model/AllTopicOpinions";

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
        credentials: 'include',
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

export function getAllOpinions(uuid: string): Promise<AllTopicOpinions> {
    return fetch(`${API_ENDPOINT}/${Endpoints.ADMIN}`, {
        method: 'GET',
        headers: JSON_HEADER,
    }).then(res => {
        if (res.ok) {
            return res.json();
        }
        return Promise.reject(res.statusText);
    });
}

export function getTopicInfo(uuid: string): Promise<{ topic: string, state: string }> {
    return fetch(`${API_ENDPOINT}/${Endpoints.TOPIC}/${uuid}`, {
        method: 'GET',
        headers: JSON_HEADER,
    }).then(res => {
        if (res.ok) {
            return res.json();
        }
        return Promise.reject(res.statusText)
    })
}

export function getLiveView(uuid: string): Promise<LiveViewResponse> {
    return fetch(`${API_ENDPOINT}/${Endpoints.LIVE}/${uuid}`, {
        method: 'GET',
        headers: JSON_HEADER,
        credentials: 'same-origin',
    }).then(res => {
        if (res.ok) {
            return res.json();
        }
        return Promise.reject(res.statusText)
    })
}

export function handleError(errorText: string, callback: () => void) {
    alert(errorText)
    callback()
}