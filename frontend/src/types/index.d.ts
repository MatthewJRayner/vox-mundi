export interface Culture {
    id: number;
    name: string;
    code: string;
    colour?: string;
    picture?: string;
}

export interface Period {
    id: number;
    title: string;
    start_year: number;
    end_year: number;
    desc?: string;
    short_intro?: string;
    category_id?: number;
}

export interface MapBorder {
    id: number;
    period: Period;
    borders: string[];
}

export interface MapPin {
    id: number;
    title?: string;
    type: string;
    loc: { lat: number; lon: number } | { lat: number; lng?: number; lon?: number };
    photo?: string;
    external_links?: string[];
    visibility: string;
    date?: { date?: string, date_estimate_start?: number };
    location?: string;
    happened?: string;
    significance?: string;
    period: Period;
}