// Use relative URL - works in both production (Render.com) and development
import {Endpoints} from "./Endpoints";
import {TopicResponse} from "./model/TopicResponse";
import {JoinResponse} from "./model/JoinResponse";
import {LiveViewResponse} from "./model/LiveViewResponse";
import {AllTopicOpinions} from "./model/AllTopicOpinions";
import {Solution} from "./model/Solution";
import {Opinion} from "./model/Opinion";
import {Dictionary} from "./model/Dictionary";
import {LiveClusterResponse} from "./LiveClusterResponse";
import {MessageResponse} from "./model/MessageResponse";
import {Message} from "./model/Message";

const API_ENDPOINT = '/api';
const JSON_HEADER = {'Content-Type': 'application/json'};

export function loginUser(username: string): Promise<void> {
    return fetch(`${API_ENDPOINT}/${Endpoints.LOGIN}`, {
        method: 'POST',
        headers: JSON_HEADER,
        credentials: 'include',  // Include cookies for session management
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
        credentials: 'include',  // Changed from 'same-origin' to 'include' for cross-origin compatibility
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
        credentials: 'include',  // Changed from 'same-origin' to 'include' for cross-origin compatibility
        body: JSON.stringify({opinion, rating})
    }).then(res => res.ok ? Promise.resolve() : Promise.reject(res.statusText))
}

export function getAllOpinions(): Promise<AllTopicOpinions> {
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

export function getClusterCircleSize(uuid: string): Promise<Dictionary<number>> {
    return fetch(`${API_ENDPOINT}/${Endpoints.GET_CIRCLE_SIZES}/${uuid}`, {
        method: 'GET',
        headers: JSON_HEADER,
    }).then(async res => {
        if (res.ok) {
            return res.json();
        }
        return Promise.reject(res.statusText)
    })
}

export async function getLiveClusters(uuid: string): Promise<LiveViewResponse> {
    const clusterData: LiveClusterResponse = await fetch(`${API_ENDPOINT}/${Endpoints.CLUSTERS}/${uuid}`, {
        method: 'GET',
        headers: JSON_HEADER,
    }).then(res => res.json());
    const messages = await getLastMessages()
    const clusterSizeData = new Map<string, number>(Object.entries(await getClusterCircleSize(uuid)));
const topic = await getTopicInfo(uuid);
    const solutions: Solution[] = Object.entries(clusterData.mistral_result).map(([key, value]) => {
        return ({solutionTitle: key, solutionWeight: clusterSizeData.get(key) ?? 0});
    })

    const sortedMessages: Message[] = messages.messages.map(m => ({text: m}))
    const opinions: Opinion[] = Object.values(clusterData.mistral_result).map(opinion => ({opinion, author: "-"}))

    const view: LiveViewResponse = ({
        problemTitle: topic.topic,
        opinions: opinions,
        solutions: solutions,
        sortedMessages
    })

    return view;
}

export function getClusters(uuid: string) {
    return fetch(`${API_ENDPOINT}/${Endpoints.CLUSTERS}/${uuid}`, {
        method: 'GET',
        headers: JSON_HEADER,
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

export function triggerCluster(uuid: string): Promise<{ status: string, cooldown: number }> {
    return fetch(`${API_ENDPOINT}/${Endpoints.CLUSTER}/${uuid}`, {
        method: 'POST',
        headers: JSON_HEADER,
    }).then(res => {
        if (res.ok) {
            return res.json();
        }
        return Promise.reject(res.statusText);
    });
}

export function sendChatMessage(message: String): Promise<void> {
    return fetch(`${API_ENDPOINT}/${Endpoints.CHAT_ADD}`, {
        method: 'POST',
        headers: JSON_HEADER,
        body: JSON.stringify({message}),
    }).then(res => {
        if (res.ok) {
            return res.json();
        }
        return Promise.reject(res.statusText);
    });
}


export function getLastMessages(): Promise<MessageResponse> {
    return fetch(`${API_ENDPOINT}/${Endpoints.CHAT_LAST}/10`, {
        method: 'GET',
        headers: JSON_HEADER,
    }).then(res => {
        if (res.ok) {
            return res.json();
        }
        return Promise.reject(res.statusText);
    });
}

export function updateBallSizes(uuid: string): Promise<void> {
    return fetch(`${API_ENDPOINT}/${Endpoints.UPDATE_BALL_SIZES}/${uuid}`, {
        method: 'POST',
        headers: JSON_HEADER,
    }).then(res => res.ok ? Promise.resolve() : Promise.reject(res.statusText))
}