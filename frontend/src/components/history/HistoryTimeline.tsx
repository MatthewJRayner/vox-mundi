"use client";

import { UserHistoryEvent } from "@/types/history";
import { useMemo } from "react";

interface TimelineProps {
  events: UserHistoryEvent[];
  onEventClick: (event: UserHistoryEvent) => void;
  onEventHover: (event: UserHistoryEvent | null) => void;
}

export default function HistoryTimeline({
  events,
  onEventClick,
  onEventHover,
}: TimelineProps) {
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const aDate = a.date?.date_known
        ? new Date(a.date.date || "").getTime()
        : a.date?.date_estimate_start
        ? new Date(a.date.date_estimate_start).getTime()
        : Infinity;

      const bDate = b.date?.date_known
        ? new Date(b.date.date || "").getTime()
        : b.date?.date_estimate_start
        ? new Date(b.date.date_estimate_start).getTime()
        : Infinity;

      return aDate - bDate;
    });
  }, [events]);

  return (
    <div className="flex flex-col w-full mt-12">
      <div className="flex flex-coll w-full items-center justify-between relative h-[100px]">
        <div className="h-full left-0 w-1 bg-foreground absolute" />
        <div className="h-full right-0 w-1 bg-foreground absolute" />
        <div className="w-full h-1 bg-foreground" />
        {sortedEvents.map((event, idx) => {
          const leftPercent = ((idx + 1) / (sortedEvents.length + 1)) * 100;
          return (
            <button
              key={event.id}
              style={{ left: `${leftPercent}%` }}
              className={`${
                idx % 2 === 0 ? "top-1/2" : "bottom-1/2"
              } absolute items-center cursor-pointer transition transform hover:scale-110 w-1 bg-foreground h-1/4`}
              onClick={() => onEventClick(event)}
              onMouseEnter={() => onEventHover(event)}
              onMouseLeave={() => onEventHover(null)}
            />
          );
        })}
      </div>
    </div>
  );
}
