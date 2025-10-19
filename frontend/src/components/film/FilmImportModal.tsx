"use client";

import { useState } from "react";
import api from "@/lib/api";

interface ImportResult {
  title: string;
  tmdb_id: string;
  created: boolean;
}

interface ImportResponse {
  imported_count: number;
  results: ImportResult[]; // Fix: Array of ImportResult
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
  const [results, setResults] = useState<ImportResult[]>([]); // Fix: Use ImportResult[]
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    try {
      setLoading(true);
      setResults([]);
      setError(null);

      const items = input
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);

      if (!items.length) {
        setError("Please enter at least one TMDb ID or title.");
        return;
      }

      const { data } = await api.post<ImportResponse>("/import-films/", { items });

      setResults(data.results);
    } catch (error) {
      console.error("Import Error", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-start justify-center bg-black/50 z-50 p-4 pt-8 sm:pt-16 overflow-y-auto">
      <div className="bg-background p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md sm:max-w-lg flex flex-col max-h-[90vh]">
        <h2 className="text-lg sm:text-xl font-bold font-sans mb-4">
          Import Films
        </h2>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste titles or TMDb IDs here (one per line)"
          className="w-full h-32 sm:h-40 p-2 border border-neutral/50 rounded mb-4 bg-neutral text-base focus:outline-none focus:ring-2 focus:ring-primary resize-none touch-action-manipulation"
        />
        {error && <p className="text-danger text-sm mb-4">{error}</p>}
        <div className="flex justify-end gap-2 flex-wrap">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded bg-neutral-mid text-background hover:bg-danger hover:text-white cursor-pointer transition-all duration-300 text-sm sm:text-base"
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
                  {r.title}: {r.created ? "Successfully imported" : "Already exists or failed"}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}