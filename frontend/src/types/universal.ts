import { Culture } from "./culture";

export interface UniversalItem {
    id: number;
    title: string;
    creator_string?: string;
    type: string;
    cultures: Culture[];
}