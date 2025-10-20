"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Period } from "@/types/culture";
import { Film, UserFilm, FilmPageData } from "@/types/media/film";
import { UniversalItem } from "@/types/universal";
import { List } from "@/types/list";
import SearchBar from "@/components/SearchBar";
import FilmCard from "@/components/film/FilmCard";
// import FilmListModal
import FilmImportModal from "@/components/film/FilmImportModal";
import { SVGPath } from "@/utils/path";

export default function FilmPage() {
  const { culture } = useParams();
  const [films, setFilms] = useState<FilmPageData | null>(null);
  const [userFilms, setUserFilms] = useState<UserFilm[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [activePeriod, setActivePeriod] = useState<Period | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Film[]>([]);

  const fetchData = useCallback(async () => {
    if (!culture) return;
    try {
      setLoading(true);
      setError(null);

      const [filmRes, userFilmRes, periodRes] = await Promise.all([
        api.get(`/films/frontpage?code=${culture}`),
        api.get(`/user-films/`),
        api.get(`/periods/?code=${culture}&key=film`),
      ]);

      let frontpageData = filmRes.data;

      // Check if all sections are empty (watchlist, favourites, recent)
      const isEmpty =
        !frontpageData.watchlist?.length &&
        !frontpageData.favourites?.length &&
        !frontpageData.recent?.length;

      // If empty, fetch 5 generic films as a fallback
      if (isEmpty) {
        const fallbackRes = await api.get(`/films/?limit=5`);
        frontpageData = { fallback: fallbackRes.data.results };
      }

      setFilms(frontpageData);
      setUserFilms(userFilmRes.data);
      setPeriods(periodRes.data[0]);
    } catch (error) {
      console.error("Error fetching data", error);
      setError("Failed to load film data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [culture]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    try {
      const filmSearchRes = await api.get(
        `/films/&q=${query}`
      );
      setResults(filmSearchRes.data);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  }, []);

  return (
    <div className="p-4 md:p-6 flex flex-col text-center md:text-left">
      <div className="flex flex-col space-x-2 items-center">
        <h1 className="text-xl sm:text-2xl font-bold mb-2">Track A New Film</h1>
        <div className="flex">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 text-white bg-primary hover:text-background rounded hover:bg-neutral-mid transition-all duration-300 mb-4 cursor-pointer"
          >
            Import from TMDb
          </button>
        </div>
      </div>

      <SearchBar onSearch={(query) => handleSearch(query)} className="w-1/4" />
      <FilmImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
      {loading ? (
        <p className="text-center mt-4">Loading films...</p>
      ) : error ? (
        <p className="text-red-500 text-center mt-4">{error}</p>
      ) : films?.watchlist?.length ||
        films?.favourites?.length ||
        films?.recent?.length ? (
        <>
          {films.watchlist && films.watchlist?.length > 0 && (
            <section className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Your Watchlist</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {films.watchlist.map((film: Film) => (
                  <FilmCard key={film.id} film={film} />
                ))}
              </div>
            </section>
          )}

          {films.favourites && films.favourites?.length > 0 && (
            <section className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Your Favourites</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {films.favourites.map((film: Film) => (
                  <FilmCard key={film.id} film={film} />
                ))}
              </div>
            </section>
          )}

          {films.recent && films.recent?.length > 0 && (
            <section className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Recently Watched</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {films.recent.map((film: Film) => (
                  <FilmCard key={film.id} film={film} />
                ))}
              </div>
            </section>
          )}
        </>
      ) : films?.fallback ? (
        <section className="mt-6 text-center">
          <h2 className="text-lg font-semibold mb-2">
            Start building your film culture!
          </h2>
          <p className="text-neutral-500 mb-4">
            You haven’t added any films yet for this culture. Here are some to
            explore:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {films.fallback.map((film: Film) => (
              <FilmCard key={film.id} film={film} />
            ))}
          </div>
          <p className="text-sm text-neutral-500 mt-4">
            Use the <strong>Import from TMDb</strong> button above to add films
            to your culture.
          </p>
        </section>
      ) : null}
    </div>
  );
}
