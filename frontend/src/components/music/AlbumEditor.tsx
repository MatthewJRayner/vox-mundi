"use client";

import { useState } from "react";
import { SVGPath } from "@/utils/path";

type Album = {
  title: string;
  release_year?: number;
  cover?: string;
};

type Props = {
  albums: Album[];
  setAlbums: (a: Album[]) => void;
};

export default function AlbumEditor({ albums, setAlbums }: Props) {
  const [view, setView] = useState(false);

  const addAlbum = () => setAlbums([...albums, { title: "", release_year: 0, cover: "" }]);

  const updateAlbum = (
    index: number,
    field: keyof Album,
    value: string
  ) => {
    const updated = [...albums];
    if (field === "release_year") {
      updated[index][field] = value ? parseFloat(value) : 0;
    } else {
      updated[index][field] = value;
    }
    setAlbums(updated);
  };

  const removeAlbum = (index: number) => {
    setAlbums(albums.filter((_, i) => i !== index));
  };

  return (
    <div className="p-2 shadow rounded bg-extra w-full">
      <button
        type="button"
        className="mb-2 w-full text-left text-sm sm:text-base cursor-pointer flex items-center justify-between"
        onClick={() => setView(!view)}
      >
        <span className={`mr-1 transition ${view ? "text-main" : ""}`}>
          Best Albums
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
            <path fillRule="evenodd" d={SVGPath.chevron.path} clipRule="evenodd" />
          </svg>
        </span>
      </button>

      {view && (
        <>
          {albums.map((album, index) => (
            <div key={index} className="mb-3 p-2 rounded">
              <input
                type="text"
                placeholder="Album Title"
                value={album.title}
                onChange={(e) => updateAlbum(index, "title", e.target.value)}
                className="border-b-2 p-1 w-full mb-2"
              />
              <input
                type="number"
                placeholder="Release Year"
                value={album.release_year || ""}
                onChange={(e) => updateAlbum(index, "release_year", e.target.value)}
                className="border-b-2 p-1 w-full mb-2"
              />
              <input
                type="text"
                placeholder="Cover URL"
                value={album.cover || ""}
                onChange={(e) => updateAlbum(index, "cover", e.target.value)}
                className="border-b-2 p-1 w-full mb-2"
              />
              <button
                type="button"
                onClick={() => removeAlbum(index)}
                className="bg-red-400 rounded-sm text-white px-2 py-1 mt-2 text-sm hover:bg-red-500 transition cursor-pointer"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addAlbum}
            className="bg-primary text-white px-2 py-1 rounded hover:bg-primary/80 transition cursor-pointer"
          >
            + Add Album
          </button>
        </>
      )}
    </div>
  );
}
