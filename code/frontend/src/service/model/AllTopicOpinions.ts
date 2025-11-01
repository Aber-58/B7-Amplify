export interface AllTopicOpinions {
    opinions: {
        [uuid: string]: {
            content: string;
            opinions: {
                opinion: string;
                weight: number;
                username: string;
            }[];
        };
    };
}