"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { PageContent } from "@/types/culture";
import { Recipe, Ingredient, Instruction } from "@/types/media/recipe";
import { SVGPath } from "@/utils/path";
import ReactMarkdown from "react-markdown";
import SearchBar from "@/components/SearchBar";

export default function CuisinePage() {
  const { culture } = useParams();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [filterType, setFilterType] = useState("");
  const [query, setQuery] = useState("");
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!culture) return;
    try {
      setLoading(true);
      const [recipeRes, contentRes] = await Promise.all([
        api.get(`/recipes/?code=${culture}`),
        api.get(`/page-contents/?code=${culture}&?key=cuisine}`),
      ]);
      setRecipes(recipeRes.data);
      setPageContent(contentRes.data[0]);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  }, [culture]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setFilteredRecipes(recipes);
        return;
      }
      const lowerQuery = query.toLowerCase();
      const filtered = recipes.filter(
        (recipe) =>
          recipe.name.toLowerCase().includes(query) ||
          recipe.course.toLowerCase().includes(query) ||
          recipe.ingredients?.some((i) => i.name.toLowerCase().includes(query))
      );
      setFilteredRecipes(filtered);
    },
    [recipes]
  );

  //   const handleRefresh =

  //   const randomRecipe = recipes.random();
  //   const allTypes = recipes.reduce((type, string) =) MAKE A LIST OF ALL THE TYPES THE USER HAS ADDED

  if (loading) return <main className="p-4">Loading...</main>;

  return (
    <main className="flex flex-col w-full mx-auto p-6 space-y-8">
      <section className="flex items-center w-full">
        <SearchBar onSearch={handleSearch} />
        <Link href={`/${culture}/cuisine/new`} title="Add Event">
          <svg
            viewBox={SVGPath.add.viewBox}
            className="size-4 md:size-5 fill-current text-foreground ml-4 cursor-pointer hover:scale-110 hover:opacity-80 active:scale-95 transition"
          >
            <path d={SVGPath.add.path} />
          </svg>
        </Link>

        <Link href={`/${culture}/cuisine/edit`} title="Edit Page">
          <svg
            viewBox={SVGPath.edit.viewBox}
            className="size-4 md:size-5 fill-current text-foreground ml-4 cursor-pointer hover:fill-primary hover:scale-105 hover:opacity-80 active:scale-95 transition"
          >
            <path d={SVGPath.edit.path} />
          </svg>
        </Link>
      </section>
      <section className="flex flex-col md:flex-row w-full space-y-2 md:space-y-0 md:space-x-2 md:min-h-[400px] bg-red-300">
        <div className="flex flex-col space-y-2 w-3/4 bg-amber-300">
          <div className="flex flex-col h-full justify-between">
            <div className="flex flex-col">
              <h1 className="font-lora text-lg md:text-2xl font-bold">
                Overview
              </h1>
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
                    pageContent.overview_text?.length > 300 && (
                      <div className="absolute bottom-5 left-0 w-full h-10 sm:h-12 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none" />
                    )}
                  {pageContent.overview_text &&
                    pageContent.overview_text.length > 300 && (
                      <button
                        onClick={() => setShowFullDesc(!showFullDesc)}
                        className="mt-1 cursor-pointer z-10 flex items-center font-lora sm:text-base"
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
                <p className="text-foreground/50">{`There's currently no overview saved for this cuisine, please edit the page to add your own personal summary of the cuisine's history and style`}</p>
              )}
            </div>

            <div className="flex flex-col">
              <h1 className="font-lora text-lg md:text-2xl font-bold">Types</h1>
              {/* INSERT LIST OF TYPES HERE */}
            </div>
          </div>
        </div>
        <div className="p-4 md:p-6 min-h-full w-1/4 bg-blue-300 flex flex-col items-center justify-center">
          <div className="flex items-center w-full">
            <div className="flex w-full">
              <h3 className="text-xs md:text-sm">
                Feeling like <span></span>?
              </h3>
              <button>
                <svg
                  viewBox={SVGPath.refresh.viewBox}
                  className="size-2 md:size-5 fill-current text-foreground ml-4 cursor-pointer hover:fill-primary hover:scale-105 hover:opacity-80 active:scale-95 transition"
                >
                  <path d={SVGPath.refresh.path} />
                </svg>
              </button>
            </div>
            {/* <img 
                src={randomRecipe?.photo || ""}
                className="w-24 object-contain"
                alt={`${randomRecipe.name || ""}`}
            /> */}
            {/* <h1 className="text-lg md:text-2xl font-lora">{randomRecipe.name}</h1> */}
          </div>
        </div>
      </section>
    </main>
  );
}
