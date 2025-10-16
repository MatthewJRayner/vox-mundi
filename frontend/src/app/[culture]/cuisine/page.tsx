"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { PageContent } from "@/types/culture";
import { Recipe } from "@/types/media/recipe";
import { SVGPath } from "@/utils/path";
import ReactMarkdown from "react-markdown";
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
      const shuffledRecipes = [...recipeRes.data].sort(() => 0.5 - Math.random());
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
            recipe.ingredients?.some((i) => i.name.toLowerCase().includes(lowerQuery))) &&
          (!filterType || recipe.type === filterType)
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
        (!newFilterType || recipe.type === newFilterType) &&
        (!query.trim() ||
          recipe.name.toLowerCase().includes(query.toLowerCase()) ||
          recipe.course.toLowerCase().includes(query.toLowerCase()) ||
          recipe.ingredients?.some((i) => i.name.toLowerCase().includes(query.toLowerCase())))
    );
    setFilteredRecipes(filtered);
  };

  const getRandomRecipeByCourse = useCallback(() => {
    const now = new Date();
    const hours = now.getHours();
    let course = "dinner";
    if (hours < 11) course = "breakfast";
    else if (hours < 16) course = "lunch";

    const courseRecipes = filteredRecipes.filter((recipe) => recipe.course.toLowerCase() === course);
    if (courseRecipes.length === 0) return null;
    return courseRecipes[Math.floor(Math.random() * courseRecipes.length)];
  }, [filteredRecipes]);

  const getRandomFiveRecipes = useMemo(() => {
    return filteredRecipes.slice(0, 5);
  }, [filteredRecipes]);

  const allTypes = useMemo(
    () => Array.from(new Set(recipes.map((recipe) => recipe.type))).sort(),
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
      <section className="flex flex-col md:flex-row w-full space-y-2 md:space-y-0 md:space-x-2 md:min-h-[400px]">
        <div className="flex flex-col space-y-4 w-full md:w-3/4">
          <div className="flex flex-col h-full justify-between">
            <div className="flex flex-col">
              <h1 className="font-lora text-lg md:text-2xl font-bold">Overview</h1>
              {pageContent?.overview_text ? (
                <div className="mb-8 relative">
                  <div
                    className={`text-sm/[1.75] sm:text-base/[1.75] leading-relaxed font-serif font-medium transition-all duration-300 ${
                      showFullDesc
                        ? "max-h-none"
                        : "max-h-52 md:max-h-42 overflow-hidden"
                    }`}
                  >
                    <ReactMarkdown>{pageContent.overview_text}</ReactMarkdown>
                  </div>
                  {!showFullDesc &&
                    pageContent.overview_text &&
                    pageContent.overview_text.length > 300 && (
                      <div className="absolute bottom-5 left-0 w-full h-10 sm:h-12 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none" />
                    )}
                  {pageContent.overview_text &&
                    pageContent.overview_text.length > 300 && (
                      <button
                        onClick={() => setShowFullDesc(!showFullDesc)}
                        className="mt-1 cursor-pointer z-10 flex items-center font-lora sm:text-base"
                        aria-expanded={showFullDesc}
                      >
                        <span className="mr-1 font-bold transition hover:text-main">
                          {showFullDesc ? "Show Less" : "Show More"}
                        </span>
                        <span
                          className={`transition-transform duration-300 ${
                            showFullDesc ? "rotate-180" : "rotate-0"
                          }`}
                        >
                          <svg
                            viewBox={SVGPath.chevron.viewBox}
                            className="size-5 fill-current cursor-pointer transition-transform"
                          >
                            <path d={SVGPath.chevron.path} />
                          </svg>
                        </span>
                      </button>
                    )}
                </div>
              ) : (
                <p className="text-foreground/50">
                  There&apos;s currently no overview saved for this cuisine, please
                  edit the page to add your own personal summary of the
                  cuisine&apos;s history and style.
                </p>
              )}
            </div>
            <div className="flex flex-col">
              <h1 className="font-lora text-lg md:text-2xl font-bold">Types</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {allTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTypeFilter(type)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                      filterType === type
                        ? "bg-primary text-white"
                        : "bg-neutral/50 text-foreground hover:bg-primary hover:text-white"
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
        <div className="p-4 md:p-6 min-h-full w-full md:w-1/4 flex flex-col items-center">
          <div className="flex items-center w-full mb-4">
            <div className="flex w-full">
              <h3 className="text-xs md:text-sm">
                Feeling like{" "}
                <span className="font-semibold">
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
            <p className="text-foreground/50">No {getRandomRecipeByCourse()?.course || "recipes"} available</p>
          )}
        </div>
      </section>
      <section className="flex flex-col space-y-4">
        <h1 className="font-lora text-lg md:text-2xl font-bold">Featured Recipes</h1>
        {getRandomFiveRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {getRandomFiveRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <p className="text-foreground/50">No recipes match the current filters.</p>
        )}
      </section>
    </main>
  );
}