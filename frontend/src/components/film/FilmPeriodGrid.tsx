"use client";

import { Period } from "@/types/culture";
import Link from "next/link";

export default function FilmPeriodGrid({ periods, culture }: { periods: Period[]; culture: string }) {
  if (!periods?.length) return null;

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold mb-4 text-center md:text-left">Film Periods</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {periods.map((period) => (
          <Link
            key={period.id}
            href={`/${culture}/film/period/${period.id}`}
            className="group relative bg-extra p-4 rounded-lg shadow hover:bg-neutral-mid transition-all hover:scale-105"
          >
            <h3 className="font-semibold text-lg mb-2">{period.title}</h3>
            {period.desc && (
              <p className="text-xs text-neutral-400 line-clamp-3">{period.desc}</p>
            )}
            <div className="absolute bottom-2 right-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity text-sm">
              View →
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}