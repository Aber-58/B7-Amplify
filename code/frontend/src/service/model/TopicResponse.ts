export interface TopicResponse {
    uuid: string,
    deadline: string,
}

enum TopicState {
    QUESTION = 'question',
    LOADING = 'loading',
    LIVE = 'live',
    RESULT = 'result',
}

export interface JoinResponse {
    topic: string,
    state: TopicState,
    username: string,
}