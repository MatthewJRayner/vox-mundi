import { AbstractUserTracking } from "./abstract";

export interface Ingredient {
    name: string;
    quantity: number;
    measurement: string;
}

export interface Instruction {
    step: number;
    info: string;
}

export interface Recipe extends AbstractUserTracking {
    name: string;
    region?: string;
    cooking_time?: number;
    ingredients: Ingredient[];
    instructions: Instruction[];
    types: string[];
    course: string;
    serving_size?: number;
    photo?: string;
}

