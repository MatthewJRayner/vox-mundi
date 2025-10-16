"use client";

import { useState } from "react";
import { Recipe, Ingredient } from "@/types/media/recipe";
import Link from "next/link";
import { SVGPath } from "@/utils/path";

type RecipeCardProps = {
  recipe: Recipe;
  onDelete?: (id: number) => void;
};

export default function RecipeCard({ recipe, onDelete }: RecipeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);

  return (
    <div
      className="rounded-lg shadow-md p-3 sm:p-4 flex flex-col items-center text-center bg-neutral transition hover:scale-105"
      aria-labelledby={`recipe-${recipe.id}`}
    >
      {recipe.photo && (
        <img
          src={recipe.photo}
          alt={recipe.name}
          className="h-48 sm:h-64 object-contain mb-3"
        />
      )}
      <h2 id={`recipe-${recipe.id}`} className="font-semibold font-inter text-sm sm:text-base">
        {recipe.name}
      </h2>
      <p className="text-xs sm:text-sm text-foreground/50">{recipe.type}</p>
      <p className="mt-1 sm:mt-2">{recipe.course}</p>
      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <div className="mt-2 sm:mt-3 w-full flex flex-col">
          <button
            onClick={() => setShowIngredients(!showIngredients)}
            className="flex w-full text-sm md:text-base items-center justify-center cursor-pointer"
            aria-expanded={showIngredients}
          >
            <span
              className={`mr-1 transition ${
                showIngredients ? "text-primary" : ""
              }`}
            >
              Ingredients
            </span>
            <span
              className={`transition duration-400 ${
                showIngredients ? "text-primary transform rotate-180" : ""
              }`}
            >
              <svg
                viewBox={SVGPath.chevron.viewBox}
                className={`w-4 h-4 transition-transform ${
                  showIngredients ? "rotate-180" : ""
                }`}
              >
                <path d={SVGPath.chevron.path} />
              </svg>
            </span>
          </button>
          {showIngredients && (
            <ul className="mt-1 sm:mt-2 space-y-1 text-xs sm:text-sm w-full">
              {recipe.ingredients.map((ing: Ingredient, idx: number) => (
                <li key={idx} className="ml-2 flex justify-between w-full">
                  <div className="max-w-4/5 text-left truncate">
                    <span className="font-semibold">{ing.name}</span>
                  </div>
                  <div className="w-1/5">
                    {ing.quantity} {ing.measurement}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-2 sm:mt-3 text-sm text-primary cursor-pointer hover:text-neutral-mid"
        aria-expanded={expanded}
      >
        {expanded ? "Hide Details" : "Show Details"}
      </button>
      {expanded && (
        <div className="mt-2 text-left w-full space-y-2 text-sm text-neutral-mid">
          {recipe.serving_size && (
            <p>
              <strong>Serving Size:</strong> {recipe.serving_size}
            </p>
          )}
          {recipe.region && (
            <p>
              <strong>Region:</strong> {recipe.region}
            </p>
          )}
          {recipe.instructions && recipe.instructions.length > 0 && (
            <div>
              <strong>Instructions:</strong>
              <ol className="list-decimal ml-4">
                {recipe.instructions.map((instr, idx) => (
                  <li key={idx}>{instr.step}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
      <div className="mt-2 sm:mt-3 flex gap-4">
        <Link
          href={`/recipes/${recipe.id}/edit`}
          className="text-primary cursor-pointer hover:text-neutral-mid"
          aria-label={`Edit ${recipe.name}`}
        >
          Edit
        </Link>
        {onDelete && recipe.id && (
          <button
            onClick={() => onDelete(recipe.id!)}
            className="text-danger cursor-pointer hover:text-red-500"
            aria-label={`Delete ${recipe.name}`}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}