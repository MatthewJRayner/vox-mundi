"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Book } from "@/types/media/book";
import BookCard from "@/components/literature/BookCard";
import SearchBar from "@/components/SearchBar";
import { SVGPath } from "@/utils/path";

type SortOption = "rating-desc" | "rating-asc";

export default function FilmSearchPage() {
  const params = useParams();
  const culture = String(params.culture || "");
  const category = String(params.category || "");
  const query = decodeURIComponent(String(params.query || ""));

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("rating-desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchBooks = useCallback(
    async (reset = false) => {
      if (!category || !query || !culture) return;

      const paramMap: Record<string, string> = {
        author: "author",
        genre: "genre",
      };
      const param = paramMap[category.toLowerCase()] || "q";

      const currentOffset = reset ? 0 : offset;

      try {
        setLoading(true);
        setError(null);

        const res = await api.get(
          `/books/search/?${param}=${encodeURIComponent(
            query
          )}&offset=${currentOffset}&limit=${limit}`
        );

        const { results, total } = res.data;

        setBooks((prev) => {
          if (reset) return results;
          const existingIds = new Set(prev.map((b) => b.id));
          const newBooks = results.filter((b: Book) => !existingIds.has(b.id));
          return [...prev, ...newBooks];
        });

        setOffset(currentOffset + limit);
        setTotal(total);
        setHasMore(results.length === limit && currentOffset + limit < total);
      } catch (err) {
        console.error("Error fetching results:", err);
        setError("Failed to load books. Please try again.");
        setBooks([]);
      } finally {
        setLoading(false);
      }
    },
    [category, query, culture, offset]
  );

  useEffect(() => {
    setBooks([]);
    setOffset(0);
    setHasMore(true);
    setTotal(0);
    setError(null);

    fetchBooks(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, query, culture]);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!category || !query || !culture) {
        setError("Missing search parameters");
        return;
      }

      setLoading(true);
      setError(null);
      setBooks([]);
      setOffset(0);
      setHasMore(true);
      setTotal(0);

      const paramMap: Record<string, string> = {
        author: "author",
        genre: "genre",
      };
      const param = paramMap[category.toLowerCase()] || "q";

      try {
        const res = await api.get(
          `/books/search/?${param}=${encodeURIComponent(
            query
          )}&offset=0&limit=${limit}${
            searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""
          }`
        );

        const { results, total } = res.data;

        console.log(`Search returned ${results.length} books, total: ${total}`);
        setBooks(results);
        setOffset(limit);
        setTotal(total);
        setHasMore(results.length === limit && limit < total);
      } catch (error) {
        console.error("Error handling search:", error);
        setError("Failed to load books. Please try again.");
        setBooks([]);
      } finally {
        setLoading(false);
      }
    },
    [category, query, culture]
  );

  const sortedBooks = useMemo(() => {
    return [...books].sort((a, b) => {
      switch (sortBy) {
        case "rating-desc":
          return (
            (Number(b.userbook?.rating) || 0) -
            (Number(a.userbook?.rating) || 0)
          );
        case "rating-asc":
          return (
            (Number(a.userbook?.rating) || 0) -
            (Number(b.userbook?.rating) || 0)
          );
        default:
          return 0;
      }
    });
  }, [books, sortBy]);

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  let headingText = ``;

  if (category.toLowerCase() === "author") {
    headingText = "Books written by";
  } else if (category.toLowerCase() === "genre") {
    headingText = "Books about";
  }

  return (
    <div className="p-4 sm:p-6">
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 sm:mb-6">
        <div className="flex flex-col">
          <h3 className="text-gray-400 text-xs uppercase font-sans">
            {headingText}
          </h3>
          <h1 className="text-2xl md:text-3xl font-bold font-lora mt-1">
            {query && category && decodeURIComponent(query)}
          </h1>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="w-full sm:w-1/2 md:w-1/4 text-sm sm:text-base font-sans p-2 rounded bg-extra shadow cursor-pointer text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="date-desc">Release Date (Newest → Oldest)</option>
          <option value="date-asc">Release Date (Oldest → Newest)</option>
          <option value="rating-desc">Rating (High → Low)</option>
          <option value="rating-asc">Rating (Low → High)</option>
        </select>
      </div>

      <div className="mb-4 sm:mb-6">
        <SearchBar
          onSearch={(searchQuery) => {
            handleSearch(searchQuery);
          }}
        />
      </div>

      {loading && books.length === 0 && (
        <div className="text-center text-gray-400 font-sans">Loading...</div>
      )}
      {sortedBooks.length === 0 && !loading && !error && (
        <p className="text-center text-gray-400 font-sans">No results found.</p>
      )}
      {sortedBooks.length > 0 && (
        <>
          <ul className="grid gap-2 sm:gap-6 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
            {sortedBooks.map((book) => (
              <div
                key={book.id}
                className={`${
                  book.userbook?.read ? "opacity-50 hover:opacity-100" : ""
                }`}
              >
                <BookCard book={book} />
              </div>
            ))}
          </ul>
          {hasMore && !loading && (
            <div className="mt-4 sm:mt-6 text-sm sm:text-base text-center">
              <button
                onClick={() => fetchBooks(false)} // ✅ don’t reset, just load next
                disabled={loading || !hasMore}
                className="font-sans bg-primary text-white px-4 py-2 rounded hover:bg-neutral-mid hover:text-background cursor-pointer"
              >
                {loading ? "Loading..." : "Show More"}
              </button>
            </div>
          )}
          {loading && books.length > 0 && (
            <div className="text-center mt-4 text-gray-400 font-sans">
              Loading more...
            </div>
          )}
        </>
      )}

      <button
        onClick={handleBackToTop}
        className="fixed bottom-5 right-5 bg-primary text-white p-3 rounded-full shadow-lg hover:opacity-50 cursor-pointer active:scale-95 transition-all duration-300 z-20"
        aria-label="Back to top"
      >
        <svg
          viewBox={SVGPath.arrow.viewBox}
          className="size-5 fill-current transition hover:scale-105 active:scale-95 transform rotate-90"
        >
          <path d={SVGPath.arrow.path} />
        </svg>
      </button>
    </div>
  );
}
