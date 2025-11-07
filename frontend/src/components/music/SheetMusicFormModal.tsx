"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ParamValue } from "next/dist/server/request/params";

import api from "@/lib/api";
import { SVGPath } from "@/utils/path";
import { UserMusicPiece } from "@/types/media/music";
import { Culture } from "@/types/culture";

interface MusicPieceModalProps {
  isOpen: boolean;
  onClose: () => void;
  piece?: UserMusicPiece | null;
  onSave: (piece: UserMusicPiece) => void;
  currentCultureCode: ParamValue;
}

const MusicPieceModal: React.FC<MusicPieceModalProps> = ({
  isOpen,
  onClose,
  piece,
  onSave,
  currentCultureCode,
}) => {
  const initialFormState: UserMusicPiece = {
    title: "",
    artist: "",
    learned: false,
    sheet_music: [],
    cultures: [],
    visibility: "private",
  };

  const [formData, setFormData] = useState<UserMusicPiece>(initialFormState);
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [showCultureSelect, setShowCultureSelect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCultures = useCallback(async () => {
    if (!currentCultureCode) return;
    try {
      setLoading(true);
      const response = await api.get(`/cultures/?code=${currentCultureCode}`);
      setCultures(response.data);
    } catch (err) {
      console.error("Error fetching cultures:", err);
      setError("Failed to load cultures.");
    } finally {
      setLoading(false);
    }
  }, [currentCultureCode]);

  useEffect(() => {
    fetchCultures();
  }, [fetchCultures]);

  useEffect(() => {
    if (piece) {
      setFormData({
        ...piece,
        sheet_music: piece.sheet_music || ["", ""],
        culture_ids: piece.culture_ids || [],
        release_year: piece.release_year || undefined,
        cultures: piece.cultures || [],
      });
    } else {
      setFormData(initialFormState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [piece]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked =
      e.target instanceof HTMLInputElement ? e.target.checked : undefined;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? parseFloat(value)
          : value,
    }));
  };

  const toggleCulture = (culture: Culture) => {
    setFormData((prev) => {
      const exists = prev.cultures.some((c) => c.id === culture.id);
      const updated = exists
        ? prev.cultures.filter((c) => c.id !== culture.id)
        : [...prev.cultures.filter((c) => c.id !== culture.id), culture];
      return { ...prev, cultures: updated };
    });
  };

  const [sheetMusicInput, setSheetMusicInput] = useState(
    (formData.sheet_music || []).join(", ")
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (!formData.title || !formData.instrument) {
      setError("Title and instrument are required.");
      setLoading(false);
      return;
    }
    try {
      const payload = {
        ...formData,
        culture_ids: formData.culture_ids,
        sheet_music: sheetMusicInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };
      const url = piece
        ? `/user-music-pieces/${piece.id}/`
        : `/user-music-pieces/`;
      const response = piece
        ? await api.put(url, payload)
        : await api.post(url, payload);
      onSave(response.data);
      onClose();
      setFormData(initialFormState);
    } catch (err) {
      console.error("Failed to save:", err);
      setError(`Failed to save: ${JSON.stringify(err)}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed p-2 md:p-4 max-h-screen inset-0 bg-black/20 backdrop-blur-md flex justify-center items-center z-50">
      <div className="bg-background rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-md">
        <h2 className="text-xl sm:text-2xl font-garamond font-bold mb-4">
          {piece ? "Edit Music Piece" : "Add New Music Piece"}
        </h2>
        {error && (
          <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm sm:text-base">
            {error}
          </div>
        )}
        {loading && <div className="mb-3 text-sm sm:text-base">Loading...</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            name="title"
            placeholder="Title"
            value={formData.title || ""}
            onChange={handleChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
            required
          />
          <input
            type="text"
            name="artist"
            placeholder="Artist"
            value={formData.artist || ""}
            onChange={handleChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />
          <input
            type="text"
            name="instrument"
            placeholder="Instrument"
            value={formData.instrument || ""}
            onChange={handleChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
            required
          />
          <input
            type="url"
            name="recording"
            placeholder="Recording URL"
            value={formData.recording || ""}
            onChange={handleChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />
          <input
            type="text"
            name="sheet_music"
            placeholder="MuseScore User ID & Score ID (Comma Seperated)"
            value={sheetMusicInput}
            onChange={(e) => setSheetMusicInput(e.target.value)}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />
          <input
            type="number"
            name="release_year"
            placeholder="Release Year"
            value={formData.release_year || ""}
            onChange={handleChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />
          <div className="bg-extra shadow p-2 rounded text-sm sm:text-base">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setShowCultureSelect(!showCultureSelect)}
            >
              <span>
                Cultures:{" "}
                {formData.cultures.map((c) => c.name).join(", ") ||
                  "None selected"}
              </span>
              <span className="text-xs text-gray-500">
                <svg
                  viewBox={SVGPath.chevron.viewBox}
                  className={`size-5 fill-current text-foreground transform transition-transform ${
                    showCultureSelect ? "rotate-180" : ""
                  }`}
                >
                  <path d={SVGPath.chevron.path} />
                </svg>
              </span>
            </div>
            {showCultureSelect && (
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto border-t border-gray-300 pt-2">
                {cultures.map((culture) => {
                  const selected = formData.cultures.some(
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
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="learned"
              checked={formData.learned}
              onChange={handleChange}
            />
            <span className="text-sm sm:text-base">Learned</span>
          </label>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-red-500 text-white rounded text-sm sm:text-base hover:bg-red-400 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-foreground text-background rounded text-sm sm:text-base hover:bg-foreground/80 transition cursor-pointer"
            >
              {loading ? "Saving..." : piece ? "Update Piece" : "Add Piece"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MusicPieceModal;
