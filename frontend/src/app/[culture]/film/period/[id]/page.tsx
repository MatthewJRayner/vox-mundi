"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Film } from "@/types/media/film";
import { Period } from "@/types/culture";
import SearchBar from "@/components/SearchBar";
import FilmCard from "@/components/film/FilmCard";
import { SVGPath } from "@/utils/path";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

type SortOption = "date-desc" | "date-asc" | "rating-desc" | "rating-asc";

export default function FilmPeriodPage() {
  const { culture, id } = useParams();
  const [period, setPeriod] = useState<Period | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [films, setFilms] = useState<Film[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [query, setQuery] = useState("");
  const [showFullDesc, setShowFullDesc] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) {
      setError("Missing list ID");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [periodRes, filmRes] = await Promise.all([
        api.get(`/periods/${id}`),
        api.get(`/films/period_films/?period=${id}`),
      ]);
      setPeriod(periodRes.data);
      setFilms(filmRes.data.results);
    } catch {
      setError("Failed to load period. Please try again");
      setPeriod(null);
      setFilms([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = useCallback(
    async (query: string) => {
      setFilms([]);
      setError(null);
      setLoading(true);

      try {
        const filmRes = await api.get(
          `films/period_films/?period=${id}&q=${encodeURIComponent(query)}`
        );
        setFilms(filmRes.data.results);
      } catch (err) {
        console.error("Error searching films", err);
      }
    },
    [id]
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

  if (loading && !period) {
    return (
      <div className="p-6 text-center text-gray-400 font-sans">Loading...</div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 sm:mb-6">
        <div className="flex flex-col">
          <div className="flex space-x-2 items-center">
            <h1 className="text-2xl md:text-3xl font-bold font-lora text-main flex items-center">
              <Link
                href={`/${culture}/film`}
                className="text-main hover:opacity-80 text-sm md:text-base mr-2"
                aria-label="Back to Films"
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
              {period?.title}
            </h1>
            <p className="font-sans text-xs sm:text-sm text-gray-400">
              {films.length ? `(${films.length} Films)` : ""}
            </p>
          </div>
          <div className="w-full flex-col justify-between items-start md:space-x-4">
            {period?.desc ? (
              <div className="relative w-full md:w-3/4">
                <div
                  className={`text-sm/[1.75] sm:text-base/[1.75] leading-relaxed text-foreground/50 transition-all duration-300 ${
                    showFullDesc
                      ? "max-h-none"
                      : "max-h-52 md:max-h-42 overflow-hidden"
                  }`}
                >
                  <ReactMarkdown>{period?.desc}</ReactMarkdown>
                </div>
                {!showFullDesc && period?.desc && period?.desc.length > 300 && (
                  <div className="absolute bottom-5 left-0 w-full h-10 sm:h-12 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none" />
                )}
                {period?.desc && period?.desc.length > 300 && (
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
                There&apos;s currently no overview saved for this cuisine,
                please edit the page to add your own personal summary of the
                cuisine&apos;s history and style.
              </p>
            )}
            <div className="w-full md:w-1/3 mt-4 ">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-sm sm:text-base font-sans p-2 rounded bg-extra shadow cursor-pointer text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="date-desc">
                  Release Date (Newest → Oldest)
                </option>
                <option value="date-asc">Release Date (Oldest → Newest)</option>
                <option value="rating-desc">Rating (High → Low)</option>
                <option value="rating-asc">Rating (Low → High)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 sm:mb-6">
        <SearchBar onSearch={handleSearch} />
      </div>

      {loading && films.length === 0 && (
        <div className="text-center text-gray-400 font-sans">Loading...</div>
      )}
      {sortedFilms.length === 0 && !loading && !error && (
        <p className="text-center text-gray-400 font-sans">
          No films found for this period.
        </p>
      )}
      {sortedFilms.length > 0 && (
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
