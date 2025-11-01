// TODO: dont hardcode the API url :/
const API_ENDPOINT = `http://localhost:4200/api`;


export function loginUser(username: string) {
    return fetch(`${API_ENDPOINT}/login`, {
        method: 'POST',
        body: JSON.stringify({username})
    }).then(res => res.ok ? Promise.resolve() : Promise.reject())
}