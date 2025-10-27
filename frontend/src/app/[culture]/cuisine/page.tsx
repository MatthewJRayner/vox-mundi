"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { PageContent } from "@/types/culture";
import { Recipe } from "@/types/media/recipe";
import { SVGPath } from "@/utils/path";
import ReactMarkdown from "react-markdown";
import ExpandableSummary from "@/components/ExpandableSummary";
import SearchBar from "@/components/SearchBar";
import RecipeCard from "@/components/cuisine/RecipeCard";

export default function CuisinePage() {
  const { culture } = useParams();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [filterType, setFilterType] = useState("");
  const [query, setQuery] = useState("");
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!culture) return;
    try {
      setLoading(true);
      setRefreshLoading(true);
      setError(null);
      const [recipeRes, contentRes] = await Promise.all([
        api.get(`/recipes/?code=${culture}`),
        api.get(`/page-contents/?code=${culture}&?key=cuisine`),
      ]);
      const shuffledRecipes = [...recipeRes.data].sort(
        () => 0.5 - Math.random()
      );
      setRecipes(shuffledRecipes);
      setFilteredRecipes(shuffledRecipes);
      setPageContent(contentRes.data[0]);
    } catch (error) {
      console.error("Error fetching data", error);
      setError("Failed to load cuisine data. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshLoading(false);
    }
  }, [culture]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = useCallback(
    (query: string) => {
      setQuery(query);
      if (!query.trim() && !filterType) {
        setFilteredRecipes(recipes);
        return;
      }
      const lowerQuery = query.toLowerCase();
      const filtered = recipes.filter(
        (recipe) =>
          (!query.trim() ||
            recipe.name.toLowerCase().includes(lowerQuery) ||
            recipe.course.toLowerCase().includes(lowerQuery) ||
            recipe.ingredients?.some((i) =>
              i.name.toLowerCase().includes(lowerQuery)
            )) &&
          (!filterType || (recipe.types && recipe.types.includes(filterType)))
      );
      setFilteredRecipes(filtered);
    },
    [recipes, filterType]
  );

  const handleTypeFilter = (type: string) => {
    const newFilterType = type === filterType ? "" : type;
    setFilterType(newFilterType);
    const filtered = recipes.filter(
      (recipe) =>
        (!newFilterType ||
          (recipe.types && recipe.types.includes(newFilterType))) &&
        (!query.trim() ||
          recipe.name.toLowerCase().includes(query.toLowerCase()) ||
          recipe.course.toLowerCase().includes(query.toLowerCase()) ||
          recipe.ingredients?.some((i) =>
            i.name.toLowerCase().includes(query.toLowerCase())
          ))
    );
    setFilteredRecipes(filtered);
  };

  const getRandomRecipeByCourse = useCallback(() => {
    const now = new Date();
    const hours = now.getHours();
    let course = "Dinner";
    if (hours < 11) course = "Breakfast";
    else if (hours < 16) course = "Lunch";

    const courseRecipes = filteredRecipes.filter(
      (recipe) => recipe.course.toLowerCase() === course
    );
    if (courseRecipes.length === 0) return null;
    return courseRecipes[Math.floor(Math.random() * courseRecipes.length)];
  }, [filteredRecipes]);

  const getRandomFiveRecipes = useMemo(() => {
    return filteredRecipes.slice(0, 5);
  }, [filteredRecipes]);

  const allTypes = useMemo(
    () =>
      Array.from(
        new Set(recipes.flatMap((recipe) => recipe.types || []))
      ).sort(),
    [recipes]
  );

  const randomRecipe = getRandomRecipeByCourse();

  if (loading) return <main className="p-4">Loading...</main>;
  if (error) return <main className="p-4 text-danger">{error}</main>;

  return (
    <main className="flex flex-col w-full mx-auto p-6 space-y-8">
      <section className="flex items-center w-full">
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
        <Link href={`/${culture}/cuisine/edit`} title="Edit Page">
          <svg
            viewBox={SVGPath.edit.viewBox}
            className="size-4 md:size-5 fill-current text-foreground ml-4 cursor-pointer hover:fill-primary hover:scale-105 hover:opacity-80 active:scale-95 transition"
            aria-label="Edit Page"
          >
            <path d={SVGPath.edit.path} />
          </svg>
        </Link>
      </section>
      <section className="flex flex-col md:flex-row w-full space-y-2 md:space-y-0 md:space-x-4 md:min-h-[300px]">
        <div className="flex flex-col space-y-4 w-full md:w-3/4">
          <div className="flex flex-col h-full justify-between">
            <div className="flex flex-col">
              <h1 className="font-lora text-lg md:text-2xl font-bold text-main">
                Overview
              </h1>
              {pageContent?.overview_text ? (
                <ExpandableSummary
                  text={pageContent?.overview_text}
                  maxHeight="max-h-52"
                  blurBottom="bottom-7"
                />
              ) : (
                <p className="text-foreground/50">
                  There&apos;s currently no overview saved for this cuisine,
                  please edit the page to add your own personal summary of the
                  cuisine&apos;s history and style.
                </p>
              )}
            </div>
            <div className="flex flex-col mt-4 md:mt-2">
              <h1 className="font-lora text-lg md:text-2xl font-bold text-main">
                Types
              </h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {allTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTypeFilter(type)}
                    className={`px-4 py-2 text-xs md:text-sm rounded-md font-medium transition duration-300 cursor-pointer ${
                      filterType === type
                        ? "bg-foreground text-background"
                        : "bg-extra text-foreground hover:bg-primary hover:text-white"
                    }`}
                    aria-pressed={filterType === type}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 md:p-6 min-h-full w-full md:w-1/4 flex flex-col items-center bg-extra shadow-md rounded-md mt-4 md:mt-0">
          <div className="flex items-center w-full mb-4">
            <div className="flex w-full justify-center items-center">
              <h3 className="text-xs md:text-sm">
                Feeling like{" "}
                <span className="font-semibold text-main">
                  {randomRecipe?.course || "something delicious"}
                </span>
                ?
              </h3>
              <button
                onClick={fetchData}
                className="ml-4"
                aria-label="Refresh random recipe"
                disabled={refreshLoading}
              >
                {refreshLoading ? (
                  <svg
                    className="animate-spin size-4 md:size-5 text-foreground"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg
                    viewBox={SVGPath.refresh.viewBox}
                    className="size-4 md:size-5 fill-current text-foreground cursor-pointer hover:fill-primary hover:scale-105 hover:opacity-80 active:scale-95 transition"
                  >
                    <path d={SVGPath.refresh.path} />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {randomRecipe ? (
            <>
              <img
                src={randomRecipe.photo || ""}
                className="w-24 object-contain mb-2"
                alt={randomRecipe.name}
              />
              <h1 className="text-lg md:text-xl font-lora font-semibold">
                {randomRecipe.name}
              </h1>
            </>
          ) : (
            <p className="text-foreground/50">
              No {getRandomRecipeByCourse()?.course || "recipes"} available
            </p>
          )}
        </div>
      </section>
      <section className="flex flex-col space-y-4">
        <h1 className="font-lora text-lg md:text-2xl font-bold text-main">
          Featured Recipes
        </h1>
        {getRandomFiveRecipes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
            {getRandomFiveRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <p className="text-foreground/50">
            No recipes match the current filters.
          </p>
        )}
      </section>
    </main>
  );
}
