"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";

import { SVGPath } from "@/utils/path";

interface ExpandableSummaryProps {
  text: string;
  maxHeight?: string;
  blurBottom?: string;
  extraBackground?: boolean;
}

/**
 * Truncates long text with a "Show More/Less" toggle and gradient fade.
 *
 * Ideal for summaries, descriptions, or any content that should be collapsible.
 * Uses `ReactMarkdown` for rich text support.
 *
 * @param text - Markdown-formatted text to display
 * @param maxHeight - Tailwind class for collapsed height (default: `"max-h-52"`)
 * @param blurBottom - Tailwind class for gradient position (default: `"bottom-5"`)
 * @param extraBackground - Use the `extra` color variable for gradient instead of the background (default: `false`)
 *
 * @example
 * <ExpandableSummary
 *  text={longDescription}
 *  maxHeight="max-h-64"
 *  blurBottom="bottom-6"
 * />
 */

const ExpandableSummary: React.FC<ExpandableSummaryProps> = ({
  text,
  maxHeight = "max-h-52",
  blurBottom = "bottom-5",
  extraBackground = false,
}) => {
  const [showFull, setShowFull] = useState(false);
  const isLong = text?.length > 300;
  const backgroundColor = extraBackground ? "extra" : "background";

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
