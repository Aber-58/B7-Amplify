import {Dictionary} from "./model/Dictionary";

export interface LiveClusterResponse {
    title: string,
    mistral_result: Dictionary<string>
}