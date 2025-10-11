import { AbstractUserTracking } from "./media/abstract";
import { DateEstimate } from "./date";
import { Period } from "./culture";

export interface UserHistoryEvent extends AbstractUserTracking {
    title: string;
    alt_title?: string;
    type: string;
    date?: DateEstimate;
    location?: string;
    period?: Period;
    sources?: string;
    significance_level?: number;
    importance_rank?: number;
    photo?: string;
    summary?: string;
    period_id?: number;
    culture_ids?: number[];
}