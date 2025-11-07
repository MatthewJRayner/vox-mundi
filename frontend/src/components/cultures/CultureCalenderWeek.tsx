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
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | undefined>(
    undefined
  );
  const [showModal, setShowModal] = useState(false);

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  const fetchWeekEvents = useCallback(async () => {
    const start = weekDates[0].toISOString().split("T")[0];
    const end = weekDates[6].toISOString().split("T")[0];
    try {
      const res = await api.get(`/calendar-dates/?start=${start}&end=${end}`);
      setCalendarDates(res.data);
    } catch (err) {
      console.error("Failed to load week calendar:", err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchWeekEvents();
  }, [fetchWeekEvents]);

  const handleDateClick = (date: Date) => {
    const dj = dayjs(date);
    if (!dj.isValid()) return;
    setSelectedDate(dj);
    setShowModal(true);
  };

  const handleClose = () => {
    setSelectedDate(undefined);
    setShowModal(false);
    fetchWeekEvents();
  };

  return (
    <>
      <div className="flex justify-center mb-6">
        <div className="bg-extra rounded-lg shadow-md p-2 flex gap-3">
          {weekDates.map((date) => {
            const iso = date.toISOString().split("T")[0];
            const hasEvent = calendarDates.some(
              (cd) => cd.calendar_date === iso
            );

            return (
              <button
                key={iso}
                onClick={() => handleDateClick(date)}
                className={`w-10 h-10 flex items-center text-shadow-sm hover:scale-105 transition duration-300 justify-center rounded-lg cursor-pointer
                  ${hasEvent ? "text-main" : ""}
                `}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

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
