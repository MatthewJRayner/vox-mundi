"use client";

import { useState, useMemo } from "react";
import dayjs from "dayjs";

import { CalendarDate } from "@/types/calendar";
import { SVGPath } from "@/utils/path";

/**
 * Interactive monthly calendar display for Gregorian dates.
 *
 * Shows events per day, highlights today, supports navigation and click-to-select.
 * Designed for admin/edit views — no calendar system switching.
 *
 * @param events - Array of calendar events to display
 * @param onDateClick - Called when a day is clicked, receives `dayjs` date
 *
 * @example
 * <CalendarDisplay events={events} onDateClick={openModal} />
 */

interface CalendarDisplayProps {
  events: CalendarDate[];
  onDateClick: (date: dayjs.Dayjs) => void;
}

export default function CalendarDisplay({
  events,
  onDateClick,
}: CalendarDisplayProps) {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [isLoading, setIsLoading] = useState(false);

  const year = currentDate.year();
  const month = currentDate.month();
  const today = dayjs();

  const daysInMonth = currentDate.daysInMonth();
  const firstDayOfMonth = currentDate.startOf("month").day();
  const monthName = currentDate.format("MMMM");

  const changeMonth = (amount: number) => {
    setIsLoading(true);
    setCurrentDate(currentDate.add(amount, "month"));
    setTimeout(() => setIsLoading(false), 150);
  };

  const changeYear = (amount: number) => {
    setIsLoading(true);
    setCurrentDate(currentDate.add(amount, "year"));
    setTimeout(() => setIsLoading(false), 150);
  };

  const dayCells = useMemo(() => {
    const getEventsForDay = (day: number): CalendarDate[] => {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;

      return events.filter((e) => {
        if (!e.calendar_date) return false;

        const eventDate = dayjs(e.calendar_date);
        const eventDateStr = eventDate.format("YYYY-MM-DD");

        if (e.isAnnual) {
          return eventDate.format("MM-DD") === dateStr.slice(5); // MM-DD
        }

        return eventDateStr === dateStr;
      });
    };

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = dayjs(`${year}-${month + 1}-${day}`);
      const eventsForDay = getEventsForDay(day);
      const hasEvents = eventsForDay.length > 0;
      const isToday = date.isSame(today, "day");

      const baseClass =
        "cursor-pointer md:bg-extra rounded p-2 md:p-3 relative min-h-[50px] md:min-h-[100px] transition-all duration-200";
      const interactiveClass =
        hasEvents || isToday
          ? ""
          : "hover:bg-extra/50";

      let className = `${baseClass} ${interactiveClass}`;

      if (hasEvents) className += " border-main font-semibold text-main";
      if (isToday) className += " text-main md:text-foreground md:ring-2 md:ring-main";

      return (
        <button
          key={day}
          onClick={() => onDateClick(date)}
          className={className}
          aria-label={`Select ${monthName} ${day}, ${year}`}
        >
          <div className="text-center md:absolute md:top-1 md:left-2 text-sm md:text-base font-medium">
            {day}
          </div>

          {hasEvents && (
            <div className="hidden md:block absolute top-7 left-2 right-2 text-xs space-y-1 max-h-[60px] overflow-y-auto">
              {eventsForDay.map((event) => (
                <div key={event.id} className="text-left">
                  <div className="font-medium text-sm text-main truncate">
                    {event.holiday_name}
                  </div>
                  {event.type && (
                    <div className="text-foreground/70 text-xs truncate">
                      {event.type}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </button>
      );
    });
  }, [
    year,
    month,
    daysInMonth,
    today,
    monthName,
    onDateClick,
    events,
  ]);

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="flex justify-between items-center mb-6 gap-3">
        <div className="flex items-center gap-1 md:gap-3">
          <button onClick={() => changeMonth(-1)} aria-label="Previous month">
            <svg
              viewBox={SVGPath.chevron.viewBox}
              className="size-6 fill-foreground/60 hover:fill-foreground transition cursor-pointer rotate-90"
            >
              <path d={SVGPath.chevron.path} />
            </svg>
          </button>

          <h2 className="md:text-2xl font-lora font-semibold text-center min-w-[120px]">
            {monthName}
          </h2>

          <button onClick={() => changeMonth(1)} aria-label="Next month">
            <svg
              viewBox={SVGPath.chevron.viewBox}
              className="size-6 fill-foreground/60 hover:fill-foreground transition cursor-pointer -rotate-90"
            >
              <path d={SVGPath.chevron.path} />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-1 md:gap-3">
          <button onClick={() => changeYear(-1)} aria-label="Previous year">
            <svg
              viewBox={SVGPath.chevron.viewBox}
              className="size-5 fill-foreground/60 hover:fill-foreground transition cursor-pointer rotate-90"
            >
              <path d={SVGPath.chevron.path} />
            </svg>
          </button>

          <span className="text-base md:text-xl font-medium w-16 text-center">
            {year}
          </span>

          <button onClick={() => changeYear(1)} aria-label="Next year">
            <svg
              viewBox={SVGPath.chevron.viewBox}
              className="size-5 fill-foreground/60 hover:fill-foreground transition cursor-pointer -rotate-90"
            >
              <path d={SVGPath.chevron.path} />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs md:text-sm font-medium text-foreground/70 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {/* Empty cells before month start */}
        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {isLoading ? (
          <div className="col-span-7 text-center py-8 text-foreground/50">
            Loading...
          </div>
        ) : (
          dayCells
        )}
      </div>
    </div>
  );
}
