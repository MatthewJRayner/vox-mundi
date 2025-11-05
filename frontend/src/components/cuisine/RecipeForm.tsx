/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useCallback, useEffect } from "react";
import { ParamValue } from "next/dist/server/request/params";

import api from "@/lib/api";
import { SVGPath } from "@/utils/path";
import { Recipe } from "@/types/media/recipe";
import { Culture } from "@/types/culture";

import IngredientsEditor from "./IngredientsEditor";
import InstructionsEditor from "./InstructionsEditor";

/**
 * Full recipe creation/edit form with all fields.
 *
 * Includes name, course, types, ingredients, instructions, photo, visibility,
 * notes, and culture selection. Handles both create and update modes.
 *
 * @param initialData - Existing recipe for edit mode (optional)
 * @param onSuccess - Callback after successful save
 * @param currentCultureCode - Current culture code from URL
 *
 * @example
 * <RecipeForm
 *   initialData={recipe}
 *   onSuccess={refreshList}
 *   currentCultureCode="jp"
 * />
 */

type RecipeFormProps = {
  initialData?: Recipe;
  onSuccess: () => void;
  currentCultureCode: ParamValue;
};

export default function RecipeForm({
  initialData,
  onSuccess,
  currentCultureCode,
}: RecipeFormProps) {
  const [formData, setFormData] = useState<Recipe>(
    initialData || {
      name: "",
      course: "",
      types: [],
      ingredients: [],
      instructions: [],
      photo: "",
      visibility: "private",
      notes: "",
      cultures: [],
    }
  );
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [showCultureSelect, setShowCultureSelect] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentCultureCode) return;
    try {
      setLoading(true);
      const cultureRes = await api.get(`/cultures/`);
      setCultures(cultureRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentCultureCode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleCulture = (culture: Culture) => {
    setFormData((prev) => {
      const exists = prev.cultures?.some((c) => c.id === culture.id);
      const updated = exists
        ? prev.cultures?.filter((c) => c.id !== culture.id)
        : [...(prev.cultures || []), culture];
      return { ...prev, cultures: updated };
    });
  };

  const [typesInput, setTypesInput] = useState(
    (formData.types || []).join(", ")
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        types: typesInput
          .split(", ")
          .map((t) => t.trim())
          .filter(Boolean),
        culture_ids: formData.cultures?.map((c) => c.id),
      };
      const url = initialData ? `/recipes/${initialData.id}/` : `/recipes/`;
      if (initialData) {
        await api.put(url, payload);
      } else {
        await api.post(url, payload);
      }
      onSuccess();
    } catch (error) {
      console.error("Failed to save:", error);
      alert(`Failed to save: ${JSON.stringify(error)}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <main className="p-4">Loading...</main>;

  return (
    <div className="flex flex-col md:flex-row w-full p-2 sm:p-4 items-center justify-center">
      <div className="">
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            name="name"
            placeholder="Recipe Name"
            value={formData.name || ""}
            onChange={handleChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />
          <select
            name="course"
            value={formData.course || ""}
            onChange={handleChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          >
            <option value="">-- Select Course --</option>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Dessert">Dessert</option>
            <option value="Snack">Snack</option>
          </select>
          <input
            type="text"
            name="types"
            placeholder="Types (comma separated)"
            value={typesInput}
            onChange={(e) => setTypesInput(e.target.value)}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />
          <div className="bg-extra shadow p-2 rounded text-sm sm:text-base">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setShowCultureSelect(!showCultureSelect)}
            >
              <span>
                Cultures:{" "}
                {formData.cultures?.map((c) => c.name).join(", ") ||
                  "None selected"}
              </span>
              <span className="text-xs text-foreground/50">
                <svg
                  viewBox={SVGPath.chevron.viewBox}
                  className={`size-5 fill-current transition hover:scale-105 active:scale-95 ${
                    showCultureSelect ? "transform rotate-180" : ""
                  }`}
                >
                  <path d={SVGPath.chevron.path} />
                </svg>
              </span>
            </div>
            {showCultureSelect && (
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto border-t border-gray-300 pt-2">
                {cultures.map((culture) => {
                  const selected = formData.cultures?.some(
                    (c) => c.id === culture.id
                  );
                  return (
                    <label
                      key={culture.id}
                      className={`flex items-center space-x-2 cursor-pointer ${
                        selected ? "text-main rounded px-1" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleCulture(culture)}
                      />
                      <span>{culture.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          <IngredientsEditor
            ingredients={formData.ingredients || []}
            setIngredients={(ingredients) =>
              setFormData({ ...formData, ingredients })
            }
          />
          <InstructionsEditor
            instructions={formData.instructions || []}
            setInstructions={(instructions) =>
              setFormData({ ...formData, instructions })
            }
          />
          {formData.photo && (
            <div className="mb-3 flex flex-col items-center">
              <p className="text-xs sm:text-sm text-silver mb-1 w-full text-left">
                Current Photo Preview:
              </p>
              <img
                src={formData.photo}
                alt="Recipe preview"
                className="object-contain rounded max-w-[200px] sm:max-w-[300px] md:max-w-[400px] lg:max-w-[500px]"
              />
            </div>
          )}
          <input
            type="text"
            name="photo"
            placeholder="Photo URL"
            value={formData.photo || ""}
            onChange={handleChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />
          <select
            name="visibility"
            value={formData.visibility || "public"}
            onChange={handleChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
          <textarea
            name="notes"
            placeholder="Notes"
            value={formData.notes || ""}
            onChange={handleChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-foreground text-background w-full md:w-1/4 px-4 py-2 rounded text-sm sm:text-base hover:bg-extra-mid hover:scale-105 transition cursor-pointer"
          >
            {loading
              ? "Saving..."
              : initialData
              ? "Update Recipe"
              : "Add Recipe"}
          </button>
        </form>
      </div>
    </div>
  );
}
