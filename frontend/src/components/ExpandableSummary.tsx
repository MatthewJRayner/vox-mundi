"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { SVGPath } from "@/utils/path";

interface ExpandableSummaryProps {
  text: string;
  maxHeight?: string;    // Tailwind class, e.g. "max-h-52"
  blurBottom?: string;   // Tailwind class, e.g. "bottom-5"
  extraBackground?: boolean;
}

const ExpandableSummary: React.FC<ExpandableSummaryProps> = ({
  text,
  maxHeight = "max-h-52",   // default height
  blurBottom = "bottom-5",  // default blur bottom distance
  extraBackground = false,
}) => {
  const [showFull, setShowFull] = useState(false);
  const isLong = text?.length > 300;
  const backgroundColor = extraBackground ? "extra" : "background"

  return (
    <div className="mb-8 relative">
      <div
        className={`text-sm/[1.75] sm:text-base/[1.75] leading-relaxed font-inter font-medium transition-all duration-300 ${
          showFull ? "max-h-none" : `${maxHeight} overflow-hidden`
        }`}
      >
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>

      {!showFull && isLong && (
        <div
          className={`absolute ${blurBottom} left-0 w-full h-10 sm:h-12 bg-gradient-to-t from-${backgroundColor} via-${backgroundColor}/90 to-transparent pointer-events-none`}
        />
      )}

      {isLong && (
        <button
          onClick={() => setShowFull(!showFull)}
          className="mt-1 cursor-pointer z-10 flex items-center font-lora sm:text-base"
        >
          <span className="mr-1 font-bold transition hover:text-main">
            {showFull ? "Show Less" : "Show More"}
          </span>
          <span
            className={`transition-transform duration-300 ${
              showFull ? "rotate-180" : "rotate-0"
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
  );
};

export default ExpandableSummary;
