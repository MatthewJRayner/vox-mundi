"use client";

import { UserHistoryEvent } from "@/types/history";
import { useMemo, useState, useEffect } from "react";

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

  const [smallScreen, setSmallScreen] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      setSmallScreen(window.innerWidth < 768);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [])

  return (
    <div className="flex flex-col w-full mt-12">
      <div className="flex flex-col w-full items-center justify-center relative h-[300px] md:h-[100px]">
        <div className="w-1/4 top-0 h-[2px] md:h-full md:left-0 md:w-[2px] bg-foreground absolute" />
        <div className="w-1/4 bottom-0 h-[2px] md:h-full md:right-0 md:w-[2px] bg-foreground absolute" />
        <div className="h-full w-[2px] md:w-full md:h-[2px] bg-foreground" />
        {sortedEvents.map((event, idx) => {
          const positionPercent = ((idx + 1) / (sortedEvents.length + 1)) * 100;
          const positionStyle = smallScreen
            ? { top: `${positionPercent}%` }
            : { left: `${positionPercent}%` }
          return (
            <button
              key={event.id}
              style={positionStyle}
              className={`${
                idx % 2 === 0 ? smallScreen ? "left-1/2" : "top-1/2" : smallScreen ? "right-1/2" : "bottom-1/2"
              } absolute items-center cursor-pointer transition transform hover:scale-110 w-[24px] md:w-1 bg-foreground h-[2px] md:h-1/4`}
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
