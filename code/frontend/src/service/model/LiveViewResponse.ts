import {Opinion} from "./Opinion";
import {Solution} from "./Solution";
import {Message} from "./Message";

export interface LiveViewResponse {
    problemTitle: string
    opinions: Opinion[],
    solutions: Solution[]
    sortedMessages: Message[]
}