import { DateEstimate } from "./date";

export interface Person {
    id: number;
    given_name: string;
    family_name: string;
    middle_name?: string;
    bio?: string;
    photo?: string;
    external_links?: string[];
    profession?: string;
    nationality?: string;
    birthplace?: string;
    birth_date?: DateEstimate;
    death_date?: DateEstimate;
    titles?: string;
    epithets?: string;
    resting_place?: string;
    notable_works?: string[];
    wikidata_id?: string;
}