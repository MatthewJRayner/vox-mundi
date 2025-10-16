"use client";

import { useState } from "react";
import { Recipe, Ingredient } from "@/types/media/recipe";
import Link from "next/link";
import { SVGPath } from "@/utils/path";

type RecipeCardProps = {
  recipe: Recipe;
};

export default function RecipeCard(recipe: Recipe) {
  const [expanded, setExpanded] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);

  return (
    <div
      className={`rounded-lg shadow-md p-3 sm:p-4 flex flex-col items-center text-center bg-neutral transition hover:scale-110`}
    >
      {recipe.photo && (
        <img
          src={recipe.photo}
          alt={`${recipe.name}`}
          className="h-48 sm:h-64 object-contain mb-3"
        />
      )}

      <h2 className="font-semibold font-inter text-sm sm:text-base">
        {recipe.name}
      </h2>
      <p className="text-xs sm:text-sm text-foreground/50">{recipe.type}</p>
      <p className="mt-1 sm:mt-2">{recipe.course}</p>
      <span
        className={`mt-1 sm:mt-2 px-2 py-1 rounded text-xs ${
          music.owned ? "bg-green-200 text-success" : "bg-red-200 text-danger"
        }`}
      >
        {music.owned ? "Owned" : "Wishlist"}
      </span>

      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <div className="mt-2 sm:mt-3 w-full flex flex-col">
          <button
            onClick={() => setShowIngredients(!showIngredients)}
            className="flex w-full text-sm md:text-base items-center justify-center cursor-pointer"
          >
            <span
              className={`mr-1 transition ${
                showIngredients ? "text-primary" : ""
              }`}
            >
              Tracks
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
              {recipe.ingredients.map((ing, idx) => (
                <li key={idx} className="ml-2 flex justify-between w-full">
                  <div className="max-w-4/5 text-left truncate">
                    <span className="font-semibold">{ing.name}</span>{" "}
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
      >
        {expanded ? "Hide Details" : "Show Details"}
      </button>

      {expanded && (
        <div className="mt-t text-left w-full space-y-2 text-sm text-neutral-mid">
          {recipe.serving_size && (
            <p>
              <strong>Serving Size:</strong>{" "}
              {recipe.serving_size}
            </p>
          )}
          {recipe.region && (
            <p>
              <strong>Region:</strong>{" "}
              {recipe.region}
            </p>
          )}
          {music.release_date && (
            <p>
              <strong>Release Date:</strong> {music.release_date}
            </p>
          )}
          {music.catalog_number && (
            <p>
              <strong>Catalog #:</strong> {music.catalog_number}
            </p>
          )}
          {music.genre?.length ? (
            <p>
              <strong>Genre:</strong> {music.genre.join(", ")}
            </p>
          ) : null}
          {music.length && (
            <p>
              <strong>Length:</strong> {music.length}
            </p>
          )}
          {music.language && (
            <p>
              <strong>Language:</strong> {music.language}
            </p>
          )}
          {music.country && (
            <p>
              <strong>Country:</strong> {music.country}
            </p>
          )}
          {music.label && (
            <p>
              <strong>Label:</strong> {music.label}
            </p>
          )}
          {music.link && (
            <p>
              <strong>Link:</strong>{" "}
              <a
                href={music.link}
                target="_blank"
                className="text-primary cursor-pointer hover:text-neutral-mid"
              >
                View
              </a>
            </p>
          )}
          {music.notes && (
            <p>
              <strong>Notes:</strong> {music.notes}
            </p>
          )}
          {music.date_bought && (
            <p>
              <strong>Date Bought:</strong> {music.date_bought}
            </p>
          )}
        </div>
      )}

      <div className="mt-2 sm:mt-3 flex gap-4">
        <Link
          href={`/music/${music.id}/edit`}
          className="text-primary cursor-pointer hover:text-neutral-mid"
        >
          Edit
        </Link>
        <button
          onClick={() => onDelete(music.id!)}
          className="text-danger cursor-pointer hover:text-red-500"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
