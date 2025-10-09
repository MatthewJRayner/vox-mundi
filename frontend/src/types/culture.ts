import { User } from "./user";

export interface Culture {
    id: number;
    user: User;
    name: string;
    code: string;
    colour?: string;
    picture?: string;
    shared_group_key?: string;
    visibility: 'public' | 'private';
}

export interface Category {
    id: number;
    culture: Culture;
    key: string;
    display_name: string;
}

export interface Period {
    id: number;
    culture: Culture;
    category: Category;
    start_year: number;
    end_year: number;
    title: string;
    desc?: string;
    short_intro?: string;
}

export interface PageContent {
    id: number;
    culture: Culture;
    category: Category;
    intro_text?: string;
    overview_text?: string;
    extra_text?: string;
}

export interface Profile {
    id: number;
    user: User;
    bio?: string;
    avatar?: string;
    location?: string;
    website?: string;
    preferred_cultures: Culture[];
    display_reviews_publicly: boolean;
}