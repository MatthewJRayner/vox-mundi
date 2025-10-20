import { User } from "./user";
import { Culture } from "./culture";
import { UniversalItem } from "./universal";

export interface List {
    id?: number;
    user: User;
    name: string;
    description?: string;
    cultures: Culture[];
    items: UniversalItem[];
    visibility: 'public' | 'private';
    type: 'books' | 'films' | 'music' | 'artworks' | 'events' | 'mixed';
}