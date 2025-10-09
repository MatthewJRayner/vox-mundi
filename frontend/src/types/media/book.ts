import { AbstractMedia } from "./abstract";
import { AbstractUserTracking } from "./abstract";
import { UniversalItem } from "../universal";

export interface Book extends AbstractMedia {
    isbn?: string;
    series?: string;
    volume?: string;
    cover?: string;
    synopsis?: string;
    industry_rating?: number;
    genre?: string[];
    language?: string;
    universal_item?: UniversalItem;
}

export interface UserBook extends AbstractUserTracking {
    universal_item: UniversalItem;
    page_count?: number;
    is_history?: boolean;
    translated?: boolean;
    format?: string;
    cover?: string;
    publisher?: string;
    edition?: string;
    edition_read_year?: number;
    date_started?: string;
    date_finished?: string;
    location?: string;
    read_language?: string;
    owned?: boolean;
    read?: boolean;
    readlist?: boolean;
    favourite?: boolean;
}