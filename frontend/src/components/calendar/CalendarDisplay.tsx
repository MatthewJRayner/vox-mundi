"use client";

import { useState } from "react";
import { CalendarDate } from "@/types/calendar";
import dayjs from "dayjs";
import { SVGPath } from "@/utils/path";

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
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  const daysInMonth = currentMonth.daysInMonth();
  const startDay = currentMonth.startOf("month").day();
  const monthName = currentMonth.format("MMMM YYYY");

  const nextMonth = () => setCurrentMonth(currentMonth.add(1, "month"));
  const prevMonth = () => setCurrentMonth(currentMonth.subtract(1, "month"));

  const today = dayjs(); // Current date

  const getEventsForDate = (date: number) => {
    const dayDate = currentMonth.date(date);
    return events.filter((e) => {
      if (!e.calendar_date) return false;
      const eventDate = dayjs(e.calendar_date);
      if (e.isAnnual) {
        // Fixed from isAnnual to is_annual
        return (
          eventDate.month() === dayDate.month() &&
          eventDate.date() === dayDate.date()
        );
      } else {
        return eventDate.isSame(dayDate, "day");
      }
    });
  };

  return (
    <div className="rounded-lg p-4 w-full">
      <div className="flex justify-between items-center mb-4">
        <button onClick={prevMonth}>
          <svg
            viewBox={SVGPath.chevron.viewBox}
            className="size-6 md:size-7 fill-gray-400 transition hover:scale-105 active:scale-95 cursor-pointer rotate-90"
          >
            <path d={SVGPath.chevron.path} />
          </svg>
        </button>
        <h2 className="text-2xl font-lora">{monthName}</h2>
        <button onClick={nextMonth}>
          <svg
            viewBox={SVGPath.chevron.viewBox}
            className="size-6 md:size-7 fill-gray-400 transition hover:scale-105 active:scale-95 cursor-pointer rotate-270"
          >
            <path d={SVGPath.chevron.path} />
          </svg></button>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center font-medium">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="">
            {d}
          </div>
        ))}
        {Array.from({ length: startDay }).map((_, idx) => (
          <div key={`empty-${idx}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1;
          const dayDate = currentMonth.date(day);
          const eventsForDay = getEventsForDate(day);
          const isToday = dayDate.isSame(today, "day");
          const hasEvents = eventsForDay.length > 0;

          let className = `cursor-pointer md:bg-extra rounded p-2 md:shadow-lg relative h-[50px] md:h-[105px] transition-all duration-300 `;
          if (hasEvents) {
            className += "border-main border-2 font-semibold shadow";
          }
          if (isToday) {
            className += "border-1 md:border-2 border-main ";
          } else if (!hasEvents) {
            className += "hover:opacity-75 ";
          }

          return (
            <div
              key={day}
              onClick={() => onDateClick(dayDate)}
              className={className}
            >
              <div className="md:absolute md:top-1 md:left-2 active:text-foreground/50 transition-all duration-500">
                {day}
              </div>
              {hasEvents && (
                <div className="hidden md:block absolute top-6 left-2 right-2 text-xs overflow-y-auto max-h-[70px] text-center">
                  {eventsForDay.map((event) => (
                    <div
                      key={event.id}
                      className="truncate flex flex-col space-y-2"
                    >
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
        })}
      </div>
    </div>
  );
}
