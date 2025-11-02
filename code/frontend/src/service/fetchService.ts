import {Endpoints} from "./Endpoints";
import {TopicResponse} from "./model/TopicResponse";
import {JoinResponse} from "./model/JoinResponse";
import {LiveViewResponse} from "./model/LiveViewResponse";
import {AllTopicOpinions} from "./model/AllTopicOpinions";

// API endpoint configuration
// Set REACT_APP_API_URL environment variable to override
const API_ENDPOINT = process.env.REACT_APP_API_URL || `http://localhost:4200/api`;
const JSON_HEADER = {'Content-Type': 'application/json'};

export function loginUser(username: string): Promise<void> {
    return fetch(`${API_ENDPOINT}/${Endpoints.LOGIN}`, {
        method: 'POST',
        headers: JSON_HEADER,
        credentials: 'include',  // Include credentials to receive and store cookies
        body: JSON.stringify({username})
    }).then(res => res.ok ? Promise.resolve() : Promise.reject(res.statusText))
}

export function createTopic(topic: string): Promise<TopicResponse> {
    return fetch(`${API_ENDPOINT}/${Endpoints.ADMIN}`, {
        method: 'POST',
        headers: JSON_HEADER,
        credentials: 'include',  // Include credentials for consistency
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
        credentials: 'include',  // Include credentials to send cookies
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
        credentials: 'include',  // Include credentials to send cookies
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

export function getLiveView(uuid: string): Promise<LiveViewResponse> {
    return fetch(`${API_ENDPOINT}/${Endpoints.LIVE}/${uuid}`, {
        method: 'GET',
        headers: JSON_HEADER,
        credentials: 'include',  // Include credentials to send cookies
    }).then(res => {
        if (res.ok) {
            return res.json();
        }
        return Promise.reject(res.statusText)
    })
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

export function triggerCluster(uuid: string): Promise<{status: string, cooldown: number}> {
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

export function deleteTopic(uuid: string): Promise<void> {
    return fetch(`${API_ENDPOINT}/${Endpoints.ADMIN}/${uuid}`, {
        method: 'DELETE',
        headers: JSON_HEADER,
        credentials: 'include',
    }).then(res => {
        if (res.ok) {
            return Promise.resolve();
        }
        return Promise.reject(res.statusText);
    });
}

export function addManualOpinion(uuid: string, opinion: string, rating: number, username: string = "admin"): Promise<void> {
    return fetch(`${API_ENDPOINT}/${Endpoints.ADMIN}/${uuid}/opinion`, {
        method: 'POST',
        headers: JSON_HEADER,
        credentials: 'include',
        body: JSON.stringify({opinion, rating, username})
    }).then(res => {
        if (res.ok) {
            return Promise.resolve();
        }
        return Promise.reject(res.statusText);
    });
}

export function resetEverything(): Promise<void> {
    return fetch(`${API_ENDPOINT}/${Endpoints.ADMIN}/reset`, {
        method: 'DELETE',
        headers: JSON_HEADER,
        credentials: 'include',
    }).then(res => {
        if (res.ok) {
            return Promise.resolve();
        }
        return Promise.reject(res.statusText);
    });
}