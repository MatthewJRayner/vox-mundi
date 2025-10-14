"use client";

import { UserHistoryEvent } from "@/types/history";
import { useMemo, useState, useEffect, useRef } from "react";

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

  const [isMobile, setIsMobile] = useState(false);
  const [dragPosition, setDragPosition] = useState<number | null>(null);
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile || !timelineRef.current) return;
    e.preventDefault();
    const touchY = e.touches[0].clientY;
    const rect = timelineRef.current.getBoundingClientRect();
    if (touchY < rect.top || touchY > rect.bottom) return;
    const relativeY = touchY - rect.top;
    const percent = (relativeY / rect.height) * 100;
    setDragPosition(Math.max(0, Math.min(100, percent)));
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || !timelineRef.current) return;
    e.preventDefault();
    const touchY = e.touches[0].clientY;
    const rect = timelineRef.current.getBoundingClientRect();
    if (touchY < rect.top || touchY > rect.bottom) return;
    const relativeY = touchY - rect.top;
    const percent = (relativeY / rect.height) * 100;
    setDragPosition(Math.max(0, Math.min(100, percent)));
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile || dragPosition === null || !sortedEvents.length) return;
    e.preventDefault();
    const eventPositions = sortedEvents.map((_, idx) => 
      ((idx + 1) / (sortedEvents.length + 1)) * 100
    );
    const closestPositionIndex = eventPositions.reduce((closestIdx, pos, idx) => {
      return Math.abs(pos - dragPosition) < Math.abs(eventPositions[closestIdx] - dragPosition)
        ? idx
        : closestIdx;
    }, 0);
    const selectedEvent = sortedEvents[closestPositionIndex];
    setSelectedEventIndex(closestPositionIndex);
    setDragPosition(eventPositions[closestPositionIndex]);
    onEventClick(selectedEvent);
  };

  const circlePosition = dragPosition !== null 
    ? dragPosition 
    : selectedEventIndex !== null 
      ? ((selectedEventIndex + 1) / (sortedEvents.length + 1)) * 100 
      : 50;

  return (
    <div className="flex flex-col w-full h-full">
      <div 
        className="flex flex-col w-full items-center justify-center relative h-[400px] touch-none"
        ref={timelineRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-[2px] h-full bg-foreground absolute" />
        <div className="w-1/3 h-[2px] bg-foreground absolute top-0" />
        <div className="w-1/3 h-[2px] bg-foreground absolute bottom-0" />
        {sortedEvents.map((event, idx) => {
          const positionPercent = ((idx + 1) / (sortedEvents.length + 1)) * 100;
          return (
            <button
              key={event.id}
              style={{ top: `${positionPercent}%` }}
              className={`absolute w-[24px] h-[2px] md:h-[3px] bg-foreground cursor-pointer transition transform hover:scale-110 ${
                isMobile ? "" : idx % 2 === 0 ? "left-1/2" : "right-1/2"
              } ${isMobile ? "opacity-50" : ""}`}
              onClick={() => !isMobile && onEventClick(event)}
              onMouseEnter={() => !isMobile && onEventHover(event)}
              onMouseLeave={() => !isMobile && onEventHover(null)}
            />
          );
        })}
        {isMobile && (
          <div
            style={{ top: `${circlePosition}%` }}
            className="absolute w-4 h-4 bg-main rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 left-1/2 transition-all duration-200"
          />
        )}
      </div>
    </div>
  );
}