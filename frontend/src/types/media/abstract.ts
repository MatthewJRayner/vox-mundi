import { Culture } from "../culture";
import { User } from "../user";
import { Person } from "../person";
import { DateEstimate } from "../date";

export interface AbstractUserTracking {
    id: number;
    user: User;
    cultures: Culture[];
    rating?: number;
    notes?: string;
    visibility: 'public' | 'private'
}

export interface AbstractMedia {
    id: number;
    title: string;
    alt_title?: string;
    creator?: Person;
    creator_string?: string;
    alt_creator_name?: string;
    date?: DateEstimate;
    external_links?: string[];
    tags?: string[];
}

