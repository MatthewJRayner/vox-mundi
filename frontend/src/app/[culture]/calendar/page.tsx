"use client";

import { useEffect, useState } from "react";
import CalendarDisplay from "@/components/calendar/CalendarDisplay";
import CalendarDateModal from "@/components/calendar/CalendarDateModal";
import { CalendarDate } from "@/types/calendar";
import api from "@/lib/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import dayjs from "dayjs";
import { SVGPath } from "@/utils/path";
import { CalendarSystem } from "@/components/calendar/CalendarAdapter";

export default function CalendarPage() {
  const [calendarDates, setCalendarDates] = useState<CalendarDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [calendarType, setCalendarType] = useState<CalendarSystem>("gregorian"); // ✅ Track active system
  const { culture } = useParams();

  // --- Fetch events ---
  const fetchCalendarDates = async () => {
    try {
      const res = await api.get(`/calendar-dates/?code=${culture}`);
      setCalendarDates(res.data);
    } catch (err) {
      console.error("Error loading calendar dates:", err);
    }
  };

  useEffect(() => {
    fetchCalendarDates();
  }, [culture]);

  // --- Handle day clicks ---
  const handleDateClick = (date: dayjs.Dayjs) => {
    setSelectedDate(date);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setSelectedDate(undefined);
    setShowModal(false);
    fetchCalendarDates(); // refresh events in case of new additions
  };

  return (
    <main className="min-h-screen p-4 flex flex-col items-center">
      {/* --- Page Header --- */}
      <div className="flex space-x-4 items-center w-fit mb-4">
        <h1 className="text-3xl font-bold font-garamond">Calendar</h1>
        <Link href={`/${culture}/calendar/edit`} title="Edit">
          <svg
            viewBox={SVGPath.edit.viewBox}
            className="size-4 md:size-5 fill-current hover:fill-primary active:primary transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            <path d={SVGPath.edit.path} />
          </svg>
        </Link>
      </div>

      {/* --- Calendar Grid --- */}
      <CalendarDisplay
        culture={culture?.toString() || ""}
        events={calendarDates}
        onDateClick={handleDateClick}
      />

      {/* --- Modal --- */}
      {showModal && selectedDate && (
        <CalendarDateModal
          selectedDate={selectedDate}
          events={calendarDates.filter((e) =>
            dayjs(e.calendar_date).isSame(selectedDate, "day")
          )}
          onClose={handleModalClose}
          culture={culture?.toString() || ""}
        />
      )}
    </main>
  );
}
