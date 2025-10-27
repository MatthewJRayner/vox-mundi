"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Period, PageContent } from "@/types/culture";
import { Film, UserFilm, FilmPageData } from "@/types/media/film";
import { List } from "@/types/list";
import SearchBar from "@/components/SearchBar";
import FilmCard from "@/components/film/FilmCard";
import FilmImportModal from "@/components/film/FilmImportModal";
import FilmPeriodGrid from "@/components/film/FilmPeriodGrid";
import RandomFilmDisplay from "@/components/film/RandomFilmDisplay";
import FilmListCreationModal from "@/components/film/FilmListCreationModal";
import FilmListDisplayModal from "@/components/film/FilmListDisplayModal";
import { SVGPath } from "@/utils/path";
import ReactMarkdown from "react-markdown";
import ExpandableSummary from "@/components/ExpandableSummary";

export default function FilmPage() {
  const { culture } = useParams();
  const [films, setFilms] = useState<FilmPageData | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showListDisplayModal, setShowListDisplayModal] = useState(false);
  const [editingList, setEditingList] = useState<List | null>(null);
  const [showListCreationModal, setShowListCreationModal] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Film[]>([]);

  const fetchData = useCallback(async () => {
    if (!culture) return;
    try {
      setLoading(true);
      setError(null);

      const [filmRes, periodRes, pageContentRes] = await Promise.all([
        api.get(`/films/frontpage?code=${culture}`),
        api.get(`/periods/?code=${culture}&key=film`),
        api.get(`/page-contents/?code=${culture}&key=film`),
      ]);

      setFilms(filmRes.data);
      setPeriods(periodRes.data);
      setPageContent(pageContentRes.data[0] || null);
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
    const handleResize = () => setIsSmallScreen(window.innerWidth < 1024);
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
      const res = await api.get(
        `/simple-films/?q=${encodeURIComponent(query)}&limit=5`
      );
      setResults(res.data);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  }, []);

  const handleListCreated = useCallback(() => {
    fetchData();
    setShowListDisplayModal(true);
  }, [fetchData]);

  const handleEditList = (list: List) => {
    setEditingList(list);
    setShowListDisplayModal(false);
    setShowListCreationModal(true);
  };

  let watchlist = films?.watchlist;
  let favourites = films?.favourites;
  let recent = films?.recent;
  if (recent) {
    recent = recent.sort((a, b) => {
      const dateA = a.userfilm?.date_watched
        ? new Date(a.userfilm?.date_watched)
        : new Date(0);
      const dateB = b.userfilm?.date_watched
        ? new Date(b.userfilm?.date_watched)
        : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }
  let fallback = films?.fallback;

  if (isSmallScreen) {
    watchlist = watchlist?.slice(0, 4);
    favourites = favourites?.slice(0, 4);
    recent = recent?.slice(0, 4);
    fallback = fallback?.slice(0, 4);
  }

  if (loading) return <div className="p-4 text-gray-400">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-2 md:p-6 flex flex-col text-center md:text-left">
      <section className="relative flex items-center w-full">
        <SearchBar onSearch={(query) => handleSearch(query)} />
        <button onClick={() => setShowImportModal(true)}>
          <svg
            viewBox={SVGPath.add.viewBox}
            className="size-5 fill-current text-foreground ml-4 cursor-pointer hover:scale-110 hover:opacity-80 active:scale-95 transition"
          >
            <path d={SVGPath.add.path} />
          </svg>
        </button>
        <Link href={`/${culture}/film/edit`} title="Edit Page">
          <svg
            viewBox={SVGPath.edit.viewBox}
            className="size-5 fill-current text-foreground ml-4 cursor-pointer hover:fill-primary hover:scale-105 hover:opacity-80 active:scale-95 transition"
          >
            <path d={SVGPath.edit.path} />
          </svg>
        </Link>
        <button
          onClick={() => setShowListDisplayModal(true)}
          className="px-3 py-1 bg-extra ml-2 rounded shadow cursor-pointer hover:scale-105 active:scale-90"
        >
          Lists
        </button>

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

      <section className="w-full h-fit">
        <div className="w-full flex flex-col-reverse md:flex-row md:space-x-2">
          <div className="flex flex-col w-full md:w-3/4 mt-4">
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
                {`There's currently no overview saved for this culture film history or style.\n
                please edit the page to add your own personal summary of the
                your favourite films directors and just general thoughts along your cinematic journery!`}
              </p>
            )}
          </div>
          <div className="w-full max-h-[300px] md:w-1/4 mt-4 md:mt-0">
            <RandomFilmDisplay />
          </div>
        </div>

        <FilmPeriodGrid periods={periods} culture={String(culture)} />
      </section>

      {/* Fallback / Featured sections */}
      {fallback && (
        <section className="mt-10 text-center">
          <h2 className="text-lg font-semibold mb-2">
            Start building your film culture!
          </h2>
          <p className="text-neutral-500 mb-4">
            You haven’t added any films yet. Here are some to explore:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {fallback.map((film: Film) => (
              <FilmCard key={film.id} film={film} />
            ))}
          </div>
        </section>
      )}

      {!fallback &&
        (recent?.length || watchlist?.length || favourites?.length) && (
          <div>
            {recent?.length ? (
              <section className="mt-6">
                <h2 className="font-lora text-xl md:text-2xl font-bold text-main mb-2">
                  Recently Watched
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {recent.map((film) => (
                    <FilmCard key={film.id} film={film} />
                  ))}
                </div>
              </section>
            ) : null}

            {watchlist?.length ? (
              <section className="mt-6">
                <h2 className="font-lora text-xl md:text-2xl font-bold text-main mb-2">
                  Your Watchlist
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {watchlist.map((film) => (
                    <FilmCard key={film.id} film={film} />
                  ))}
                </div>
              </section>
            ) : null}

            {favourites?.length ? (
              <section className="mt-6">
                <h2 className="font-lora text-xl md:text-2xl font-bold text-main mb-2">
                  Your Favourites
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {favourites.map((film) => (
                    <FilmCard key={film.id} film={film} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}

      <FilmImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />

      <FilmListDisplayModal
        isOpen={showListDisplayModal}
        onClose={() => setShowListDisplayModal(false)}
        onEditList={handleEditList}
        currentCultureCode={culture}
      />

      <FilmListCreationModal
        isOpen={showListCreationModal}
        onClose={() => {
          setShowListCreationModal(false);
          setShowListDisplayModal(true);
          setEditingList(null);
        }}
        onCreated={handleListCreated}
        initialList={editingList || undefined}
        currentCultureCode={culture}
      />
    </div>
  );
}
