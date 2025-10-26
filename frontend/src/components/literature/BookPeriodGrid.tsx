"use client";

import { Period } from "@/types/culture";
import Link from "next/link";
import { SVGPath } from "@/utils/path";

export default function BookPeriodGrid({
  periods,
  culture,
}: {
  periods: Period[];
  culture: string;
}) {
  if (!periods?.length) return null;

  return (
    <section className="mt-8">
      <h2 className="text-lg md:text-2xl font-semibold text-main font-garamond mb-4 text-center md:text-left">
        Literary Periods
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {periods.map((period) => (
          <Link
            key={period.id}
            href={`/${culture}/literature/period/${period.id}`}
            className="group relative bg-extra p-4 rounded-lg shadow hover:bg-neutral-mid transition-all hover:scale-105 flex flex-col justify-center"
          >
            <h3 className="font-semibold text-sm md:text-base mb-2">
              {period.title}
            </h3>
            {period.desc && (
              <p className="text-xs text-neutral-400 line-clamp-3">{`${period.start_year} - ${period.end_year}`}</p>
            )}
            <div className="absolute bottom-2 right-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity text-sm flex items-center">
              View{" "}
              <span>
                <svg
                  viewBox={SVGPath.arrow.viewBox}
                  className="ml-1 size-3 fill-current transition hover:scale-105 active:scale-95 transform rotate-180"
                >
                  <path d={SVGPath.arrow.path} />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
