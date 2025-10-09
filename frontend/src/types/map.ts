import { Culture } from "./culture";
import { Period } from "./culture";
import { DateEstimate } from "./date";
import { Polygon, MultiPolygon } from "geojson"

export interface MapBorder {
    id: number;
    culture: Culture;
    period: Period;
    borders: Polygon | MultiPolygon;
}

export interface Location {
    lat: number;
    lng: number;
}

export interface MapPin {
    id: number;
    culture: Culture;
    period: Period;
    type: string;
    loc: Location;
    external_links?: string[];
    visibility: 'public' | 'private';
    title?: string;
    photo?: string;
    date?: DateEstimate;
    location?: string;
    happened?: string;
    significance?: string;
}