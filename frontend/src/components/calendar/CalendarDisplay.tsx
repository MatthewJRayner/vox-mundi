"use client";

import { useState, useMemo } from "react";
import { CalendarDate } from "@/types/calendar";
import dayjs from "dayjs";
import { SVGPath } from "@/utils/path";
import {
  calendarSystems,
  CalendarAdapter,
  CalendarSystem,
} from "./CalendarAdapter";

interface CalendarDisplayProps {
  culture: string;
  events: CalendarDate[];
  onDateClick: (date: dayjs.Dayjs) => void;
}

export default function CalendarDisplay({
  culture,
  events,
  onDateClick,
}: CalendarDisplayProps) {
  const [calendarType, setCalendarType] = useState<CalendarSystem>("gregorian");
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [isLoading, setIsLoading] = useState(false);

  const adapter: CalendarAdapter = calendarSystems[calendarType];
  const localNow = new Date();

  // Current calendar date details
  const { year, month, isIntercalary } = adapter.convertFromGregorian(
    currentDate.toDate()
  );

  const todayCal = adapter.convertFromGregorian(localNow); // “today” in the same calendar system

  const daysInMonth = adapter.getDaysInMonth(year, month);
  const startDay = adapter.getStartDayOfMonth(year, month);
  const monthName = adapter.getMonthName(month);

  // Navigation helper
  const changeDate = (unit: "month" | "year", amount: number) => {
    setIsLoading(true);
    setCurrentDate(currentDate.add(amount, unit));
    setTimeout(() => setIsLoading(false), 100);
  };

  // --- Get events for a date ---
  const getEventsForDate = (day: number) => {
  const { convertToGregorian, convertFromGregorian } = adapter;

  return events.filter((e) => {
    if (!e.calendar_date) return false;

    const refSystem = e.reference_system || "gregorian";
    const eventGregorian = new Date(e.calendar_date);
    const eventCal = convertFromGregorian(eventGregorian);

    // --- Annual handling ---
    if (e.isAnnual) {
      if (refSystem === calendarType) {
        // The event recurs annually *in this same system*
        return eventCal.month === month && eventCal.day === day;
      } else {
        // The event is defined in another system, so just convert its Gregorian date
        const eventConverted = convertFromGregorian(eventGregorian);
        return eventConverted.month === month && eventConverted.day === day;
      }
    }

    // --- Non-annual (specific year) ---
    return (
      eventCal.year === year &&
      eventCal.month === month &&
      eventCal.day === day
    );
  });
};

  // --- Day cells ---
  const dayCells = useMemo(() => {
    return Array.from({ length: daysInMonth }).map((_, idx) => {
      const day = idx + 1;
      const gregorianDate = adapter.convertToGregorian({ year, month, day });
      const eventsForDay = getEventsForDate(day);

      // Compare using calendar domain (not direct date)
      const isToday =
        todayCal.year === year &&
        todayCal.month === month &&
        todayCal.day === day;

      const hasEvents = eventsForDay.length > 0;

      let className =
        "cursor-pointer md:bg-extra rounded p-2 md:shadow-lg relative min-h-[50px] md:min-h-[110px] transition-all duration-300 ";
      if (hasEvents) className += "md:border-main md:border-2 font-semibold md:shadow text-main md:text-foreground ";
      if (isToday) className += "md:border-main md:border-2 text-main md:text-foreground ";
      else if (!hasEvents) className += "hover:opacity-75 ";

      return (
        <div
          key={day}
          onClick={() => onDateClick(dayjs(gregorianDate))}
          className={className}
          role="button"
          aria-label={`Select ${monthName} ${day}, ${year}${
            isIntercalary ? " (Intercalary)" : ""
          }`}
          tabIndex={0}
        >
          <div className="md:absolute md:top-1 md:left-2 text-sm md:text-base">
            {day}
          </div>
          {hasEvents && (
            <div className="hidden md:block absolute top-6 left-2 right-2 text-xs overflow-y-auto max-h-[70px] text-center">
              {eventsForDay.map((event) => (
                <div key={event.id} className="truncate flex flex-col">
                  <span className="text-sm text-main">
                    {event.holiday_name}
                  </span>
                  {event.type && <span>{event.type}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    });
  }, [daysInMonth, year, month, events, calendarType]);

  return (
    <div className="rounded-lg p-4 w-full">
      <div className="flex md:flex-row justify-center md:justify-between items-center mb-4">
        <div className="flex items-center justify-center md:justify-start space-x-2 md:space-x-3">
          <button onClick={() => changeDate("month", -1)} aria-label="Previous Month">
            <svg
              viewBox={SVGPath.chevron.viewBox}
              className="size-5 md:size-7 fill-gray-400 transition hover:scale-105 active:scale-95 cursor-pointer rotate-90"
            >
              <path d={SVGPath.chevron.path} />
            </svg>
          </button>
          <h2 className="text-base md:text-xl font-lora">
            {monthName}
          </h2>
          <button onClick={() => changeDate("month", 1)} aria-label="Next Month">
            <svg
              viewBox={SVGPath.chevron.viewBox}
              className="size-5 md:size-7 fill-gray-400 transition hover:scale-105 active:scale-95 cursor-pointer rotate-270"
            >
              <path d={SVGPath.chevron.path} />
            </svg>
          </button>
          <button onClick={() => changeDate("year", -1)} aria-label="Previous Year">
            <svg
              viewBox={SVGPath.chevron.viewBox}
              className="size-5 md:size-7 fill-gray-400 transition hover:scale-105 active:scale-95 cursor-pointer rotate-90"
            >
              <path d={SVGPath.chevron.path} />
            </svg>
          </button>
          <h2 className="text-base md:text-xl font-lora">
            {year}
          </h2>
          <button onClick={() => changeDate("year", 1)} aria-label="Next Year">
            <svg
              viewBox={SVGPath.chevron.viewBox}
              className="size-5 md:size-7 fill-gray-400 transition hover:scale-105 active:scale-95 cursor-pointer rotate-270"
            >
              <path d={SVGPath.chevron.path} />
            </svg>
          </button>
        </div>
        <div className="flex space-x-2 text-xs md:text-sm justify-end w-full ml-4 md:ml-0">
          <select
            value={calendarType}
            onChange={(e) => setCalendarType(e.target.value as CalendarSystem)}
            className="bg-extra py-2 px-3 md:pl-3 md:pr-5 rounded shadow-sm truncate"
            aria-label="Select calendar system"
          >
            <option value="gregorian">Gregorian</option>
          </select>
        </div>
      </div>

      <div className={`grid grid-cols-7 gap-2 text-center font-medium`}>
        {adapter.getWeekdayNames().map((d) => (
          <div key={d} className="text-xs md:text-sm mb-2">{d}</div>
        ))}
      </div>

      <div className={`grid grid-cols-7 gap-2 text-center md:text-left`}>
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {isLoading ? (
          <div className="col-span-7 text-center">Loading...</div>
        ) : (
          dayCells
        )}
      </div>
    </div>
  );
}
