"use client";

import React, { useState } from "react";

import api from "@/lib/api";

interface BookImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported?: (count: number) => void;
}

interface SearchResults {
    title: string;
    author: string | null;
    first_publish_year?: number | null;
    work_id: string;
}

export default function BookImportModal({ isOpen, onClose, onImported }: BookImportModalProps) {
  const [manualInput, setManualInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResults[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleManualImport = async () => {
    if (!manualInput.trim()) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.post("/import-books/", {
        items: manualInput.split(",").map((x) => x.trim()),
      });
      setFeedback(`Imported ${res.data.imported_count} book(s)!`);
      if (onImported) onImported(res.data.imported_count);
      setManualInput("");
    } catch (err) {
      console.error("Import Failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.get(`/search-books/?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data.results || []);
    } catch (err) {
      console.error("Search failed", err)
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (workId: string) => {
    setSelected((prev) =>
      prev.includes(workId) ? prev.filter((id) => id !== workId) : [...prev, workId]
    );
  };

  const handleImportSelected = async () => {
    if (!selected.length) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.post("/import-books/", { items: selected });
      setFeedback(`Imported ${res.data.imported_count} book(s)!`);
      if (onImported) onImported(res.data.imported_count);
      setSelected([]);
    } catch (err) {
      console.error("Import failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-background text-foreground rounded-2xl shadow-xl w-full max-w-2xl p-6 relative">
        <h2 className="text-xl font-bold mb-4 text-center">Import Books</h2>

        <section className="mb-6">
          <h3 className="font-semibold mb-2">Direct Add</h3>
          <p className="text-sm text-neutral-500 mb-2">
            Enter book titles or OpenLibrary Work IDs (comma-separated).
          </p>
          <div className="flex gap-2">
            <input
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="e.g. Pride and Prejudice, OL12345W"
              className="flex-1 px-3 py-2 rounded-lg border border-neutral-700 bg-background"
            />
            <button
              onClick={handleManualImport}
              disabled={loading}
              className="px-4 py-2 bg-main text-white rounded-lg hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              Add
            </button>
          </div>
        </section>

        <section>
          <h3 className="font-semibold mb-2">Search OpenLibrary</h3>
          <div className="flex gap-2 mb-3">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a book..."
              className="flex-1 px-3 py-2 rounded-lg border border-neutral-700 bg-background"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 bg-main text-white rounded-lg hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              Search
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="max-h-60 overflow-y-auto border border-neutral-700 rounded-lg">
              {searchResults.map((book) => (
                <div
                  key={book.work_id}
                  className={`flex items-center justify-between px-3 py-2 hover:bg-extra/30 transition ${
                    selected.includes(book.work_id) ? "bg-extra/50" : ""
                  }`}
                >
                  <div className="text-left">
                    <p className="font-medium">{book.title}</p>
                    <p className="text-sm text-neutral-500">{book.author}</p>
                    {book.first_publish_year && (
                      <p className="text-xs text-neutral-400">
                        First published: {book.first_publish_year}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleSelect(book.work_id)}
                    className={`text-sm font-medium px-3 py-1 rounded-lg border ${
                      selected.includes(book.work_id)
                        ? "bg-main text-white border-main"
                        : "border-neutral-600"
                    }`}
                  >
                    {selected.includes(book.work_id) ? "Selected" : "Select"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {selected.length > 0 && (
            <button
              onClick={handleImportSelected}
              disabled={loading}
              className="mt-3 w-full py-2 bg-main text-background rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              Import {selected.length} Selected
            </button>
          )}
        </section>

        {feedback && (
          <p className="mt-4 text-sm text-center text-neutral-400">{feedback}</p>
        )}

        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-neutral-400 hover:text-foreground text-xl"
        >
          ×
        </button>
      </div>
    </div>
  );
}
