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
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(
    null
  );
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
    if (!timelineRef.current) return;
    e.preventDefault();
    const rect = timelineRef.current.getBoundingClientRect();
    if (isMobile) {
      const touchX = e.touches[0].clientX;
      if (touchX < rect.left || touchX > rect.right) return;
      const relativeX = touchX - rect.left;
      const percent = (relativeX / rect.width) * 100;
      setDragPosition(Math.max(0, Math.min(100, percent)));
    } else {
      const touchY = e.touches[0].clientY;
      if (touchY < rect.top || touchY > rect.bottom) return;
      const relativeY = touchY - rect.top;
      const percent = (relativeY / rect.height) * 100;
      setDragPosition(Math.max(0, Math.min(100, percent)));
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!timelineRef.current) return;
    e.preventDefault();
    const rect = timelineRef.current.getBoundingClientRect();
    if (isMobile) {
      const touchX = e.touches[0].clientX;
      if (touchX < rect.left || touchX > rect.right) return;
      const relativeX = touchX - rect.left;
      const percent = (relativeX / rect.width) * 100;
      setDragPosition(Math.max(0, Math.min(100, percent)));
    } else {
      const touchY = e.touches[0].clientY;
      if (touchY < rect.top || touchY > rect.bottom) return;
      const relativeY = touchY - rect.top;
      const percent = (relativeY / rect.height) * 100;
      setDragPosition(Math.max(0, Math.min(100, percent)));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragPosition === null || !sortedEvents.length) return;
    e.preventDefault();
    const eventPositions = sortedEvents.map(
      (_, idx) => ((idx + 1) / (sortedEvents.length + 1)) * 100
    );
    const closestPositionIndex = eventPositions.reduce(
      (closestIdx, pos, idx) => {
        return Math.abs(pos - dragPosition) <
          Math.abs(eventPositions[closestIdx] - dragPosition)
          ? idx
          : closestIdx;
      },
      0
    );
    const selectedEvent = sortedEvents[closestPositionIndex];
    setSelectedEventIndex(closestPositionIndex);
    setDragPosition(eventPositions[closestPositionIndex]);
    onEventClick(selectedEvent);
  };

  const circlePosition =
    dragPosition !== null
      ? dragPosition
      : selectedEventIndex !== null
      ? ((selectedEventIndex + 1) / (sortedEvents.length + 1)) * 100
      : 50;

  return (
    <div className="flex flex-col w-full h-full">
      <div
        className="relative w-full h-[100px] md:h-[400px] touch-none flex flex-row md:flex-col items-center justify-center"
        ref={timelineRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Main timeline line */}
        <div className="h-[2px] w-full bg-foreground absolute md:w-[2px] md:h-full md:left-1/6" />
        {/* Top/left cap */}
        <div className="h-1/3 w-[2px] bg-foreground absolute left-0 md:top-0 md:w-1/3 md:h-[2px]" />
        {/* Bottom/right cap */}
        <div className="h-1/3 w-[2px] bg-foreground absolute right-0 md:bottom-0 md:left-0 md:w-1/3 md:h-[2px]" />
        {sortedEvents.map((event, idx) => {
          const positionPercent = ((idx + 1) / (sortedEvents.length + 1)) * 100;
          return (
            <button
              key={event.id}
              style={
                isMobile
                  ? { left: `${positionPercent}%` }
                  : { top: `${positionPercent}%` }
              }
              className={`absolute h-[24px] w-[2px] md:w-[24px] md:h-[2px] md:md:h-[3px] bg-foreground cursor-pointer transition transform hover:scale-110 ${
                isMobile
                  ? idx % 2 === 0
                    ? ""
                    : ""
                  : idx % 2 === 0
                  ? "left-1/6"
                  : "left-1/9"
              } ${isMobile ? "opacity-50" : ""}`}
              onClick={() => !isMobile && onEventClick(event)}
              onMouseEnter={() => !isMobile && onEventHover(event)}
              onMouseLeave={() => !isMobile && onEventHover(null)}
            />
          );
        })}
        <div
          style={
            isMobile
              ? { left: `${circlePosition}%` }
              : { top: `${circlePosition}%` }
          }
          className="absolute md:hidden w-4 h-4 bg-main rounded-full cursor-pointer transform -translate-x-1/2 md:left-1/2 md:-translate-y-1/2 transition-all duration-200"
        />
      </div>
    </div>
  );
}
