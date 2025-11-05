/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { SVGPath } from "@/utils/path";
import { Recipe, Ingredient } from "@/types/media/recipe";

type RecipeCardProps = {
  recipe: Recipe;
  onDelete?: (id: number) => void;
};

/**
 * Compact card displaying a single recipe with photo, name, course, and types.
 *
 * Supports expandable ingredients list and optional delete action.
 * Links to full recipe detail page.
 *
 * @param recipe - Recipe data to display
 * @param onDelete - Optional callback when delete is clicked (admin mode)
 *
 * @example
 * <RecipeCard recipe={recipe} onDelete={handleDelete} />
 */

export default function RecipeCard({ recipe, onDelete }: RecipeCardProps) {
  const { culture } = useParams();
  const [showIngredients, setShowIngredients] = useState(false);

  return (
    <div
      className="rounded-lg shadow-md hover:shadow-lg p-3 sm:p-4 flex flex-col items-center text-center bg-extra transition"
      aria-labelledby={`recipe-${recipe.id}`}
    >
      {recipe.photo && (
        <img
          src={recipe.photo}
          alt={recipe.name}
          className="h-24 sm:h-36 object-contain mb-3 rounded-lg"
        />
      )}
      <h2
        id={`recipe-${recipe.id}`}
        className="font-semibold font-inter text-sm sm:text-base"
      >
        {recipe.name}
      </h2>
      <p className="text-xs sm:text-sm text-foreground/50">
        {recipe.types?.join(", ") || ""}
      </p>
      <p className="mt-2 text-sm md:text-base">{recipe.course}</p>
      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <div className="mt-2 w-full flex flex-col">
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
            <span className={`${showIngredients ? "text-primary" : ""}`}>
              <svg
                viewBox={SVGPath.chevron.viewBox}
                className={`w-4 h-4 fill-foreground transition-transform duration-400 ${
                  showIngredients ? "transform rotate-180" : ""
                }`}
              >
                <path d={SVGPath.chevron.path} />
              </svg>
            </span>
          </button>
          {showIngredients && (
            <ul className="mt-1 sm:mt-2 space-y-1 text-xs sm:text-sm w-full">
              {recipe.ingredients.map((ing: Ingredient, idx: number) => (
                <li
                  key={idx}
                  className="ml-2 flex justify-between w-full items-center"
                >
                  <div className="max-w-4/5 text-left truncate">
                    <span className="font-semibold">{ing.name}</span>
                  </div>
                  <div className="w-1/5">
                    {ing.measurement == "Units"
                      ? `x ${ing.quantity}`
                      : ing.quantity || ""}{" "}
                    {ing.measurement !== "Units" &&
                      ing.measurement !== "Undefined" &&
                      ing.measurement}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="mt-2 sm:mt-3 flex gap-4">
        <Link
          href={`/${culture}/cuisine/${recipe.id}`}
          className="text-primary cursor-pointer hover:opacity-80 text-sm md:text-base"
          aria-label={`${recipe.name}`}
          title={`${recipe.name} Info`}
        >
          See More
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
