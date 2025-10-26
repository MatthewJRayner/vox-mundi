"use client";

import React, { useState } from "react";
import api from "@/lib/api";
import { Book, UserBook } from "@/types/media/book";
import BookCard from "./BookCard";
import { SVGPath } from "@/utils/path";

export default function RandomBookDisplay() {
  const [book, setBook] = useState<Book | null>(null);
  const [userBook, setUserBook] = useState<UserBook | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRandomBook = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/books/random/");
      setBook(res.data.book);
      setUserBook(res.data.userbook);
    } catch (err) {
      console.error("Error fetching random book:", err);
      setError("Couldn't fetch a random book.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col items-center text-center">
      <div className="flex items-center space-x-2">
        <h2 className="font-lora text-lg md:text-2xl font-bold=">Discover a Random Book</h2>
        <button onClick={fetchRandomBook}>
          <svg
            viewBox={SVGPath.refresh.viewBox}
            className="size-4 md:size-5 fill-current transition hover:scale-105 active:scale-95 cursor-pointer hover:fill-primary"
          >
            <path d={SVGPath.refresh.path} />
          </svg>
        </button>
      </div>
      {!book && !loading && (
        <p className="text-foreground/50 mb-4 text-xs md:text-base">
          Click to explore a random book from the database!
        </p>
      )}

      {error && <p className="text-red-500">{error}</p>}

      {book && (
        <div className="mt-4 h-fit max-w-[150px] md:max-w-[275px] shadow-lg hover:shadow-2xl">
          <BookCard book={book} />
        </div>
      )}
    </section>
  );
}
