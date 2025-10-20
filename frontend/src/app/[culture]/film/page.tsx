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

      const [filmRes, periodRes] = await Promise.all([
        api.get(`/films/frontpage?code=${culture}`),
        api.get(`/periods/?code=${culture}&key=film`),
      ]);

      const frontpageData = filmRes.data;

      setFilms(frontpageData);
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

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    try {
      const filmSearchRes = await api.get(
        `/simple-films/?q=${encodeURIComponent(query)}&limit=5`
      );
      setResults(filmSearchRes.data);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  }, []);


  let watchlist = films?.watchlist
  let favourites = films?.favourites
  let recent = films?.recent
  let fallback = films?.fallback

  if (isSmallScreen) {
    watchlist = watchlist?.slice(0,4);
    favourites = favourites?.slice(0,4);
    recent = recent?.slice(0,4);
    fallback = fallback?.slice(0,4);
  } 

  return (
    <div className="p-4 md:p-6 flex flex-col text-center md:text-left">
      <section className="relative flex items-center w-full">
        <SearchBar onSearch={(query) => handleSearch(query)} />
        <button
          type="button"
          onClick={() => setShowImportModal(true)}
          className=""
        >
          <svg
            viewBox={SVGPath.add.viewBox}
            className="size-4 md:size-5 fill-current text-foreground ml-4 cursor-pointer hover:scale-110 hover:opacity-80 active:scale-95 transition"
            aria-label="Add Recipe"
          >
            <path d={SVGPath.add.path} />
          </svg>
        </button>
        <Link href={`/${culture}/film/edit`} title="Edit Page">
          <svg
            viewBox={SVGPath.edit.viewBox}
            className="size-4 md:size-5 fill-current text-foreground ml-4 cursor-pointer hover:fill-primary hover:scale-105 hover:opacity-80 active:scale-95 transition"
            aria-label="Edit Page"
          >
            <path d={SVGPath.edit.path} />
          </svg>
        </Link>
        {results.length > 0 && (
          <div className="absolute top-[100%] mt-1 left-0 w-full md:w-1/3 bg-foreground/20 backdrop-blur-2xl rounded shadow-lg max-h-[300px] overflow-y-auto z-10">
            {results.map((film) => (
              <Link
                key={film.id}
                href={`/${culture}/film/${film.id}`}
                className="flex items-center gap-3 px-4 py-2 hover:bg-extra transition"
              >
                <img
                  src={film.poster}
                  alt={film.title}
                  className="w-10 h-14 object-cover rounded"
                />
                <div className="text-left">
                  <p className="font-medium">{film.title}</p>
                  {film.release_date && (
                    <p className="text-sm text-neutral-400">
                      {film.release_date.substring(0, 4)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <FilmImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />

      {fallback && (
        <section className="mt-6 text-center">
          <h2 className="text-lg font-semibold mb-2">
            Start building your film culture!
          </h2>
          <p className="text-neutral-500 mb-4">
            You haven’t added any films yet. Here are some to
            explore:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {fallback.map((film: Film) => (
              <FilmCard key={film.id} film={film} />
            ))}
          </div>
          <p className="text-sm text-neutral-500 mt-4">
            Use the <strong>+</strong> button above to add films to our
            database!
          </p>
        </section>
      )}
      
      {!fallback && (
        <>
          {watchlist && watchlist?.length > 0 && (
            <section className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Your Watchlist</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {watchlist.map((film: Film) => (
                  <FilmCard key={film.id} film={film} />
                ))}
              </div>
            </section>
          )}

          {favourites && favourites?.length > 0 && (
            <section className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Your Favourites</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {favourites.map((film: Film) => (
                  <FilmCard key={film.id} film={film} />
                ))}
              </div>
            </section>
          )}

          {recent && recent?.length > 0 && (
            <section className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Recently Watched</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {recent.map((film: Film) => (
                  <FilmCard key={film.id} film={film} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
