"use client";

import React, { useState } from "react";

import { SVGPath } from "@/utils/path";

type Ingredient = {
  name: string;
  quantity: number;
  measurement: string;
};

type Props = {
  ingredients: Ingredient[];
  setIngredients: (i: Ingredient[]) => void;
};

/**
 * Collapsible editor for managing recipe ingredients.
 *
 * Supports name, quantity, and measurement (with common units).
 * Controlled — updates parent via `setIngredients`.
 *
 * @param ingredients - Array of ingredient objects
 * @param setIngredients - Callback to update ingredients in parent
 *
 * @example
 * <IngredientsEditor
 *   ingredients={ingredients}
 *   setIngredients={setIngredients}
 * />
 */

export default function IngredientsEditor({
  ingredients,
  setIngredients,
}: Props) {
  const [ingredientsView, setIngredientsView] = useState(false);

  const addIngredient = () =>
    setIngredients([
      ...ingredients,
      { name: "", quantity: 0, measurement: "" },
    ]);

  const updateIngredient = (
    index: number,
    field: keyof Ingredient,
    value: string
  ) => {
    const updated = [...ingredients];
    if (field === "quantity") {
      updated[index][field] = value ? parseFloat(value) : 0;
    } else {
      updated[index][field] = value;
    }
    setIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  return (
    <div className="p-2 shadow rounded bg-extra w-full">
      <button
        type="button"
        className="mb-2 w-full text-left text-sm sm:text-base cursor-pointer flex items-center justify-between"
        onClick={() => setIngredientsView(!ingredientsView)}
      >
        <span
          className={`mr-1 transition ${ingredientsView ? "text-main" : ""}`}
        >
          Ingredients
        </span>
        <span className={`transition duration-400 text-foreground/50`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={SVGPath.chevron.viewBox}
            fill="currentColor"
            className={`w-4 h-4 transition-transform ${
              ingredientsView ? "rotate-180" : ""
            }`}
          >
            <path
              fillRule="evenodd"
              d={SVGPath.chevron.path}
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>
      {ingredientsView && (
        <>
          {ingredients.map((ingredient, index) => (
            <div key={index} className="mb-3 p-2 rounded">
              <input
                type="text"
                placeholder="Ingredient Name"
                value={ingredient.name}
                onChange={(e) =>
                  updateIngredient(index, "name", e.target.value)
                }
                className="border-foreground border-b-2 p-1 w-full text-sm sm:text-base mb-2"
              />
              <input
                type="number"
                placeholder="Quantity"
                value={ingredient.quantity}
                onChange={(e) =>
                  updateIngredient(index, "quantity", e.target.value)
                }
                className="border-foreground border-b-2 p-1 w-full text-sm sm:text-base mb-2"
                step="0.01"
              />
              <select
                name="measurement"
                value={ingredient.measurement}
                onChange={(e) =>
                  updateIngredient(index, "measurement", e.target.value)
                }
                className="bg-extra border-b-2 py-2 w-full rounded-t text-sm sm:text-base"
              >
                <option value="">-- Select Measurement --</option>
                <option value="g">Grams (g)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="mL">Milliliters (mL)</option>
                <option value="L">Liters (L)</option>
                <option value="oz">Ounces (oz)</option>
                <option value="lb">Pounds (lb)</option>
                <option value="fl oz">Fluid Ounces (fl oz)</option>
                <option value="qt">Quarts (qt)</option>
                <option value="cup">Cups</option>
                <option value="tsp">Teaspoons (tsp)</option>
                <option value="tbsp">Tablespoons (tbsp)</option>
                <option value="Units">Units</option>
                <option value="Units">Cans</option>
                <option value="Undefined">Undefined</option>
              </select>
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="bg-red-400 rounded-sm text-white px-2 py-1 mt-2 text-sm sm:text-base hover:text-background hover:bg-red-500 transition cursor-pointer active:scale-95"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addIngredient}
            className="bg-primary text-sm sm:text-base text-white px-2 py-2 rounded hover:text-background hover:bg-extra-mid transition cursor-pointer active:scale-95"
          >
            + Add Ingredient
          </button>
        </>
      )}
    </div>
  );
}
