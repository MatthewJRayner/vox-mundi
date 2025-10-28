import { AbstractUserTracking } from "./media/abstract";
import { Person } from "./person";
import { Culture } from "./culture";

export interface CalendarDate extends AbstractUserTracking {
    holiday_name: string;
    date_text?: string;
    calendar_date?: string;
    traditions?: string;
    meaning?: string;
    photo?: string;
    person?: Person;
    isAnnual: boolean;
    type?: string;
    reference_system?: "gregorian" | "egyptian" | "islamic";
    cultures: Culture[];
}