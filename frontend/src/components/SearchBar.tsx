"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SVGPath } from "@/utils/path";

interface SearchBarProps {
  onSearch: (query: string) => void;
  className?: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function SearchBar({
  onSearch,
  className = "",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const prevQueryRef = useRef<string>(""); // Track previous query

  // Memoize onSearch to prevent unnecessary effect triggers
  const memoizedOnSearch = useCallback(
    (query: string) => {
      console.log("Search triggered with query:", query); // Debugging
      onSearch(query);
    },
    [onSearch]
  );

  useEffect(() => {
    if (
      debouncedQuery.trim() &&
      debouncedQuery.trim() !== prevQueryRef.current
    ) {
      console.log("useEffect triggered with debouncedQuery:", debouncedQuery);
      memoizedOnSearch(debouncedQuery.trim());
      prevQueryRef.current = debouncedQuery.trim();
    } else if (!debouncedQuery.trim() && prevQueryRef.current !== "") {
      console.log("useEffect triggered to reset search");
      memoizedOnSearch("");
      prevQueryRef.current = "";
    }
  }, [debouncedQuery, memoizedOnSearch]);

  const handleImmediateSearch = useCallback(() => {
    if (query.trim()) {
      memoizedOnSearch(query.trim());
      prevQueryRef.current = query.trim();
    } else {
      memoizedOnSearch("");
      prevQueryRef.current = "";
    }
  }, [query, memoizedOnSearch]);

  return (
    <div
      className={`flex items-center space-x-2 sm:space-x-4 ${className} w-full md:w-1/4`}
    >
      <input
        type="text"
        value={query}
        placeholder="Search..."
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleImmediateSearch()}
        className="flex-1 font-lora p-2 text-foreground text-lg bg-extra shadow-md rounded-lg focus:outline-none focus:ring-1 focus:ring-foreground w-full"
      />
      <button
        onClick={handleImmediateSearch}
        className="cursor-pointer hover:scale-105 hover:opacity-80 active:scale-95 transition-transform"
        aria-label="Search"
        title="Search"
      >
        <svg
          viewBox={SVGPath.search.viewBox}
          className="size-4 md:size-5 fill-current text-foreground"
        >
          <path d={SVGPath.search.path} />
        </svg>
      </button>
    </div>
  );
}
