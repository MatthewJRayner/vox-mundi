"use client";

import { useEffect, useState } from "react";
import CalendarDisplay from "@/components/calendar/CalendarDisplay";
import CalendarDateModal from "@/components/calendar/CalendarDateModal";
import { CalendarDate } from "@/types/calendar";
import api from "@/lib/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import dayjs from "dayjs"; // Add this import if not already global
import { SVGPath } from "@/utils/path";

export default function CalendarPage() {
  const [calendarDates, setCalendarDates] = useState<CalendarDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | undefined>(
    undefined
  );
  const [showModal, setShowModal] = useState(false);
  const { culture } = useParams();

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

  const handleDateClick = (date: dayjs.Dayjs) => {
    setSelectedDate(date);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setSelectedDate(undefined);
    setShowModal(false);
    fetchCalendarDates();
  };

  return (
    <main className="min-h-screen p-4 flex flex-col items-center">
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
      <CalendarDisplay
        culture={culture?.toString() || ""}
        events={calendarDates}
        onDateClick={handleDateClick}
      />
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
