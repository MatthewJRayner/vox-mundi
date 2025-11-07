/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";

import api from "@/lib/api";
import { SVGPath } from "@/utils/path";

export interface ConcertEvent {
  composer: string;
  title: string;
  description: string;
  link: string;
  date: string | null;
  image?: string | null;
  venue?: string | null;
  address?: { locality?: string; street?: string };
  source: string;
}

type ConcertEventCardProps = {
  event: ConcertEvent;
};

export default function ConcertEventCard({ event }: ConcertEventCardProps) {
  const handleAddCalendar = async () => {
    const payload = {
      type: "Concert",
      calendar_date: event.date?.substring(0, 10),
      holiday_name: `${event.composer} - ${event.title}`,
      meaning: event.description,
    };

    const url = `/calendar-dates/`;

    await api.post(url, payload);
  };
  return (
    <div className="bg-extra rounded-lg p-4 shadow-md hover:shadow-lg transition hover:bg-extra/80">
      <div className="flex flex-col md:flex-row gap-3">
        {event.image && (
          <img
            src={event.image}
            alt={event.title}
            className="w-full md:w-40 h-28 object-cover rounded-md"
          />
        )}

        <div className="flex-1 font-inter">
          <p className="font-semibold font-garamond text-sm text-main mb-1">
            <span className="text-lg ml-1">{event.composer}</span>
          </p>

          <h3 className="font-bold text-lg md:text-xl">{event.title}</h3>

          <p className="text-sm text-muted-foreground mb-1">
            {event.venue}
            {event.address?.locality && ` — ${event.address.locality}`}
          </p>

          {event.date && (
            <p className="text-xs text-foreground/50">
              {new Date(event.date).toLocaleString(undefined, {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}

          {event.description && (
            <p className="text-xs text-foreground/50 mt-2 line-clamp-3">
              {event.description}
            </p>
          )}

          <div className="flex justify-between items-center mt-2">
            <a
              href={event.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs md:text-base text-primary hover:opacity-80 flex items-center"
            >
              View Event{" "}
              <span>
                <svg
                  viewBox={SVGPath.arrow.viewBox}
                  className="size-4 fill-primary text-foreground cursor-pointer active:scale-95 transition mr-1 transform rotate-180 ml-1"
                >
                  <path d={SVGPath.arrow.path} />
                </svg>
              </span>
            </a>
            <button
              onClick={handleAddCalendar}
              className="text-xs md:text-base cursor-pointer flex items-center hover:opacity-80"
            >
              <span>
                <svg
                  viewBox={SVGPath.calendar.viewBox}
                  className="size-5 fill-current text-foreground cursor-pointer active:scale-95 transition mr-1"
                >
                  <path d={SVGPath.calendar.path} />
                </svg>
              </span>
              Add to Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
