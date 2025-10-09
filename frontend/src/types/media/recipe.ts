import { AbstractUserTracking } from "./abstract";

export interface Ingredient {
    name: string;
    quantity: number;
}

export interface Instruction {
    step: number;
    info: string;
}

export interface Recipe extends AbstractUserTracking {
    id: number;
    name: string;
    region?: string;
    cooking_time?: number;
    ingredients: Ingredient[];
    instructions: Instruction[];
    type: string;
    course: string;
    serving_size?: string;
    photo?: string;
}

