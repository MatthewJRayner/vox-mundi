"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios, { AxiosError } from "axios";
import api from "@/lib/api";
import { useParams } from "next/navigation";
import { Book, UserBook } from "@/types/media/book";
import { Culture } from "@/types/culture";
import StarRating from "@/components/StarRating";
import ReviewModal from "@/components/ReviewModal";
import BookDatesModal from "@/components/literature/BookDateModal";
import BookISBNModal from "@/components/literature/BookISBNModal";
import Link from "next/link";
import { formatDateEstimate } from "@/utils/formatters/formatDateEstimate";
import { formatPhrase } from "@/utils/formatters/formatPhrase";
import UserBookAssignmentModal from "@/components/literature/UserBookAssignmentForm";
import ReactMarkdown from "react-markdown";
import { SVGPath } from "@/utils/path";
import { getLanguageName } from "@/utils/iso";

export default function BookDetailPage() {
  const { culture, id } = useParams();
  const [currentCulture, setCurrentCulture] = useState<Culture | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [userBook, setUserBook] = useState<UserBook | null>(null);
  const [showDatesModal, setShowDatesModal] = useState(false);
  const [showISBNModal, setShowISBNModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [rating, setRating] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);
  const [showFullReview, setShowFullReview] = useState(false);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const MAX_GENRES = 5;

  const fetchBook = useCallback(async () => {
    if (!id) return;

    try {
      const [bookRes, cultureRes] = await Promise.all([
        api.get(`/books/${id}`),
        api.get(`cultures/?code=${culture}`),
      ]);

      setBook(bookRes.data);
      setCurrentCulture(cultureRes.data[0]);

      try {
        const userBookRes = await api.get(`/user-books/by-book/${id}`);

        if (userBookRes.data && !userBookRes.data.detail) {
          setUserBook(userBookRes.data);
          setRating(userBookRes.data.rating || 0);
        } else {
          setUserBook(null);
          setRating(0);
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 404) {
            console.info(
              "No userBook entry yet for this book — creating fresh state."
            );
            setUserBook(null);
            setRating(0);
          } else {
            console.error(
              "Error fetching userBook:",
              err.response?.data || err.message
            );
          }
        } else {
          console.error("Unexpected error fetching userBook:", err);
        }
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error(
          "Error fetching book or culture:",
          err.response?.data || err.message
        );
      } else {
        console.error("Unexpected error fetching book or culture:", err);
      }
    }
  }, [id, culture]);

  const ensureUserBook = async () => {
    if (userBook) return userBook;

    try {
      const res = await api.get(`/user-books/by-book/${id}`);
      if (res.data && !res.data.detail) {
        setUserBook(res.data);
        return res.data;
      }
    } catch (err: unknown) {
      console.warn("Error", err);
    }

    if (!book?.universal_item?.id) {
      console.error("Cannot create UserBook — missing universal_item id.");
      return null;
    }

    try {
      const createRes = await api.post(`/user-books/`, {
        universal_item_id: book.universal_item.id,
        culture_ids: [currentCulture?.id],
      });
      setUserBook(createRes.data);
      return createRes.data;
    } catch (err) {
      console.error("Error creating userBook:", err);
      return null;
    }
  };

  useEffect(() => {
    fetchBook();
  }, [fetchBook]);

  const updateReview = async (newReview: string) => {
    if (!userBook?.id) return;

    const ub = await ensureUserBook();

    const res = await api.patch(`/user-books/${ub.id}/`, {
      notes: newReview,
    });

    setUserBook(res.data);
  };

  const updateRating = async (newValue: number) => {
    if (!userBook?.id) return;

    setRating(newValue);

    const ub = await ensureUserBook();

    const res = await api.patch(`/user-books/${ub.id}/`, {
      rating: newValue,
    });

    setUserBook(res.data);
  };

  const toggleRead = async () => {
    if (!userBook?.id) return;

    const ub = await ensureUserBook();

    const res = await api.patch(`/user-books/${ub.id}/`, {
      read: !ub.read,
    });

    setUserBook(res.data);
  };

  const toggleReadlist = async () => {
    if (!userBook?.id) return;

    const ub = await ensureUserBook();

    const res = await api.patch(`/user-books/${ub.id}/`, {
      readlist: !ub.readlist,
    });

    setUserBook(res.data);
  };

  const toggleFavourite = async () => {
    if (!userBook?.id) return;
    const uf = await ensureUserBook();

    const res = await api.patch(`/user-books/${uf.id}/`, {
      favourite: !uf.favourite,
    });

    setUserBook(res.data);
  };

  const handleOpenISBNModal = async () => {
    const ensured = await ensureUserBook();
    if (ensured?.id) {
      setUserBook(ensured);
      setShowISBNModal(true);
    } else {
      alert("Could not create or find your user book entry.");
    }
  };

  if (!book) return <p className="text-center text-lg">Loading...</p>;

  return (
    <div className="min-h-screen flex flex-col w-full px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row w-full max-w-7xl items-start justify-center mx-auto gap-6 py-6">
        <div className="w-full md:w-1/3 lg:w-1/4 md:space-y-4 flex md:flex-col items-center">
          {(userBook?.cover || book.cover) && (
            <div className="cursor-pointer w-full">
              <img
                src={userBook?.cover || book.cover}
                alt={`${book.title || "Film"}`}
                className="rounded-tr-lg rounded-br-lg rounded-l-xs shadow-lg active:scale-95 cursor-pointer transition max-w-[40vw] md:max-w-full h-auto"
              />
            </div>
          )}
          <div className="w-full flex flex-col items-center ml-2 md:ml-0 justify-center text-center space-y-4 md:space-y-2">
            <button
              onClick={toggleFavourite}
              className={`font-bold flex space-x-2 rounded-lg items-center justify-center py-2 w-full border-2 ${
                userBook?.favourite
                  ? "bg-red-400 border-red-500 shadow-lg"
                  : "border-neutral-mid"
              } cursor-pointer transition-all duration-300 hover:bg-red-500/20 hover:scale-105 active:scale-95`}
            >
              <span
                className={`flex ${
                  userBook?.favourite ? "text-red-500" : "text-neutral-mid"
                }`}
              >
                <svg
                  viewBox={SVGPath.heart.viewBox}
                  className={`mr-1 size-6 transition hover:scale-105 active:scale-95 hover:fill-blue-300 ${
                    userBook?.favourite ? "fill-red-600" : "fill-current"
                  }`}
                >
                  <path d={SVGPath.heart.path} />
                </svg>{" "}
                Favourite
              </span>
            </button>
            <button
              onClick={toggleRead}
              aria-label="Toggle Seen"
              className={`font-bold flex space-x-2 rounded-lg items-center justify-center py-2 w-full border-2 ${
                userBook?.read
                  ? "bg-green-300 border-green-400 shadow-lg"
                  : "border-neutral-mid"
              } cursor-pointer transition-all duration-300 hover:bg-green-500/20 hover:scale-105 active:scale-95`}
            >
              <span
                className={`flex ${
                  userBook?.read ? "text-green-400" : "text-neutral-mid"
                }`}
              >
                <svg
                  viewBox={SVGPath.book.viewBox}
                  className={`mr-1 size-6 transition hover:scale-105 active:scale-95 hover:fill-blue-300 ${
                    userBook?.readlist ? "fill-green-500" : "fill-current"
                  }`}
                >
                  <path d={SVGPath.book.path} />
                </svg>{" "}
                {userBook?.read ? "Read" : "Not Read"}
              </span>
            </button>
            <button
              onClick={toggleReadlist}
              aria-label="Toggle Readlist"
              className={`font-bold flex space-x-1 rounded-lg items-center justify-center py-2 w-full border-2 ${
                userBook?.readlist
                  ? "bg-primary/10 border-primary shadow-lg"
                  : "border-neutral-mid"
              } cursor-pointer transition-all duration-300 hover:bg-primary/20 hover:scale-105 active:scale-95`}
            >
              <svg
                viewBox={SVGPath.clock.viewBox}
                className={`size-6 transition hover:scale-105 active:scale-95 hover:fill-blue-300 ${
                  userBook?.readlist ? "fill-primary" : "fill-current"
                }`}
              >
                <path d={SVGPath.clock.path} />
              </svg>
              <span
                className={`text-sm ${
                  userBook?.readlist ? "text-primary" : "text-neutral-mid"
                }`}
              >
                Reading List
              </span>
            </button>

            <button
              onClick={handleOpenISBNModal}
              aria-label="Toggle Readlist"
              className={`font-bold flex space-x-1 rounded-lg items-center justify-center py-2 w-full border-2 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95`}
            >
              <svg
                viewBox={SVGPath.add.viewBox}
                className={`size-6 transition hover:scale-105 active:scale-95 fill-foreground`}
              >
                <path d={SVGPath.add.path} />
              </svg>
              <span className={`text-sm`}>Add ISBN Info</span>
            </button>

            <button
              onClick={() => setShowAssignmentModal(true)}
              aria-label="Toggle Readlist"
              className={`font-bold flex space-x-1 rounded-lg items-center justify-center py-2 w-full border-2 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95`}
            >
              <svg
                viewBox={SVGPath.add.viewBox}
                className={`size-6 transition hover:scale-105 active:scale-95 fill-foreground`}
              >
                <path d={SVGPath.add.path} />
              </svg>
              <span className={`text-sm`}>Assign to Period</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col w-full lg:w-3/4">
          <div>
            {book.series && (
              <span className="text-foreground/50 text-base sm:text-lg italic">
                {book.series}
                {book.volume ? ` (#${book.volume})` : ""}
              </span>
            )}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-garamond flex items-center flex-wrap">
              {book.title ?? ""}
              {book.alt_title ? (
                <span className="text-sm sm:text-base text-foreground/50 sm:ml-4 font-normal mb-2 sm:mb-0">
                  {book.alt_title}
                </span>
              ) : (
                ""
              )}
            </h1>

            <Link
              href={`/${culture}/literature/search/author/${encodeURIComponent(
                book.creator_string
              )}`}
              className="flex w-fit items-center space-x-2 sm:space-x-4 transition-all duration-300 hover:text-primary"
            >
              {book.creator_string && (
                <p className="font-light text-xl sm:text-2xl italic">
                  {book.creator_string}
                  {book.alt_creator_name ? (
                    <span className="text-sm text-foreground/50 ml-2">
                      {book.alt_creator_name}
                    </span>
                  ) : (
                    ""
                  )}
                </p>
              )}
            </Link>
            <div className="flex my-2 items-center space-x-2">
              <StarRating value={rating || 0} onChange={updateRating} />
              <p className="text-2xl sm:text-3xl font-bold">
                {Number(rating).toFixed(0)}
              </p>
            </div>
          </div>
          <div className="flex flex-col w-full mt-2 space-y-4">
            {book.synopsis && (
              <div className="mb-8 relative">
                <div
                  className={`text-sm sm:text-md leading-relaxed font-serif font-medium transition-all duration-300 ${
                    showFullSynopsis
                      ? "max-h-none"
                      : "max-h-24 sm:max-h-32 overflow-hidden"
                  }`}
                >
                  <ReactMarkdown>{book.synopsis}</ReactMarkdown>
                </div>
                {!showFullSynopsis && book.synopsis.length > 300 && (
                  <div className="absolute bottom-5 left-0 w-full h-10 sm:h-12 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
                )}
                {book.synopsis.length > 300 && (
                  <button
                    onClick={() => setShowFullSynopsis(!showFullSynopsis)}
                    className="mt-1 cursor-pointer z-10 flex items-center text-sm sm:text-base"
                  >
                    <span className="mr-1 font-bold transition hover:text-primary">
                      {showFullSynopsis ? "Show Less" : "Show More"}
                    </span>
                    <span
                      className={`transition-transform duration-300 ${
                        showFullSynopsis ? "rotate-180" : "rotate-0"
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
            )}

            <div className="flex items-center mb-4 flex-wrap gap-x-2 gap-y-2">
              <span className="text-sm text-foreground/50">Genres</span>
              {(showAllGenres
                ? book.genre
                : book.genre?.slice(0, MAX_GENRES)
              )?.map((g, i) => (
                <Link
                  href={`/${culture}/literature/search/genre/${encodeURIComponent(g)}`}
                  key={i}
                  className="border-b-green-500 border-b-2 px-1 text-sm font-bold cursor-pointer hover:border-b-green-800 transition-all duration-300"
                >
                  {g}
                </Link>
              ))}
              {book.genre && book.genre.length > MAX_GENRES && (
                <button
                  onClick={() => setShowAllGenres(!showAllGenres)}
                  className="border-b-green-500 border-b-2 px-1 text-sm font-bold cursor-pointer hover:text-primary transition-all duration-300"
                >
                  {showAllGenres ? "Show Less" : "...more"}
                </button>
              )}
            </div>
            <p className="text-sm text-foreground/50 mb-2">
              {userBook?.page_count ? `${userBook?.page_count} pages` : ""}
              {userBook?.format
                ? `${
                    userBook?.page_count
                      ? `, ${formatPhrase(userBook?.format)}`
                      : `${formatPhrase(userBook?.format)}`
                  }`
                : ""}
            </p>
            {book.date && (
              <p className="text-sm text-foreground/50 mb-2">
                {`First published ${
                  book.date ? `${formatDateEstimate(book.date)}` : ``
                }`}
              </p>
            )}

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="mt-2 cursor-pointer text-sm sm:text-base z-10 flex items-center mb-2"
            >
              <span className="mr-1 font-bold transition hover:text-primary">
                {showDetails ? "Less details" : "Book details"}
              </span>
              <span
                className={`transition-transform duration-300 ${
                  showDetails ? "rotate-180" : "rotate-0"
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
            {showDetails && (
              <div className="text-left w-full space-y-2 text-sm text-neutral-mid pl-2">
                {book.alt_title && (
                  <p>
                    <span className="text-xs text-foreground/50 font-source mr-2">
                      Original Title
                    </span>{" "}
                    {book.alt_title}
                  </p>
                )}
                {book.tags && book.tags?.length > 1 && (
                  <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                    <span>
                      <span className="text-xs text-foreground/50 mr-2 font-source">
                        Tags
                      </span>{" "}
                    </span>
                    {book.tags?.map((g, i) => (
                      <div
                        className="bg-neutral p-1 rounded-md text-sm"
                        key={i}
                      >
                        {g}
                      </div>
                    ))}
                  </div>
                )}
                {book.series && (
                  <p>
                    <span className="text-xs text-foreground/50 mr-2 font-source">
                      Series
                    </span>{" "}
                    {book.series}
                  </p>
                )}
                {book.volume && (
                  <p>
                    <span className="text-xs text-foreground/50 mr-2 font-source">
                      Entry #
                    </span>{" "}
                    {book.volume}
                  </p>
                )}
                {userBook?.rating && (
                  <p>
                    <span className="text-xs text-foreground/50 mr-2 font-source">
                      Rating
                    </span>{" "}
                    {userBook?.rating}/10
                  </p>
                )}
                {userBook?.read_language && (
                  <p>
                    <span className="text-xs text-foreground/50 mr-2 font-source">
                      Original Language
                    </span>{" "}
                    <span className="transition-all duration-300 hover:text-primary">
                      {userBook?.read_language}
                    </span>
                  </p>
                )}

                <p className="pt-4 text-foreground">
                  <span className="text-sm font-bold">My Edition</span>
                </p>
                {userBook?.isbn && (
                  <p>
                    <span className="text-xs text-foreground/50 mr-2 font-source">
                      ISBN
                    </span>{" "}
                    {userBook?.isbn}
                  </p>
                )}
                {userBook?.publisher && (
                  <p>
                    <span className="text-xs text-foreground/50 mr-2 font-source">
                      Publisher
                    </span>{" "}
                    {userBook?.publisher}
                  </p>
                )}
                {book.languages && (
                  <p>
                    <span className="text-xs text-foreground/50 mr-2 font-source">
                      Languages:
                    </span>{" "}
                    {book.languages
                      ?.map((code) => getLanguageName(code))
                      .join(", ")}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={() => setShowDatesModal(true)}
              aria-label="Open Date Selection Modal"
              className={`md:mt-2 font-bold flex space-x-1 rounded-lg items-center justify-center py-2 w-full md:w-1/4 border-2 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95`}
            >
              <svg
                viewBox={SVGPath.calendar.viewBox}
                className={`size-6 transition hover:scale-105 active:scale-95 fill-foreground`}
              >
                <path d={SVGPath.calendar.path} />
              </svg>
              <span className={`text-sm`}>Reading Dates</span>
            </button>

            {userBook?.notes ? (
              <div className="flex flex-col justify-start py-4 relative">
                <div className="flex space-x-2 items-center">
                  <h3 className="font-semibold text-base sm:text-lg">
                    My Review
                  </h3>
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="text-base sm:text-lg cursor-pointer transition-all duration-300 hover:text-primary hover:scale-105 active:scale-95"
                  >
                    ✎
                  </button>
                </div>
                <div
                  className={`text-sm text-foreground/50 transition-all duration-300 ${
                    showFullReview
                      ? "max-h-none"
                      : "max-h-24 sm:max-h-32 overflow-hidden"
                  }`}
                >
                  <ReactMarkdown>{userBook?.notes}</ReactMarkdown>
                </div>
                {!showFullReview && userBook?.notes.length > 300 && (
                  <div className="absolute bottom-7 left-0 w-full h-10 sm:h-12 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
                )}
                {userBook?.notes.length > 300 && (
                  <button
                    onClick={() => setShowFullReview(!showFullReview)}
                    className="mt-1 text-sm sm:text-base text-primary cursor-pointer z-10 flex items-center"
                  >
                    <span className="mr-1 font-bold text-neutral-mid transition">
                      {showFullReview ? "Show Less" : "Show More"}
                    </span>
                    <span
                      className={`transition-transform duration-300 ${
                        showFullReview ? "rotate-180" : "rotate-0"
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
              <div className="py-4 px-2 text-center">
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="bg-primary text-white px-4 py-2 rounded text-sm sm:text-base hover:bg-neutral-mid hover:scale-105 transition cursor-pointer active:scale-95"
                >
                  Add Review
                </button>
              </div>
            )}

            <ReviewModal
              isOpen={showReviewModal}
              onClose={() => setShowReviewModal(false)}
              onSave={updateReview}
              initialValue={userBook?.notes || ""}
            />

            <BookDatesModal
              isOpen={showDatesModal}
              onClose={() => setShowDatesModal(false)}
              userBookId={userBook?.id}
              onSaved={fetchBook}
              initialStarted={userBook?.date_started || null}
              initialFinished={userBook?.date_finished || null}
            />

            <BookISBNModal
              isOpen={showISBNModal}
              onClose={() => setShowISBNModal(false)}
              userBookId={userBook?.id}
              onUpdated={fetchBook}
            />

            <UserBookAssignmentModal
              isOpen={showAssignmentModal}
              onClose={() => setShowAssignmentModal(false)}
              userBookId={userBook?.id || 0}
              initialData={userBook}
              currentCultureCode={currentCulture?.code}
              onSuccess={fetchBook}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
