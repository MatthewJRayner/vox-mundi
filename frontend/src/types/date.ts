export interface DateEstimate {
    id?: number;
    date_known?: boolean;
    date?: string;
    date_estimate_start?: number;
    date_estimate_end?: number;
    date_precision?: 'exact' | 'year' | 'decade' | 'century' | 'millennium' | 'unknown';
}