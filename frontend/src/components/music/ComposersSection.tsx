"use client";
import { useState } from "react";
import { UserMusicComposer } from "@/types/media/music";
import { SVGPath } from "@/utils/path";
import { formatDateEstimate } from "@/utils/formatters/formatDateEstimate";
import Link from "next/link";

interface ComposersProps {
  groupedComposers: Record<string, UserMusicComposer[]>;
  culture: string;
}

export default function ComposersSection({
  groupedComposers,
  culture,
}: ComposersProps) {
  const [isOpen, setIsOpen] = useState<string | null>(null);

  const formatLifespan = (birth_year?: number, death_year?: number) => {
    if (!birth_year) return "Unknown dates";
    return death_year ? `${birth_year} - ${death_year}` : `${birth_year} - ?`;
  };

  return (
    <section className="flex flex-col space-y-3">
      <div className="flex w-full justify-between items-center">
        <h3 className="text-lg font-semibold text-main">Your Composers</h3>
        <Link href={`/${culture}/music/new`}>
          <svg
            viewBox={SVGPath.add.viewBox}
            className="size-5 fill-current transition hover:text-foreground/80 active:scale-95 cursor-pointer"
          >
            <path d={SVGPath.add.path} />
          </svg>
        </Link>
      </div>
      {Object.entries(groupedComposers).map(([periodName, composers]) => (
        <div key={periodName} className="bg-extra rounded shadow">
          <button
            onClick={() => setIsOpen(isOpen === periodName ? null : periodName)}
            className="w-full flex justify-between items-center p-3 font-semibold hover:bg-extra/50 cursor-pointer"
          >
            <span>{periodName}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox={SVGPath.chevron.viewBox}
              fill="currentColor"
              className={`size-6 transition-transform duration-300 ${
                isOpen === periodName ? "rotate-180" : ""
              }`}
            >
              <path
                fillRule="evenodd"
                d={SVGPath.chevron.path}
                clipRule="evenodd"
              />
            </svg>
          </button>

          <div
            className={`transition-all duration-500 ease-in-out ${
              isOpen === periodName
                ? "max-h-[1000px] opacity-100"
                : "max-h-0 opacity-0"
            } overflow-hidden`}
          >
            {isOpen === periodName && (
              <div className="space-y-2 p-3 border-t border-foreground/20 transition-all duration-500">
                {composers.map((composer) => (
                  <div
                    key={composer.id}
                    className="flex justify-between items-center bg-background p-3 rounded shadow"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold">{composer.name}</span>
                      {composer.alt_name && (
                        <span className="text-sm opacity-70">
                          {composer.alt_name}
                        </span>
                      )}
                      <span className="text-sm opacity-60">
                        {formatLifespan(composer.birth_year, composer?.death_year)}
                      </span>
                    </div>
                    <Link href={`/${culture}/music/edit/${composer.id}`}>
                      <svg
                        viewBox={SVGPath.edit.viewBox}
                        className="size-5 fill-current transition hover:text-foreground/80 active:scale-95 cursor-pointer"
                      >
                        <path d={SVGPath.edit.path} />
                      </svg>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
