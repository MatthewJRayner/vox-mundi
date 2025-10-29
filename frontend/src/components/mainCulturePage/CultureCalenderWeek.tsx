// components/culture/CultureCalendarWeek.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import api from "@/lib/api";
import { CalendarDate } from "@/types/calendar";
import CalendarDateModal from "@/components/calendar/CalendarDateModal";

interface Props {
  cultureCode: string;
}

export default function CultureCalendarWeek({ cultureCode }: Props) {
  const [calendarDates, setCalendarDates] = useState<CalendarDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);

  // ---------- Compute current week ----------
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  // ---------- Fetch calendar events for the week ----------
  const fetchWeekEvents = useCallback(async () => {
    const start = weekDates[0].toISOString().split("T")[0];
    const end = weekDates[6].toISOString().split("T")[0];
    try {
      const res = await api.get(
        `/calendar-dates/?start=${start}&end=${end}`
      );
      setCalendarDates(res.data);
    } catch (err) {
      console.error("Failed to load week calendar:", err);
    }
  }, []);

  useEffect(() => {
    fetchWeekEvents();
  }, [fetchWeekEvents]);

  // ---------- Handlers ----------
  const handleDateClick = (date: Date) => {
    const dj = dayjs(date);
    if (!dj.isValid()) return;
    setSelectedDate(dj);
    setShowModal(true);
  };

  const handleClose = () => {
    setSelectedDate(undefined);
    setShowModal(false);
    // refresh events in case something was added/edited
    fetchWeekEvents();
  };

  return (
    <>
      {/* Week bar */}
      <div className="flex justify-center mb-6">
        <div className="bg-white rounded-xl shadow-md p-4 flex gap-3">
          {weekDates.map((date) => {
            const iso = date.toISOString().split("T")[0];
            const hasEvent = calendarDates.some((cd) => cd.calendar_date === iso);

            return (
              <button
                key={iso}
                onClick={() => handleDateClick(date)}
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors
                  ${hasEvent ? "bg-yellow-300 hover:bg-yellow-400" : "bg-gray-100 hover:bg-gray-200"}
                `}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedDate && (
        <CalendarDateModal
          selectedDate={selectedDate}
          events={calendarDates.filter((e) =>
            dayjs(e.calendar_date).isSame(selectedDate, "day")
          )}
          onClose={handleClose}
          culture={cultureCode}
        />
      )}
    </>
  );
}