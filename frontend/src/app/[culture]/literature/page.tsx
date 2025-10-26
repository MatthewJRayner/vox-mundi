"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Period, PageContent } from "@/types/culture";
import { Book, UserBook, BookPageData } from "@/types/media/book";
import { List } from "@/types/list";
import SearchBar from "@/components/SearchBar";
import BookCard from "@/components/literature/BookCard";
import BookImportModal from "@/components/literature/BookImportModal";
import BookPeriodGrid from "@/components/literature/BookPeriodGrid";
import RandomBookDisplay from "@/components/literature/RandomBookDisplay";
import BookListCreationModal from "@/components/literature/BookListCreationModal";
import BookListDisplayModal from "@/components/literature/BookListDisplayModal";
import { SVGPath } from "@/utils/path";
import ReactMarkdown from "react-markdown";

export default function BookPage() {
  const { culture } = useParams();
  const [books, setBooks] = useState<BookPageData | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showListDisplayModal, setShowListDisplayModal] = useState(false);
  const [editingList, setEditingList] = useState<List | null>(null);
  const [showListCreationModal, setShowListCreationModal] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Book[]>([]);

  const fetchData = useCallback(async () => {
    if (!culture) return;
    try {
      setLoading(true);
      setError(null);

      const [bookRes, periodRes, pageContentRes] = await Promise.all([
        api.get(`/books/frontpage?code=${culture}`),
        api.get(`/periods/?code=${culture}&key=literature`),
        api.get(`/page-contents/?code=${culture}&key=literature`),
      ]);

      setBooks(bookRes.data);
      setPeriods(periodRes.data);
      setPageContent(pageContentRes.data[0] || null);
    } catch (error) {
      console.error("Error fetching data", error);
      setError("Failed to load book data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [culture]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    try {
      const res = await api.get(
        `/simple-books/?q=${encodeURIComponent(query)}&limit=5`
      );
      setResults(res.data);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  }, []);

  const handleListCreated = useCallback(() => {
    fetchData();
    setShowListDisplayModal(true);
  }, [fetchData]);

  const handleEditList = (list: List) => {
    setEditingList(list);
    setShowListDisplayModal(false);
    setShowListCreationModal(true);
  };

  let readlist = books?.readlist;
  let favourites = books?.favourites;
  let recent = books?.recent;
  if (recent) {
    recent = recent.sort((a, b) => {
      const dateA = a.userbook?.date_finished
        ? new Date(a.userbook?.date_finished)
        : new Date(0);
      const dateB = b.userbook?.date_finished
        ? new Date(b.userbook?.date_finished)
        : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }
  let fallback = books?.fallback;

  if (isSmallScreen) {
    readlist = readlist?.slice(0, 4);
    favourites = favourites?.slice(0, 4);
    recent = recent?.slice(0, 4);
    fallback = fallback?.slice(0, 4);
  }

  if (loading) return <div className="p-4 text-gray-400">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-2 md:p-6 flex flex-col text-center md:text-left">
      <section className="relative flex items-center w-full">
        <SearchBar onSearch={(query) => handleSearch(query)} />
        <button onClick={() => setShowImportModal(true)}>
          <svg
            viewBox={SVGPath.add.viewBox}
            className="size-5 fill-current text-foreground ml-4 cursor-pointer hover:scale-110 hover:opacity-80 active:scale-95 transition"
          >
            <path d={SVGPath.add.path} />
          </svg>
        </button>
        <Link href={`/${culture}/literature/edit`} title="Edit Page">
          <svg
            viewBox={SVGPath.edit.viewBox}
            className="size-5 fill-current text-foreground ml-4 cursor-pointer hover:fill-primary hover:scale-105 hover:opacity-80 active:scale-95 transition"
          >
            <path d={SVGPath.edit.path} />
          </svg>
        </Link>
        <button
          onClick={() => setShowListDisplayModal(true)}
          className="px-3 py-1 bg-extra ml-2 rounded shadow cursor-pointer hover:scale-105 active:scale-90"
        >
          Lists
        </button>

        {results.length > 0 && (
          <div className="absolute top-[100%] mt-1 left-0 w-full md:w-1/3 bg-background/20 backdrop-blur-xl rounded shadow-lg max-h-[300px] overflow-y-auto z-10">
            {results.map((book) => (
              <Link
                key={book.id}
                href={`/${culture}/literature/${book.id}`}
                className="flex items-center gap-3 px-4 py-2 hover:bg-extra transition"
              >
                <img
                  src={book.cover}
                  alt={book.title}
                  className="w-10 h-14 object-cover rounded"
                />
                <div className="text-left">
                  <p className="font-medium">{book.title}</p>
                  {book.creator_string && (
                    <p className="text-sm text-neutral-400">
                      {book.creator_string}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="w-full h-fit">
        <div className="w-full flex flex-col-reverse md:flex-row md:space-x-2">
          <div className="flex flex-col w-full md:w-3/4 mt-4">
            <h1 className="font-lora text-lg md:text-2xl font-bold text-main">
              Overview
            </h1>
            {pageContent?.overview_text ? (
              <div className="relative">
                <div
                  className={`text-sm/[1.75] sm:text-base/[1.75] leading-relaxed font-medium transition-all duration-300 ${
                    showFullDesc
                      ? "max-h-none"
                      : "max-h-52 md:max-h-52 overflow-hidden"
                  }`}
                >
                  <ReactMarkdown>{pageContent.overview_text}</ReactMarkdown>
                </div>
                {!showFullDesc &&
                  pageContent.overview_text &&
                  pageContent.overview_text.length > 300 && (
                    <div className="absolute bottom-7 left-0 w-full h-10 sm:h-12 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none" />
                  )}
                {pageContent.overview_text &&
                  pageContent.overview_text.length > 300 && (
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
                {`There's currently no overview saved for this culture's book history or style.\n
                Please edit the page to add your own personal summary of your favorite books, authors, and general thoughts along your literary journey!`}
              </p>
            )}
          </div>
          <div className="w-full max-h-[300px] md:w-1/4 mt-4 md:mt-0">
            <RandomBookDisplay />
          </div>
        </div>

        <BookPeriodGrid periods={periods} culture={String(culture)} />
      </section>

      {/* Fallback / Featured sections */}
      {fallback && (
        <section className="mt-10 text-center">
          <h2 className="text-lg font-semibold mb-2">
            Start building your book collection!
          </h2>
          <p className="text-neutral-500 mb-4">
            You haven’t added any books yet. Here are some to explore:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {fallback.map((book: Book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      )}

      {!fallback &&
        (recent?.length || readlist?.length || favourites?.length) && (
          <div>
            {recent?.length ? (
              <section className="mt-6">
                <h2 className="font-lora text-xl md:text-2xl font-bold text-main mb-2">
                  Recently Read
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {recent.map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              </section>
            ) : null}

            {readlist?.length ? (
              <section className="mt-6">
                <h2 className="font-lora text-xl md:text-2xl font-bold text-main mb-2">
                  Your Reading List
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {readlist.map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              </section>
            ) : null}

            {favourites?.length ? (
              <section className="mt-6">
                <h2 className="font-lora text-xl md:text-2xl font-bold text-main mb-2">
                  Your Favourites
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {favourites.map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}

      <BookImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImported={() => {
          fetchData(); // refreshes books on import
          setShowImportModal(false);
        }}
      />

      <BookListDisplayModal
        isOpen={showListDisplayModal}
        onClose={() => setShowListDisplayModal(false)}
        onEditList={handleEditList}
        currentCultureCode={culture}
      />

      <BookListCreationModal
        isOpen={showListCreationModal}
        onClose={() => {
          setShowListCreationModal(false);
          setShowListDisplayModal(true);
          setEditingList(null);
        }}
        onCreated={handleListCreated}
        initialList={editingList || undefined}
        currentCultureCode={culture}
      />
    </div>
  );
}
