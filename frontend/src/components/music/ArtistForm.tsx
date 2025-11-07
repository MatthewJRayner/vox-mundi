/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useCallback, useEffect } from "react";
import { ParamValue } from "next/dist/server/request/params";

import api from "@/lib/api";
import { SVGPath } from "@/utils/path";
import { UserMusicArtist } from "@/types/media/music";
import { Culture } from "@/types/culture";

import AlbumEditor from "./AlbumEditor";
import SongEditor from "./SongEditor";

type ArtistFormProps = {
  initialData?: UserMusicArtist;
  onSuccess: () => void;
  currentCultureCode: ParamValue;
  onClose: () => void;
};

export default function ArtistForm({
  initialData,
  onSuccess,
  currentCultureCode,
  onClose,
}: ArtistFormProps) {
  const [formData, setFormData] = useState<UserMusicArtist>(
    initialData || {
      name: "",
      bio: "",
      genres: [],
      photo: "",
      external_links: [],
      year_active_start: undefined,
      year_active_end: undefined,
      ranking_tier: 5,
      favourite: false,
      best_albums: [],
      best_songs: [],
      culture_ids: [],
      cultures: [],
      visibility: "private",
    }
  );

  const [cultures, setCultures] = useState<Culture[]>([]);
  const [showCultureSelect, setShowCultureSelect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [genresInput, setGenresInput] = useState(
    (formData.genres || []).join(", ")
  );
  const [worksInput, setWorksInput] = useState(
    (formData.notable_works || []).join(", ")
  );

  const fetchData = useCallback(async () => {
    if (!currentCultureCode) return;
    try {
      setLoading(true);
      const cultureRes = await api.get(`/cultures/`);
      setCultures(cultureRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentCultureCode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "ranking_tier" ? parseInt(value) || 5 : value,
    }));
  };

  const toggleCulture = (culture: Culture) => {
    setFormData((prev) => {
      const exists = prev.cultures?.some((c) => c.id === culture.id);
      const updated = exists
        ? prev.cultures?.filter((c) => c.id !== culture.id)
        : [...(prev.cultures || []), culture];
      return { ...prev, cultures: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        genres: genresInput
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean),
        notable_works: worksInput
          .split(",")
          .map((w) => w.trim())
          .filter(Boolean),
      };
      const url = initialData
        ? `/user-artists/${initialData.id}/`
        : `/user-artists/`;
      if (initialData) {
        await api.put(url, payload);
      } else {
        await api.post(url, payload);
      }

      onSuccess();
    } catch (error) {
      console.error("Failed to save:", error);
      alert(`Failed to save: ${JSON.stringify(error)}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <main className="p-4">Loading...</main>;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4 max-h-screen">
      <div className="relative bg-background shadow-2xl rounded-xl max-h-[90vh] overflow-y-auto w-full max-w-2xl p-4 md:p-6 border border-border">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-foreground/70 hover:text-foreground active:scale-95 transition"
        >
          <svg
            viewBox={SVGPath.close.viewBox}
            className="size-5 fill-current text-foreground cursor-pointer hover:scale-110 hover:opacity-80 hover:fill-red-400 active:scale-95 transition"
          >
            <path d={SVGPath.close.path} />
          </svg>
        </button>

        <form onSubmit={handleSubmit} className="space-y-3">
          <h2 className="text-xl font-semibold mb-3">
            {initialData ? "Edit Artist" : "Add New Artist"}
          </h2>

          <input
            type="text"
            name="name"
            placeholder="Artist Name"
            value={formData.name || ""}
            onChange={handleChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />

          <textarea
            name="bio"
            placeholder="Bio"
            value={formData.bio || ""}
            onChange={handleChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />

          {formData.photo && (
            <div className="flex flex-col justify-center items-center w-full">
              <h3>Current Photo Preview</h3>
              <img
                src={formData.photo}
                alt={formData.name}
                className="w-24 h-24 md:w-36 md:h-36 object-contain"
              />
            </div>
          )}

          <input
            type="text"
            name="photo"
            placeholder="Photo URL"
            value={formData.photo || ""}
            onChange={handleChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />

          <input
            type="text"
            name="genres"
            placeholder="Genres (comma separated)"
            value={genresInput}
            onChange={(e) => setGenresInput(e.target.value)}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />

          <input
            type="text"
            name="notable_works"
            placeholder="Famous Works (comma separated)"
            value={worksInput}
            onChange={(e) => setWorksInput(e.target.value)}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />

          <div className="flex gap-2">
            <input
              type="number"
              name="year_active_start"
              placeholder="Year Active Start"
              value={formData.year_active_start || ""}
              onChange={handleChange}
              className="bg-extra shadow p-2 w-1/2 rounded text-sm sm:text-base"
            />
            <input
              type="number"
              name="year_active_end"
              placeholder="Year Active End"
              value={formData.year_active_end || ""}
              onChange={handleChange}
              className="bg-extra shadow p-2 w-1/2 rounded text-sm sm:text-base"
            />
          </div>

          <select
            name="ranking_tier"
            value={formData.ranking_tier || 5}
            onChange={handleChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          >
            <option value="1">Tier 1 (Top Favorite)</option>
            <option value="2">Tier 2</option>
            <option value="3">Tier 3</option>
            <option value="4">Tier 4</option>
            <option value="5">Tier 5</option>
          </select>

          <div className="bg-extra shadow p-2 rounded text-sm sm:text-base">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setShowCultureSelect(!showCultureSelect)}
            >
              <span>
                Cultures:{" "}
                {formData.cultures?.map((c) => c.name).join(", ") ||
                  "None selected"}
              </span>
              <span className="text-xs text-foreground/50">
                <svg
                  viewBox={SVGPath.chevron.viewBox}
                  className={`size-5 fill-current transition hover:scale-105 active:scale-95 ${
                    showCultureSelect ? "transform rotate-180" : ""
                  }`}
                >
                  <path d={SVGPath.chevron.path} />
                </svg>
              </span>
            </div>
            {showCultureSelect && (
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto border-t border-gray-300 pt-2">
                {cultures.map((culture) => {
                  const selected = formData.cultures?.some(
                    (c) => c.id === culture.id
                  );
                  return (
                    <label
                      key={culture.id}
                      className={`flex items-center space-x-2 cursor-pointer ${
                        selected ? "text-main rounded px-1" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleCulture(culture)}
                      />
                      <span>{culture.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <AlbumEditor
            albums={formData.best_albums || []}
            setAlbums={(best_albums) =>
              setFormData((prev) => ({ ...prev, best_albums }))
            }
          />
          <SongEditor
            songs={formData.best_songs || []}
            setSongs={(best_songs) =>
              setFormData((prev) => ({ ...prev, best_songs }))
            }
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-foreground text-background w-full md:w-1/4 px-4 py-2 rounded text-sm sm:text-base hover:bg-extra-mid hover:scale-105 transition cursor-pointer"
          >
            {loading
              ? "Saving..."
              : initialData
              ? "Update Artist"
              : "Add Artist"}
          </button>
        </form>
      </div>
    </div>
  );
}
