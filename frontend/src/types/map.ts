import { Culture } from "./culture";
import { Period } from "./culture";
import { DateEstimate } from "./date";

export interface Location {
    lat: number;
    lng: number;
}

export interface MapPreferences {
    id?: number;
    culture: Culture;
    center?: Location;
    zoom?: number;
}

export interface MapPin {
    id?: number;
    cultures: Culture[];
    period?: Period;
    type: string;
    filter?: string;
    loc: Location;
    visibility: 'public' | 'private';
    title?: string;
    photo?: string;
    date?: DateEstimate;
    location?: string;
    happened?: string;
    significance?: string;
    period_id?: number;
    culture_ids?: number[];
    external_link?: string;
}