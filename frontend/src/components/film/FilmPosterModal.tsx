"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api"; // ✅ your axios instance
import { getLanguageName } from "@/utils/iso"; 

type Props = {
  userFilmId: number; // 👈 now this refers to the UserFilm record
  tmdbId: number;
  onClose: () => void;
  onUpdated: () => void;
};

interface ImageResponse {
  aspect_ratio: number;
  height: number;
  iso_639_1: string;
  file_path: string;
  vote_average: number;
  vote_count: number;
  width: number;
}

export default function FilmPosterModal({
  userFilmId,
  tmdbId,
  onClose,
  onUpdated,
}: Props) {
  const [tab, setTab] = useState<"poster" | "backdrop">("poster");
  const [images, setImages] = useState<ImageResponse[]>([]);
  const [language, setLanguage] = useState<string>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // 🔹 Fetch images from TMDB through your backend
  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/films/${tmdbId}/images/`);
        const data = res.data;
        setImages(data[tab === "poster" ? "posters" : "backdrops"] || []);
      } catch (err) {
        console.error("Error fetching images:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, [tab, tmdbId]);

  const filteredImages = images.filter(
    (img) => language === "all" || img.iso_639_1 === language
  );

  // 🔹 PATCH image to UserFilm record
  const handleUpdate = async () => {
    if (!selected) return;

    const payload =
      tab === "poster" ? { poster: selected } : { backdround_pic: selected };

    try {
      await api.patch(`/user-films/${userFilmId}/update-image/`, payload);
      onUpdated();
      onClose();
    } catch (err: unknown) {
        console.warn("Error fetching posters", err)
    }
  };

  return (
    <div className="fixed inset-0 flex items-start justify-center bg-black/70 z-50 p-4 pt-8 sm:pt-16 overflow-y-auto">
      <div className="bg-background rounded-xl shadow-lg p-4 sm:p-6 w-full max-w-md sm:max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold font-sans">
            Change {tab === "poster" ? "Poster" : "Backdrop"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-sm sm:text-base"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 sm:space-x-4 mb-4 flex-wrap gap-y-2">
          <button
            className={`px-2 sm:px-3 py-1 rounded text-sm sm:text-base ${
              tab === "poster" ? "bg-primary text-white" : "bg-neutral"
            }`}
            onClick={() => setTab("poster")}
          >
            Poster
          </button>
          <button
            className={`px-2 sm:px-3 py-1 rounded text-sm sm:text-base ${
              tab === "backdrop" ? "bg-primary text-white" : "bg-neutral"
            }`}
            onClick={() => setTab("backdrop")}
          >
            Backdrop
          </button>
        </div>

        {/* Language selector */}
        <select
          className="mb-4 p-2 border border-neutral/50 rounded text-base focus:outline-none focus:ring-2 focus:ring-primary touch-action-manipulation bg-background text-foreground"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="all" className="bg-background text-foreground">
            All Languages
          </option>
          {[...new Set(images.map((img) => img.iso_639_1).filter(Boolean))].map(
            (lang) => (
              <option
                key={lang}
                value={lang}
                className="bg-background text-foreground"
              >
                {getLanguageName(lang)}
              </option>
            )
          )}
        </select>

        {/* Grid */}
        {loading ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Loading images...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 max-h-[50vh] overflow-y-auto">
            {filteredImages.map((img) => (
              <div
                key={img.file_path}
                className={`border-4 ${
                  selected === img.file_path
                    ? "border-primary"
                    : "border-transparent"
                } cursor-pointer`}
                onClick={() => setSelected(img.file_path)}
              >
                <img
                  src={`https://image.tmdb.org/t/p/w300${img.file_path}`}
                  alt=""
                  className="w-full h-auto rounded"
                />
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end space-x-2 sm:space-x-3 mt-4 flex-wrap gap-y-2">
          <button
            onClick={handleUpdate}
            disabled={!selected || loading}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded bg-primary text-white hover:bg-primary/80 disabled:opacity-50 text-sm sm:text-base"
          >
            Update
          </button>
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded bg-neutral text-white hover:bg-danger text-sm sm:text-base"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
