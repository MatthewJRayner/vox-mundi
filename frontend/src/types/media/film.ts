import { AbstractMedia } from "./abstract";
import { AbstractUserTracking } from "./abstract";
import { UniversalItem } from "../universal";

export interface Member {
    name: string;
    role: string;
}

export interface Award {
    event: string;
    category: string;
    won: boolean;
}

export interface Film extends AbstractMedia {
    runtime?: string;
    genre?: string[];
    tmdb_id?: string;
    universal_item: UniversalItem;
    cast: Member[];
    crew: Member[];
    blurb?: string;
    synopsis?: string;
    languages?: string[];
    countries?: string[];
    festival?: string;
    poster?: string;
    background_pic?: string;
    budget?: number;
    box_office?: number;
    series?: string;
    volume?: string;
    release_date?: string;
}

export interface UserFilm extends AbstractUserTracking {
    universal_item: UniversalItem;
    rewatch_count: number;
    watch_location?: string;
    date_watched?: string;
    poster?: string;
    background_pic?: string;
    awards?: Award[];
    seen?: boolean;
    owned?: boolean;
    watchlist?: boolean;
    favourite?: boolean;
}