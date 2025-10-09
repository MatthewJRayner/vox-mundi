import { AbstractUserTracking } from "./media/abstract";

export interface LangLesson extends AbstractUserTracking {
    topic: string;
    lesson: string;
    examples?: string;
    level: 'beginner' | 'intermediate' | 'advanced';
}