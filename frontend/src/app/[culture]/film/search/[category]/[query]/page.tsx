"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";

import api from "@/lib/api";
import { SVGPath } from "@/utils/path";
import { Film } from "@/types/media/film";

import FilmCard from "@/components/film/FilmCard";
import SearchBar from "@/components/SearchBar";

type SortOption = "date-desc" | "date-asc" | "rating-desc" | "rating-asc";

export default function FilmSearchPage() {
  const params = useParams();
  const culture = String(params.culture || "");
  const category = String(params.category || "");
  const query = decodeURIComponent(String(params.query || ""));

  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchFilms = useCallback(
    async (reset = false) => {
      if (!category || !query || !culture) return;

      const paramMap: Record<string, string> = {
        director: "director",
        actor: "actor",
        genre: "genre",
        crew: "crew",
      };
      const param = paramMap[category.toLowerCase()] || "q";

      const currentOffset = reset ? 0 : offset;

      try {
        setLoading(true);
        setError(null);

        const res = await api.get(
          `/films/search/?${param}=${encodeURIComponent(
            query
          )}&offset=${currentOffset}&limit=${limit}`
        );

        const { results, total } = res.data;

        setFilms((prev) => {
          if (reset) return results;
          const existingIds = new Set(prev.map((f) => f.id));
          const newFilms = results.filter((f: Film) => !existingIds.has(f.id));
          return [...prev, ...newFilms];
        });

        setOffset(currentOffset + limit);
        setTotal(total);
        setHasMore(results.length === limit && currentOffset + limit < total);
      } catch (err) {
        console.error("Error fetching results:", err);
        setError("Failed to load films. Please try again.");
        setFilms([]);
      } finally {
        setLoading(false);
      }
    },
    [category, query, culture, offset]
  );

  useEffect(() => {
    setFilms([]);
    setOffset(0);
    setHasMore(true);
    setTotal(0);
    setError(null);

    fetchFilms(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, query, culture]);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!category || !query || !culture) {
        setError("Missing search parameters");
        return;
      }

      setLoading(true);
      setError(null);
      setFilms([]);
      setOffset(0);
      setHasMore(true);
      setTotal(0);

      const paramMap: Record<string, string> = {
        director: "director",
        actor: "actor",
        genre: "genre",
        crew: "crew",
      };
      const param = paramMap[category.toLowerCase()] || "q";

      try {
        const res = await api.get(
          `/films/search/?${param}=${encodeURIComponent(
            query
          )}&offset=0&limit=${limit}${
            searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""
          }`
        );

        const { results, total } = res.data;

        console.log(`Search returned ${results.length} films, total: ${total}`);
        setFilms(results);
        setOffset(limit);
        setTotal(total);
        setHasMore(results.length === limit && limit < total);
      } catch (error) {
        console.error("Error handling search:", error);
        setError("Failed to load films. Please try again.");
        setFilms([]);
      } finally {
        setLoading(false);
      }
    },
    [category, query, culture]
  );

  const sortedFilms = useMemo(() => {
    return [...films].sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return (
            new Date(b.release_date || "1900-01-01").getTime() -
            new Date(a.release_date || "1900-01-01").getTime()
          );
        case "date-asc":
          return (
            new Date(a.release_date || "1900-01-01").getTime() -
            new Date(b.release_date || "1900-01-01").getTime()
          );
        case "rating-desc":
          return (
            (Number(b.userfilm?.rating) || 0) -
            (Number(a.userfilm?.rating) || 0)
          );
        case "rating-asc":
          return (
            (Number(a.userfilm?.rating) || 0) -
            (Number(b.userfilm?.rating) || 0)
          );
        default:
          return 0;
      }
    });
  }, [films, sortBy]);

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  let headingText = `Films produced by`;

  if (category.toLowerCase() === "actor") {
    headingText = "Films starring";
  } else if (category.toLowerCase() === "director") {
    headingText = "Films directed by";
  } else if (category.toLowerCase() === "genre") {
    headingText = "Films about";
  }

  return (
    <div className="p-4 sm:p-6">
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 sm:mb-6">
        <div className="flex flex-col">
          <h3 className="text-gray-400 text-xs uppercase font-sans">
            {headingText}
          </h3>
          <h1 className="text-2xl md:text-3xl font-bold font-lora mt-1">
            {query && category && decodeURIComponent(query)}
          </h1>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="w-full sm:w-1/2 md:w-1/4 text-sm sm:text-base font-sans p-2 rounded bg-extra shadow cursor-pointer text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="date-desc">Release Date (Newest → Oldest)</option>
          <option value="date-asc">Release Date (Oldest → Newest)</option>
          <option value="rating-desc">Rating (High → Low)</option>
          <option value="rating-asc">Rating (Low → High)</option>
        </select>
      </div>

      <div className="mb-4 sm:mb-6">
        <SearchBar
          onSearch={(searchQuery) => {
            handleSearch(searchQuery);
          }}
        />
      </div>

      {loading && films.length === 0 && (
        <div className="text-center text-gray-400 font-sans">Loading...</div>
      )}
      {sortedFilms.length === 0 && !loading && !error && (
        <p className="text-center text-gray-400 font-sans">No results found.</p>
      )}
      {sortedFilms.length > 0 && (
        <>
          <ul className="grid gap-2 sm:gap-6 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
            {sortedFilms.map((film) => (
              <div
                key={film.id}
                className={`${
                  film.userfilm?.seen ? "opacity-50 hover:opacity-100" : ""
                }`}
              >
                <FilmCard film={film} />
              </div>
            ))}
          </ul>
          {hasMore && !loading && (
            <div className="mt-4 sm:mt-6 text-sm sm:text-base text-center">
              <button
                onClick={() => fetchFilms(false)}
                disabled={loading || !hasMore}
                className="font-sans bg-primary text-white px-4 py-2 rounded hover:bg-neutral-mid hover:text-background cursor-pointer"
              >
                {loading ? "Loading..." : "Show More"}
              </button>
            </div>
          )}
          {loading && films.length > 0 && (
            <div className="text-center mt-4 text-gray-400 font-sans">
              Loading more...
            </div>
          )}
        </>
      )}

      <button
        onClick={handleBackToTop}
        className="fixed bottom-5 right-5 bg-primary text-white p-3 rounded-full shadow-lg hover:opacity-50 cursor-pointer active:scale-95 transition-all duration-300 z-20"
        aria-label="Back to top"
      >
        <svg
          viewBox={SVGPath.arrow.viewBox}
          className="size-5 fill-current transition hover:scale-105 active:scale-95 transform rotate-90"
        >
          <path d={SVGPath.arrow.path} />
        </svg>
      </button>
    </div>
  );
}
