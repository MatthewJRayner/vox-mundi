"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Recipe, Ingredient, Instruction } from "@/types/media/recipe";
import { SVGPath } from "@/utils/path";

export default function CuisineIDPage() {
  const { culture, id } = useParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useImperial, setUseImperial] = useState(false);
  const [servingSize, setServingSize] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const recipeRes = await api.get(`/recipes/${id}`);
      setRecipe(recipeRes.data);
      setServingSize(recipeRes.data.serving_size || 1);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load recipe. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const scaleIngredients = (ingredient: Ingredient): Ingredient => {
    if (!servingSize || !recipe?.serving_size) return ingredient;
    const scaleFactor = servingSize / recipe.serving_size;
    return {
      ...ingredient,
      quantity: Number((ingredient.quantity * scaleFactor).toFixed(2)),
    };
  };

  const convertUnits = (ingredient: Ingredient): Ingredient => {
    if (ingredient.measurement === "Units" || ingredient.measurement === "Undefined" || ingredient.measurement === "Cans") {
      return ingredient; // No conversion for Units or Undefined
    }

    const conversions: {
      [key: string]: { metricUnit: string; imperialUnit: string; toImperial: number; toMetric: number };
    } = {
      kg: { metricUnit: "kg", imperialUnit: "lb", toImperial: 2.204623, toMetric: 1 / 2.204623 },
      g: { metricUnit: "g", imperialUnit: "oz", toImperial: 0.03527396, toMetric: 1 / 0.03527396 },
      L: { metricUnit: "L", imperialUnit: "qt", toImperial: 1.056688, toMetric: 1 / 1.056688 },
      mL: { metricUnit: "mL", imperialUnit: "fl oz", toImperial: 0.033814, toMetric: 1 / 0.033814 },
      tsp: { metricUnit: "tsp", imperialUnit: "tsp", toImperial: 1, toMetric: 1 },
      tbsp: { metricUnit: "tbsp", imperialUnit: "tbsp", toImperial: 1, toMetric: 1 },
      cup: { metricUnit: "mL", imperialUnit: "cup", toImperial: 0.00416667, toMetric: 1 / 0.00416667 }, // 1 cup ≈ 240 mL
    };

    const currentUnit = ingredient.measurement;
    const conversion = Object.values(conversions).find(
      (c) => c.metricUnit === currentUnit || c.imperialUnit === currentUnit
    );

    if (!conversion) {
      return { ...ingredient, measurement: "Undefined" };
    }

    let convertedQuantity = ingredient.quantity;
    let convertedMeasurement = ingredient.measurement;

    if (useImperial && conversion.metricUnit === currentUnit) {
      // Convert from metric to imperial
      convertedQuantity *= conversion.toImperial;
      convertedMeasurement = conversion.imperialUnit;
    } else if (!useImperial && conversion.imperialUnit === currentUnit) {
      // Convert from imperial to metric
      convertedQuantity *= conversion.toMetric;
      convertedMeasurement = conversion.metricUnit;
    }

    return {
      ...ingredient,
      quantity: Number(convertedQuantity.toFixed(2)),
      measurement: convertedMeasurement,
    };
  };

  const handleServingSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (value >= 1) {
      setServingSize(value);
    }
  };

  if (loading) return <main className="p-4">Loading...</main>;
  if (error) return <main className="p-4 text-red-500">{error}</main>;
  if (!recipe) return <main className="p-4">No recipe found.</main>;

  return (
    <div className="w-full flex flex-col md:flex-row md:space-x-4 p-4 space-y-4 md:space-y-0">
      <Link
        href={`/${culture}/cuisine`}
        className="text-main hover:opacity-80 text-sm md:text-base"
        aria-label="Back to cuisine list"
      >
        <span>
          <svg
            viewBox={SVGPath.arrow.viewBox}
            className={`size-4 md:size-5 fill-current transition hover:scale-105 active:scale-95`}
          >
            <path d={SVGPath.arrow.path} />
          </svg>
        </span>
      </Link>
      <section className="w-full md:w-1/2 flex flex-col space-y-4 items-center md:items-start">
        <img
          src={recipe.photo || "/placeholder-image.png"}
          className="w-full max-w-[300px] md:max-w-[400px] object-contain rounded shadow-xl border-foreground border-2"
          alt={recipe.name || "Recipe image"}
        />
        <div className="flex flex-col items-center md:items-start w-full mt-2">
          <h3 className="font-garamond text-lg md:text-2xl font-bold">
            {recipe.course}
          </h3>
          <h6 className="text-sm md:text-base text-foreground/50">
            {recipe.types?.join(", ") || "No types"}
          </h6>
        </div>
      </section>
      <section className="w-full md:w-1/2 flex flex-col items-start space-y-4">
        <div className="w-full flex flex-col">
          <h1 className="font-garamond text-2xl md:text-5xl font-bold text-main">
            {recipe.name}
          </h1>
          <h3 className="text-foreground/50 text-sm md:text-base mt-2">
            {recipe.region || "No region specified"}
          </h3>
          <h3 className="text-foreground/50 text-sm md:text-base">
            {recipe.cooking_time ? `${recipe.cooking_time}m` : "No cooking time"}
          </h3>
          <div className="flex items-center space-x-2">
            <label
              htmlFor="serving-size"
              className="text-sm md:text-base text-foreground/50"
            >
              Serving:
            </label>
            <input
              id="serving-size"
              type="number"
              min="1"
              value={servingSize || 1}
              onChange={handleServingSizeChange}
              className="bg-extra shadow p-1 w-16 rounded text-sm sm:text-base"
              aria-label="Adjust serving size"
            />
            <span className="text-sm md:text-base text-foreground/50">
              {servingSize && servingSize > 1 ? "people" : "person"}
            </span>
          </div>
        </div>
        <div className="w-full flex flex-col">
          <div className="flex items-center space-x-4">
            <h6 className="font-garamond text-xl md:text-2xl text-main">
              Ingredients
            </h6>
            <button
              type="button"
              onClick={() => setUseImperial(!useImperial)}
              className="bg-primary text-white px-2 py-1 rounded text-sm hover:bg-extra-mid transition cursor-pointer active:scale-95"
              aria-label={`Switch to ${useImperial ? "metric" : "imperial"} units`}
              title="Change System"
            >
              {useImperial ? "Imperial" : "Metric"}
            </button>
          </div>
          {recipe.ingredients.length === 0 ? (
            <p className="text-foreground/50 text-sm md:text-base">
              No ingredients listed.
            </p>
          ) : (
            <ul className="mt-2 space-y-2 w-full">
              {recipe.ingredients.map((ing: Ingredient, idx: number) => {
                const scaledIng = scaleIngredients(ing);
                const convertedIng = convertUnits(scaledIng);
                return (
                  <li
                    key={idx}
                    className="ml-2 flex space-x-2 w-full items-center"
                  >
                    <div className="max-w-4/5 text-left truncate">
                      <span className="text-base md:text-lg">
                        {convertedIng.name}
                      </span>
                    </div>
                    <div className="w-1/5 text-sm md:text-base">
                      {convertedIng.measurement === "Units"
                        ? `x ${convertedIng.quantity}`
                        : convertedIng.quantity || ""}{" "}
                      {convertedIng.measurement !== "Units" &&
                        convertedIng.measurement !== "Undefined" &&
                        convertedIng.measurement}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="w-full flex flex-col">
          <h6 className="font-garamond text-xl md:text-2xl text-main">
            Recipe
          </h6>
          {recipe.instructions.length === 0 ? (
            <p className="text-foreground/50 text-sm md:text-base">
              No instructions listed.
            </p>
          ) : (
            <ul className="mt-2 space-y-2 w-full">
              {recipe.instructions.map((inst: Instruction, idx: number) => (
                <li
                  key={idx}
                  className="ml-2 flex space-x-2 w-full items-center"
                >
                  <div className="text-left">
                    <span className="text-xs md:text-sm">{inst.step}.</span>
                  </div>
                  <div className="text-base md:text-lg">{inst.info}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {recipe.notes && (
          <div className="w-full flex flex-col">
            <h6 className="font-garamond text-xl md:text-3xl text-main">
              Notes
            </h6>
            <p className="mt-2 text-sm md:text-base text-foreground">
              {recipe.notes}
            </p>
          </div>
        )}
        <Link
          href={`/${culture}/cuisine/${id}/edit`}
          className="text-base md:text-lg text-primary hover:opacity-80 cursor-pointer"
          aria-label="Edit recipe"
        >
          Edit
        </Link>
      </section>
    </div>
  );
}