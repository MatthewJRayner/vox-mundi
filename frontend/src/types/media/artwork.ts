import { AbstractUserTracking } from "./abstract";
import { AbstractMedia } from "./abstract";
import { UniversalItem } from "../universal";

export interface Artwork extends AbstractMedia {
    group: 'artwork' | 'artifact';
    location?: string;
    associated_culture?: string;
    photo?: string;
    model_3d?: string;
    type?: string;
    universal_item?: UniversalItem;
    wikidata_id?: string;
}

export interface UserArtwork extends AbstractUserTracking {
    universal_item: UniversalItem;
    photo?: string;
    themes?: string[];
    owned?: boolean;
}