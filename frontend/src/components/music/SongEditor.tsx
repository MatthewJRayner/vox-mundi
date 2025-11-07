"use client";

import { useState } from "react";

import { SVGPath } from "@/utils/path";

type Song = {
  title: string;
  release_year?: number;
};

type Props = {
  songs: Song[];
  setSongs: (s: Song[]) => void;
};

export default function SongEditor({ songs, setSongs }: Props) {
  const [view, setView] = useState(false);

  const addSong = () =>
    setSongs([...songs, { title: "", release_year: undefined }]);

  const updateSong = (index: number, field: keyof Song, value: string) => {
    const updated = [...songs];
    if (field === "release_year") {
      updated[index][field] = value ? parseFloat(value) : 0;
    } else {
      updated[index][field] = value;
    }
    setSongs(updated);
  };

  const removeSong = (index: number) => {
    setSongs(songs.filter((_, i) => i !== index));
  };

  return (
    <div className="p-2 shadow rounded bg-extra w-full">
      <button
        type="button"
        className="mb-2 w-full text-left text-sm sm:text-base cursor-pointer flex items-center justify-between"
        onClick={() => setView(!view)}
      >
        <span className={`mr-1 transition ${view ? "text-main" : ""}`}>
          Best Songs
        </span>
        <span className={`transition duration-400 text-foreground/50`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={SVGPath.chevron.viewBox}
            fill="currentColor"
            className={`w-4 h-4 transition-transform ${
              view ? "rotate-180" : ""
            }`}
          >
            <path
              fillRule="evenodd"
              d={SVGPath.chevron.path}
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>

      {view && (
        <>
          {songs.map((song, index) => (
            <div key={index} className="mb-3 p-2 rounded">
              <input
                type="text"
                placeholder="Song Title"
                value={song.title}
                onChange={(e) => updateSong(index, "title", e.target.value)}
                className="border-b-2 p-1 w-full mb-2"
              />
              <input
                type="number"
                placeholder="Release Year"
                value={song.release_year || ""}
                onChange={(e) =>
                  updateSong(index, "release_year", e.target.value)
                }
                className="border-b-2 p-1 w-full mb-2"
              />
              <button
                type="button"
                onClick={() => removeSong(index)}
                className="bg-red-400 rounded-sm text-white px-2 py-1 mt-2 text-sm hover:bg-red-500 transition"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSong}
            className="bg-primary text-white px-2 py-1 rounded hover:bg-primary/80 transition cursor-pointer"
          >
            + Add Song
          </button>
        </>
      )}
    </div>
  );
}
