"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Period } from "@/types/culture";
import { Film, UserFilm } from "@/types/media/film";
import { UniversalItem } from "@/types/universal";
import { List } from "@/types/list";
import SearchBar from "@/components/SearchBar";
import FilmCard from "@/components/film/FilmCard";
// import FilmListModal
import FilmImportModal from "@/components/film/FilmImportModal";
import { SVGPath } from "@/utils/path";

export default function FilmPage() {
  const { culture } = useParams();
  const [films, setFilms] = useState<Film[]>([]);
  const [userFilms, setUserFilms] = useState<UserFilm[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [activePeriod, setActivePeriod] = useState<Period | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const fetchData = useCallback(async () => {
    if (!culture) return;
    try {
      setLoading(true);
      setError(null);
      const [filmRes, userFilmRes, periodRes] = await Promise.all([
        api.get(`/films/frontpage?code=${culture}`),
        api.get(`/user-films/`),
        api.get(`/periods/code=${culture}&key=film`)
      ]);

      setFilms(filmRes.data);
      setUserFilms(userFilmRes.data);
      setPeriods(periodRes.data);
    } catch (error) {
      console.error("Error fetching data", error);
      setError("Failed to load cuisine data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [culture]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      <FilmImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </div>
  );
}
