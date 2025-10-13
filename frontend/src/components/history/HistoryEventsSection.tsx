"use client";
import { useState } from "react";
import { UserHistoryEvent } from "@/types/history";
import { SVGPath } from "@/utils/path";
import { formatDateEstimate } from "@/utils/formatters/formatDateEstimate";
import Link from "next/link";

interface UserEventsSectionProps {
  groupedEvents: Record<string, UserHistoryEvent[]>;
  culture: string;
}

export default function HistoryEventsSection({
  groupedEvents,
  culture,
}: UserEventsSectionProps) {
  const [isOpen, setIsOpen] = useState<string | null>(null);

  return (
    <section className="flex flex-col space-y-3">
      <h3 className="text-lg font-semibold text-main">Your Events</h3>
      {Object.entries(groupedEvents).map(([periodName, events]) => (
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
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex justify-between items-center bg-background p-3 rounded shadow"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold">{event.title}</span>
                      {event.alt_title && (
                        <span className="text-sm opacity-70">
                          {event.alt_title}
                        </span>
                      )}
                      <span className="text-sm opacity-60">
                        {formatDateEstimate(event.date)}
                      </span>
                    </div>
                    <Link href={`/${culture}/history/edit/${event.id}`}>
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
