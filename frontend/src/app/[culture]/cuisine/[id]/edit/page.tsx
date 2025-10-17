"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Recipe } from "@/types/media/recipe";
import RecipeForm from "@/components/cuisine/RecipeForm";
import api from "@/lib/api";

export default function EditRecipePage() {
  const { culture, id } = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | undefined>(undefined);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const recipeRes = await api.get(`/recipes/${id}`);
      setRecipe(recipeRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="">
      <h1 className=""></h1>
      {recipe && (
        <RecipeForm
          currentCultureCode={culture}
          onSuccess={() => router.push(`/${culture}/cuisine`)}
          initialData={recipe}
        />
      )}
    </div>
  );
}