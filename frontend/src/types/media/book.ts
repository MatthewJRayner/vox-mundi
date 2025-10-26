import { AbstractMedia } from "./abstract";
import { AbstractUserTracking } from "./abstract";
import { UniversalItem } from "../universal";
import { Period } from "../culture";

export interface Book extends AbstractMedia {
  isbn?: string;
  series?: string;
  volume?: string;
  cover?: string;
  synopsis?: string;
  industry_rating?: number;
  genre?: string[];
  languages?: string[];
  universal_item?: UniversalItem;
  ol_id?: string;
  userbook?: UserBook;
}

export interface UserBook extends AbstractUserTracking {
  universal_item: UniversalItem;
  page_count?: number;
  translated?: boolean;
  format?: string;
  cover?: string;
  publisher?: string;
  edition?: string;
  edition_read_year?: number;
  date_started?: string;
  date_finished?: string;
  read_language?: string;
  owned?: boolean;
  read?: boolean;
  readlist?: boolean;
  favourite?: boolean;
  isbn?: string;
  period?: Period;
}

export interface BookPageData {
  readlist?: Book[];
  favourites?: Book[];
  recent?: Book[];
  fallback?: Book[];
}
