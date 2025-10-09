"use client";

import { useState } from "react";
import { SVGPath } from "@/utils/path";
import { SVG } from "leaflet";

interface SearchBarProps {
  onSearch: (query: string) => void;
  className?: string;
}

export default function SearchBar({ onSearch, className = "" }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    if (!query.trim()) return;
    onSearch(query.trim());
  };

  return (
    <div className={`flex items-center space-x-2 sm:space-x-4 ${className}`}>
      <input
        type="text"
        value={query}
        placeholder="Search..."
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        className="flex-1 font-lora p-2 text-foreground text-lg bg-extra shadow-md rounded-lg border border-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
      />
      <button
        onClick={handleSearch}
        className="cursor-pointer hover:scale-110 hover:opacity-80 active:scale-95 transition-transform"
        aria-label="Search"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox={SVGPath.search.viewBox}
          fill="currentColor"
          className="w-4 h-4"
        >
          <path
            fillRule="evenodd"
            d={SVGPath.search.path}
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
