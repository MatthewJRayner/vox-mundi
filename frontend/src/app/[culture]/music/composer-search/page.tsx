"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useParams } from "next/navigation";
import type { UserComposerSearch } from "@/types/media/music";
import ConcertEventCard, { ConcertEvent } from "@/components/music/ConcertEventCard";

export default function ComposerSearchPage() {
  const { culture } = useParams<{ culture: string }>();
  const [userData, setUserData] = useState<UserComposerSearch | null>(null);
  const [results, setResults] = useState<ConcertEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [composerList, setComposerList] = useState<string[]>([]);
  const [composerListInput, setComposerListInput] = useState<string>("");

  // --- Load user and composer list ---
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get(`/user-composer-search/?code=${culture}`);
        const data = res.data?.[0];
        if (data) {
          setUserData(data);
          setComposerList(data.composer_list || []);
          setComposerListInput((data.composer_list || []).join(", "));
        }
      } catch {
        console.warn("No user composer search found");
      }
    };
    fetchUser();
  }, [culture]);

  // --- Search (no map now) ---
  const handleSearch = async () => {
    setLoading(true);
    setResults([]);
    try {
      const res = await api.post("/composer-search/");
      setResults(res.data.results ?? []);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Save composer list ---
  const handleSaveComposers = async () => {
    if (!userData) return;
    const updatedList = composerListInput
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    try {
      await api.put(`/user-composer-search/${userData.id}/`, {
        composer_list: updatedList,
      });
      setComposerList(updatedList);
      setEditing(false);
    } catch (err) {
      console.error("Failed to save composer list:", err);
    }
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen p-2 md:p-4 font-serif">
      <h1 className="text-3xl font-bold mb-4">Composer Event Search</h1>

      {/* Composer list block */}
      <div className="bg-extra rounded-xl p-4 mb-6 w-full max-w-3xl shadow">
        <h2 className="text-lg font-semibold mb-2">Composers</h2>

        {!editing ? (
          <div className="flex flex-wrap gap-2 mb-3">
            {composerList.length > 0 ? (
              composerList.map((c, i) => (
                <span
                  key={i}
                  className="bg-main/10 px-3 py-1 rounded-full text-sm md:text-lg"
                >
                  {c}
                </span>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No composers selected.
              </p>
            )}
          </div>
        ) : (
          <textarea
            value={composerListInput}
            onChange={(e) => setComposerListInput(e.target.value)}
            className="w-full p-2 border rounded mb-3 text-sm"
            rows={3}
            placeholder="Enter composers separated by commas"
          />
        )}

        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={handleSaveComposers}
                className="text-sm md:text-lg font-inter md:font-lora rounded px-3 py-1 bg-foreground text-background hover:opacity-80 cursor-pointer"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-sm md:text-lg font-inter md:font-lora bg-red-500 text-white cursor-pointer hover:bg-red-600 rounded px-3 py-1"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-sm md:text-lg bg-foreground text-extra rounded px-3 py-1 hover:opacity-80 cursor-pointer font-inter md:font-lora"
            >
              Edit List
            </button>
          )}
          <button
            onClick={handleSearch}
            disabled={loading}
            className="text-sm md:text-lg font-inter md:font-lora rounded px-3 py-1 bg-primary text-white hover:bg-blue-600 cursor-pointer"
          >
            {loading ? "Searching…" : "Search Events"}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="w-full max-w-3xl space-y-4">
        {loading && <p className="text-foreground/60 font-inter">Fetching results…</p>}
        {!loading && results.length === 0 && (
          <p className="text-foreground/60 text-center font-inter">
            No results yet. Try searching!
          </p>
        )}
        {results.map((event, idx) => (
          <ConcertEventCard key={idx} event={event} />
        ))}
      </div>
    </div>
  );
}
