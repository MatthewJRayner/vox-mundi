"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { SVGPath } from "@/utils/path";

interface ImportResult {
  title: string;
  tmdb_id: string;
  created: boolean;
}

interface ImportResponse {
  imported_count: number;
  results: ImportResult[];
}

export default function FilmImportModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const handleImport = async () => {
    try {
      setLoading(true);
      setResults([]);

      const items = input
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);

      if (!items.length) {
        return;
      }

      const { data } = await api.post<ImportResponse>("/import-films/", {
        items,
      });

      setResults(data.results);
    } catch (err) {
      console.error("Import Error", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-start justify-center bg-black/50 z-50 p-4 pt-8 sm:pt-16 overflow-y-auto">
      <div className="relative bg-background p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md sm:max-w-lg flex flex-col max-h-[90vh]">
        {/* ---------- CLOSE BUTTON (X) ---------- */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-2 right-2 p-1"
        >
          <svg
            viewBox={SVGPath.close.viewBox}
            className="size-5 fill-current transition hover:scale-105 active:scale-95 cursor-pointer hover:fill-red-500"
          >
            <path d={SVGPath.close.path} />
          </svg>
        </button>

        <h2 className="text-lg sm:text-xl font-bold font-sans mb-4 pr-8">
          Import Films
        </h2>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste titles or TMDb IDs here (one per line)"
          className="w-full h-32 sm:h-40 p-2 border border-neutral/50 rounded mb-4 bg-neutral text-base focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />

        <div className="flex justify-end gap-2 flex-wrap">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded bg-foreground text-background hover:bg-danger cursor-pointer transition-all duration-300 text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded bg-primary text-white hover:text-background hover:bg-neutral-mid cursor-pointer transition-all duration-300 disabled:opacity-50 text-sm sm:text-base"
          >
            {loading ? "Importing..." : "Import"}
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-4 space-y-2 flex-1 overflow-y-auto">
            <h3 className="font-semibold text-sm sm:text-base font-sans">
              Results:
            </h3>
            <ul className="text-sm">
              {results.map((r, i) => (
                <li
                  key={i}
                  className={r.created ? "text-success" : "text-danger"}
                >
                  {r.title}:{" "}
                  {r.created
                    ? "Successfully imported"
                    : "Already exists or failed"}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
