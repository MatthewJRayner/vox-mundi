import { AbstractMedia } from "./abstract";
import { AbstractUserTracking } from "./abstract";
import { UniversalItem } from "../universal";
import { Person } from "../person";

export interface MusicPiece extends AbstractMedia {
    instrument?: string;
    recording?: string;
    sheet_music?: string;
    musicbrainz_id?: string;
    universal_item?: UniversalItem;
}

export interface UserMusicPiece extends AbstractUserTracking {
    universal_item: UniversalItem;
    learned?: boolean;
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
}