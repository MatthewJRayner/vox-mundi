"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import api from "@/lib/api";
import { SVGPath } from "@/utils/path";
import { Culture, Category, PageContent } from "@/types/culture";
import { Recipe } from "@/types/media/recipe";

import CategoryHeader from "@/components/CategoryHeader";
import SearchBar from "@/components/SearchBar";

export default function CuisineEditPage() {
  const { culture } = useParams();
  const [cultureCurrent, setCultureCurrent] = useState<Culture | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [overviewText, setOverviewText] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!culture) return;
    try {
      setLoading(true);
      const [catRes, contentRes, recipesRes, cultureRes] = await Promise.all([
        api.get(`/categories/?key=cuisine&code=${culture}`),
        api.get(`/page-contents/?code=${culture}&key=cuisine`),
        api.get(`/recipes/?code=${culture}`),
        api.get(`/cultures/?code=${culture}`),
      ]);
      const categoryData = catRes.data[0];
      setCategory(categoryData);
      setDisplayName(categoryData?.display_name || "");
      setCultureCurrent(cultureRes.data);
      setRecipes(recipesRes.data);
      setFilteredRecipes(recipesRes.data);
      if (contentRes.data[0]) {
        setPageContent(contentRes.data[0]);
        setOverviewText(contentRes.data[0].overview_text || "");
      } else {
        setPageContent(null);
        setOverviewText("");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [culture]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveDisplayName = async () => {
    if (!category) return;
    try {
      await api.patch(`/categories/${category.id}/`, {
        display_name: displayName,
      });
      setCategory((prev) => prev && { ...prev, display_name: displayName });
    } catch (error) {
      console.error("Error updating display name:", error);
    }
  };

  const handleSaveOverviewText = async () => {
    if (!culture) return;
    try {
      if (pageContent) {
        await api.patch(`/page-contents/${pageContent.id}/`, {
          overview_text: overviewText,
        });
        setPageContent(
          (prev) => prev && { ...prev, overview_text: overviewText }
        );
      } else {
        const response = await api.post(`/page-contents/`, {
          culture_id: cultureCurrent?.id,
          category_id: category?.id,
          overview_text: overviewText,
        });
        setPageContent(response.data);
      }
    } catch (error) {
      console.error("Error updating overview text:", error);
    }
  };

  const handleSearch = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setFilteredRecipes(recipes);
        return;
      }
      const lowerQuery = query.toLowerCase();
      const filtered = recipes.filter(
        (recipe) =>
          recipe.name.toLowerCase().includes(lowerQuery) ||
          recipe.course.toLowerCase().includes(lowerQuery) ||
          (recipe.types &&
            recipe.types.some((type: string) =>
              type.toLowerCase().includes(lowerQuery)
            )) ||
          recipe.ingredients?.some((i) =>
            i.name.toLowerCase().includes(lowerQuery)
          )
      );
      setFilteredRecipes(filtered);
    },
    [recipes]
  );

  if (loading) return <main className="p-4">Loading...</main>;

  return (
    <main className="flex flex-col max-w-3xl mx-auto p-2 md:p-6 space-y-8">
      <Link className="" href={`/${culture}/cuisine`} title="Back to Cuisine">
        <svg
          viewBox={SVGPath.arrow.viewBox}
          className="size-5 fill-current text-foreground cursor-pointer hover:scale-110 hover:opacity-80 active:scale-95 transition"
        >
          <path d={SVGPath.arrow.path} />
        </svg>
      </Link>
      <CategoryHeader
        displayName={displayName}
        setDisplayName={setDisplayName}
        onSave={handleSaveDisplayName}
      />
      <section className="flex flex-col space-y-4">
        <h2 className="text-2xl text-main font-garamond">Overview Text</h2>
        <textarea
          value={overviewText}
          onChange={(e) => setOverviewText(e.target.value)}
          className="w-full p-4 rounded-md bg-extra shadow-lg text-foreground text-sm md:text-base"
          rows={6}
          placeholder="Enter the overview text for this cuisine..."
        />
        <button
          onClick={handleSaveOverviewText}
          className="px-4 py-2 bg-foreground text-background rounded-md hover:bg-primary/80 hover:text-white active:scale-90 active:bg-primary/80 transition cursor-pointer"
        >
          Save Overview
        </button>
      </section>
      <section className="flex flex-col space-y-4 w-full mt-">
        <div className="flex items-center w-full">
          <SearchBar onSearch={handleSearch} />
          <Link href={`/${culture}/cuisine/new`} title="Add Recipe">
            <svg
              viewBox={SVGPath.add.viewBox}
              className="size-4 md:size-5 fill-current text-foreground ml-4 cursor-pointer hover:scale-110 hover:opacity-80 active:scale-95 transition"
              aria-label="Add Recipe"
            >
              <path d={SVGPath.add.path} />
            </svg>
          </Link>
        </div>
        <h2 className="text-2xl text-main mt-2 font-garamond">Recipes</h2>
        {filteredRecipes.length === 0 ? (
          <p className="text-gray-500">No recipes found.</p>
        ) : (
          <ul className="space-y-2">
            {filteredRecipes.map((recipe) => (
              <li
                key={recipe.id}
                className="flex justify-between items-center p-4 bg-extra shadow-lg rounded w-full"
              >
                <div className="w-full flex flex-col md:flex-row items-start md:justify-start md:items-center">
                  <span className="font-medium text-lg">{recipe.name}</span>
                  <span className="text-xs md:text-sm text-foreground/50 md:ml-2">
                    {recipe.types?.join(", ") || "No types"}
                  </span>
                </div>
                <div className="w-full flex flex-col md:flex-row items-end md:justify-end md:items-center">
                  <span className="text-xs md:text-sm text-foreground/50 ml-2">
                    {recipe.course}
                  </span>
                  <Link
                    href={`/${culture}/cuisine/${recipe.id}/edit`}
                    className="text-primary hover:opacity-80 cursor-pointer ml-2 text-sm"
                  >
                    Edit
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
