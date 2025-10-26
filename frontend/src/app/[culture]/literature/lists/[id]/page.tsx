"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Book } from "@/types/media/book";
import { List } from "@/types/list";
import BookCard from "@/components/literature/BookCard";
import SearchBar from "@/components/SearchBar";
import BookListCreationModal from "@/components/literature/BookListCreationModal";
import { SVGPath } from "@/utils/path";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

type SortOption = "date-desc" | "date-asc" | "rating-desc" | "rating-asc";

export default function BookListPage() {
  const { culture, id } = useParams();
  const [list, setList] = useState<List | undefined>(undefined);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [showListModal, setShowListModal] = useState(false);
  const [initialListData, setInitialListData] = useState<List | undefined>(
    undefined
  );
  const [showFullDesc, setShowFullDesc] = useState(false);

  const fetchList = useCallback(async () => {
    if (!id) {
      setError("Missing list ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/lists/${id}/`);
      const listData = res.data;
      setList(listData);
      setInitialListData(listData);
    } catch {
      setError("Failed to load list. Please try again.");
      setList(undefined);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchBooks = useCallback(async () => {
    if (!list || !list.items || list.items.length === 0) {
      setBooks([]);
      setLoading(false);
      return;
    }

    const universalItemIds = list.items.map((item) => item.id).join(",");

    try {
      setLoading(true);
      setError(null);
      const res = await api.get(
        `/books/list_books/?ids=${encodeURIComponent(universalItemIds)}${
          searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""
        }`
      );
      const { results } = res.data;
      setBooks(results);
    } catch {
      setError("Failed to load books. Please try again.");
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [list, searchQuery]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (list) {
      setBooks([]);
      setError(null);
      setLoading(true);
      fetchBooks();
    }
  }, [list, fetchBooks]);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      setSearchQuery(searchQuery);
      setBooks([]);
      setError(null);
      setLoading(true);
      fetchBooks();
    },
    [fetchBooks]
  );

  const sortedBooks = useMemo(() => {
    return [...books].sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return (
            new Date(b.userbook?.date_finished || "1900-01-01").getTime() -
            new Date(a.userbook?.date_finished || "1900-01-01").getTime()
          );
        case "date-asc":
          return (
            new Date(a.userbook?.date_finished || "1900-01-01").getTime() -
            new Date(b.userbook?.date_finished || "1900-01-01").getTime()
          );
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

  if (loading && !list) {
    return (
      <div className="p-6 text-center text-gray-400 font-sans">Loading...</div>
    );
  }

  if (!list) {
    return (
      <div className="p-6 text-center text-gray-400 font-sans">
        List not found
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 sm:mb-6">
        <div className="flex flex-col">
          <div className="flex space-x-2 items-center">
            <h1 className="text-2xl md:text-3xl font-bold font-lora text-main flex items-center">
              <Link
                href={`/${culture}/literature`}
                className="text-main hover:opacity-80 text-sm md:text-base mr-2"
                aria-label="Back to books"
              >
                <span>
                  <svg
                    viewBox={SVGPath.arrow.viewBox}
                    className={`size-4 md:size-5 fill-current transition hover:scale-105 active:scale-95`}
                  >
                    <path d={SVGPath.arrow.path} />
                  </svg>
                </span>
              </Link>
              {list.name}
            </h1>
            <p className="font-sans text-xs sm:text-sm text-gray-400">
              {list.items.length ? `(${list.items.length} Books)` : ""}
            </p>
            <button
              onClick={() => {
                setShowListModal(true);
                setInitialListData(list);
              }}
              className="font-sans hover:text-primary transition-all duration-300 cursor-pointer text-lg"
            >
              ✎
            </button>
          </div>
          <div className="w-full flex-col justify-between items-start md:space-x-4">
            {list.description ? (
              <div className="relative w-full md:w-3/4">
                <div
                  className={`text-sm/[1.75] sm:text-base/[1.75] leading-relaxed text-foreground/50 transition-all duration-300 ${
                    showFullDesc
                      ? "max-h-none"
                      : "max-h-52 md:max-h-42 overflow-hidden"
                  }`}
                >
                  <ReactMarkdown>{list.description}</ReactMarkdown>
                </div>
                {!showFullDesc && list.description && list.description.length > 300 && (
                  <div className="absolute bottom-5 left-0 w-full h-10 sm:h-12 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none" />
                )}
                {list.description && list.description.length > 300 && (
                  <button
                    onClick={() => setShowFullDesc(!showFullDesc)}
                    className="mt-1 cursor-pointer z-10 flex items-center font-lora sm:text-base"
                    aria-expanded={showFullDesc}
                  >
                    <span className="mr-1 font-bold transition hover:text-main">
                      {showFullDesc ? "Show Less" : "Show More"}
                    </span>
                    <span
                      className={`transition-transform duration-300 ${
                        showFullDesc ? "rotate-180" : "rotate-0"
                      }`}
                    >
                      <svg
                        viewBox={SVGPath.chevron.viewBox}
                        className="size-5 fill-current cursor-pointer transition-transform"
                      >
                        <path d={SVGPath.chevron.path} />
                      </svg>
                    </span>
                  </button>
                )}
              </div>
            ) : (
              <p className="text-foreground/50">
                There&apos;s currently no description saved for this list. Click the edit button to change this.
              </p>
            )}
            <div className="w-full md:w-1/3 mt-4 ">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-sm sm:text-base font-sans p-2 rounded bg-extra shadow cursor-pointer text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="date-desc">
                  Release Date (Newest → Oldest)
                </option>
                <option value="date-asc">Release Date (Oldest → Newest)</option>
                <option value="rating-desc">Rating (High → Low)</option>
                <option value="rating-asc">Rating (Low → High)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 sm:mb-6">
        <SearchBar onSearch={handleSearch} />
      </div>

      {loading && books.length === 0 && (
        <div className="text-center text-gray-400 font-sans">Loading...</div>
      )}
      {sortedBooks.length === 0 && !loading && !error && (
        <p className="text-center text-gray-400 font-sans">
          No books found in this list.
        </p>
      )}
      {sortedBooks.length > 0 && (
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
      )}

      {showListModal && (
        <BookListCreationModal
          isOpen={showListModal}
          onClose={() => {
            setShowListModal(false);
            setInitialListData(undefined);
          }}
          onCreated={() => {
            fetchList();
            setShowListModal(false);
            setInitialListData(undefined);
          }}
          initialList={initialListData}
          currentCultureCode={culture}
        />
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
