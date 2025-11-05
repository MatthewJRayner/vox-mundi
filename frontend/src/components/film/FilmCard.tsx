/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { Film, UserFilm } from "@/types/media/film";

/**
 * FilmCard component to display a film's poster and basic info.
 * 
 * @param film - The film object containing details to display, with an attached userfilm object is one exists.
 * @example
 * <FilmCard film={film} />
 */

type FilmProps = {
  film: Film & { userfilm?: UserFilm | null };
};

export default function FilmCard({ film }: FilmProps) {
  const { culture } = useParams();
  const userFilm = film.userfilm ?? null;

  return (
    <Link href={`/${culture}/film/${film.id}`}>
      <div className="relative group w-full aspect-[2/3] rounded overflow-hidden shadow cursor-pointer h-fit">
        {userFilm?.poster ? (
          <img
            src={userFilm.poster}
            alt={film.title}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105`}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
          />
        ) : film.poster ? (
          <img
            src={film.poster}
            alt={film.title}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105`}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
          />
        ) : (
          <div className="w-full h-full bg-extra flex items-center justify-center">
            No Poster
          </div>
        )}

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3">
          <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
          <div className="absolute p-2 inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-70 transition-opacity duration-300 flex flex-col items-center justify-center text-center">
            <h3 className="text-white text-lg font-semibold">{film.title}</h3>
            {film.creator_string && (
              <p className="text-white/50 text-sm">{film.creator_string}</p>
            )}
            {film.release_date && (
              <p className="text-white/50 text-xs mt-1">
                {film.release_date.substring(0, 4)}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
