import { AbstractUserTracking } from "./media/abstract";
import { DateEstimate } from "./date";

export interface UserHistoryEvent extends AbstractUserTracking {
    title: string;
    alt_title?: string;
    type: string;
    date?: DateEstimate;
    location?: string;
    period?: string;
    sources?: string;
    significance_level?: number;
    importance_rank?: number;
    photo?: string;
    summary?: string;
}