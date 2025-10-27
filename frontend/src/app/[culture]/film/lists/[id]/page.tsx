"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Film } from "@/types/media/film";
import { List } from "@/types/list";
import FilmCard from "@/components/film/FilmCard";
import SearchBar from "@/components/SearchBar";
import FilmListCreationModal from "@/components/film/FilmListCreationModal";
import { SVGPath } from "@/utils/path";
import ExpandableSummary from "@/components/ExpandableSummary";
import Link from "next/link";

type SortOption = "date-desc" | "date-asc" | "rating-desc" | "rating-asc";

export default function FilmListPage() {
  const { culture, id } = useParams();
  const [list, setList] = useState<List | undefined>(undefined);
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [showListModal, setShowListModal] = useState(false);
  const [initialListData, setInitialListData] = useState<List | undefined>(
    undefined
  );
  const [showFullDesc, setShowFullDesc] = useState(false);

  const fetchList = useCallback(async () => {
    if (!id) {
      setError("Missing list ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/lists/${id}/`);
      const listData = res.data;
      setList(listData);
      setInitialListData(listData);
    } catch {
      setError("Failed to load list. Please try again.");
      setList(undefined);
      setFilms([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchFilms = useCallback(async () => {
    if (!list || !list.items || list.items.length === 0) {
      setFilms([]);
      setLoading(false);
      return;
    }

    const universalItemIds = list.items.map((item) => item.id).join(",");

    try {
      setLoading(true);
      setError(null);
      const res = await api.get(
        `/films/list_films/?ids=${encodeURIComponent(universalItemIds)}${
          searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""
        }`
      );
      const { results } = res.data;
      setFilms(results);
    } catch {
      setError("Failed to load films. Please try again.");
      setFilms([]);
    } finally {
      setLoading(false);
    }
  }, [list, searchQuery]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (list) {
      setFilms([]);
      setError(null);
      setLoading(true);
      fetchFilms();
    }
  }, [list, fetchFilms]);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      setSearchQuery(searchQuery);
      setFilms([]);
      setError(null);
      setLoading(true);
      fetchFilms();
    },
    [fetchFilms]
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

  if (loading && !list) {
    return (
      <div className="p-6 text-center text-gray-400 font-sans">Loading...</div>
    );
  }

  if (!list) {
    return (
      <div className="p-6 text-center text-gray-400 font-sans">
        List not found
      </div>
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
              {list.name}
            </h1>
            <p className="font-sans text-xs sm:text-sm text-gray-400">
              {list.items.length ? `(${list.items.length} Films)` : ""}
            </p>
            <button
              onClick={() => {
                setShowListModal(true);
                setInitialListData(list);
              }}
              className="font-sans hover:text-primary transition-all duration-300 cursor-pointer text-lg"
            >
              ✎
            </button>
          </div>
          <div className="w-full flex-col justify-between items-start md:space-x-4">
            {list.description ? <ExpandableSummary
                text={list.description}
                maxHeight="max-h-52"
                blurBottom="bottom-7"
              /> : (
              <p className="text-foreground/50">
                There&apos;s currently no description saved for this list. Click the edit button to change this..
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
          No films found in this list.
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

      {showListModal && (
        <FilmListCreationModal
          isOpen={showListModal}
          onClose={() => {
            setShowListModal(false);
            setInitialListData(undefined);
          }}
          onCreated={() => {
            fetchList();
            setShowListModal(false);
            setInitialListData(undefined);
          }}
          initialList={initialListData}
          currentCultureCode={culture}
        />
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
