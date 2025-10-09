import { AbstractMedia } from "./media/abstract";
import { AbstractUserTracking } from "./media/abstract";
import { UniversalItem } from "./universal";

export interface HistoryEvent extends AbstractMedia {
    type: string;
    location?: string;
    wikidata_id?: string;
    universal_item?: UniversalItem;
}

export interface UserHistoryEvent extends AbstractUserTracking {
    universal_item: UniversalItem;
    period?: string;
    sources?: string;
    significance_level?: number;
    importance_rank?: number;
    photo?: string;
    summary?: string;
}