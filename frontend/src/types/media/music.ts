import { AbstractUserTracking } from "./abstract";
import { Person } from "../person";
import { Period } from "../culture";
import { User } from "../user"; 
import { Culture } from "../culture";


export interface UserMusicPiece extends AbstractUserTracking {
    title?: string;
    artist?: string;
    instrument?: string;
    recording?: string;
    sheet_music?: string[];
    learned: boolean;
    culture_ids?: number[];
    release_year?: number;
}

interface Album {
    title: string;
    release_year?: number;
    cover?: string;
}

interface Song {
    title: string;
    release_year?: number;
}

export interface UserMusicArtist extends AbstractUserTracking {
    name: string;
    person?: Person;
    bio?: string;
    photo?: string;
    external_links?: string[];
    year_active_start?: number;
    year_active_end?: number;
    genres?: string[];
    notable_works?: string[];
    ranking_tier?: number;
    favourite?: boolean;
    best_albums?: Album[];
    best_songs?: Song[];
    culture_ids?: number[];
}

export interface UserMusicComposer extends AbstractUserTracking {
    name: string;
    alt_name?: string;
    occupations?: string[];
    birth_year?: number;
    death_year?: number;
    period?: Period;
    photo?: string;
    summary?: string;
    famous?: string[];
    themes?: string[];
    instruments?: string[];
    period_id?: number;
    culture_ids?: number[];
}

interface SavedLocation {
    lat: number;
    lng: number;
}

export interface UserComposerSearch {
    id?: number;
    user: User;
    culture: Culture;
    composer_list: string[];
    saved_location: SavedLocation;
}