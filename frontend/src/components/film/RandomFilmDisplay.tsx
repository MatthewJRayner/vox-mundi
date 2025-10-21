"use client";

import React, { useState } from "react";
import api from "@/lib/api";
import { Film, UserFilm } from "@/types/media/film";
import FilmCard from "./FilmCard";
import { SVGPath } from "@/utils/path";

export default function RandomFilmDisplay() {
  const [film, setFilm] = useState<Film | null>(null);
  const [userFilm, setUserFilm] = useState<UserFilm | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRandomFilm = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/films/random/");
      setFilm(res.data.film);
      setUserFilm(res.data.userfilm);
    } catch (err) {
      console.error("Error fetching random film:", err);
      setError("Couldn't fetch a random film.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col items-center text-center">
      <div className="flex items-center space-x-2">
        <h2 className="font-lora text-lg md:text-2xl font-bold=">Discover a Random Film</h2>
        <button onClick={fetchRandomFilm}>
          <svg
            viewBox={SVGPath.refresh.viewBox}
            className="size-4 md:size-5 fill-current transition hover:scale-105 active:scale-95 cursor-pointer hover:fill-primary"
          >
            <path d={SVGPath.refresh.path} />
          </svg>
        </button>
      </div>
      {!film && !loading && (
        <p className="text-foreground/50 mb-4 text-xs md:text-base">
          Click to explore a random film from the database!
        </p>
      )}

      {error && <p className="text-red-500">{error}</p>}

      {film && (
        <div className="mt-4 h-fit max-w-[150px] md:max-w-[275px] shadow-lg hover:shadow-2xl">
          <FilmCard film={film} />
        </div>
      )}
    </section>
  );
}
